import { z } from "zod";
import { rawSourceSchema, normalizeSources } from "../sources/normalize";
import { resolveReference, validateDetection } from "../ai/link-evidence";
import { detectionSchema } from "../ai/schemas";

export const scoringVersion = "phase3-v1";
export const evaluationCaseSchema = z.strictObject({
  id: z.string(),
  description: z.string(),
  sources: z.array(rawSourceSchema).min(1),
  expected: z.strictObject({
    shouldFlag: z.boolean(),
    expectedEventType: detectionSchema.shape.eventType,
    expectedEvidenceSourceIds: z.array(z.string()),
    noticeLikelyRequired: z.boolean(),
    expectedAbstention: z.boolean(),
  }),
  evaluationNote: z.string(),
});
export type EvaluationCase = z.infer<typeof evaluationCaseSchema>;
export type Failure =
  | "provider_error"
  | "malformed_structured_output"
  | "inference_boundary_violation"
  | "invalid_grounding"
  | "missed_change"
  | "false_positive"
  | "wrong_event_type"
  | "missed_evidence"
  | "unexpected_evidence"
  | "unsupported_evidence"
  | "invalid_citation"
  | "failed_to_abstain"
  | "unnecessary_abstention";
export interface EvaluationObservation {
  output: unknown;
  error: string | null;
  toolCalls: number;
}

/** No inference, no judge. The pre-existing Phase 2 abstention rule is unchanged. */
export function compareEvaluation(
  testCase: EvaluationCase,
  output: unknown,
  error: string | null = null,
  toolCalls = 0,
) {
  const failures: Failure[] = [];
  const parsed = detectionSchema.safeParse(output);
  const schemaValidation = {
    valid: parsed.success,
    errors: parsed.success
      ? []
      : parsed.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        ),
  };
  const sources = normalizeSources(testCase.sources);
  const result = parsed.success ? parsed.data : null;
  const scorable = !error && !toolCalls && !!result;
  if (error) failures.push("provider_error");
  else if (toolCalls) failures.push("inference_boundary_violation");
  else if (!result) failures.push("malformed_structured_output");
  const referenceChecks = result
    ? [
        ...result.evidenceReferences,
        ...(result.relevantContract ? [result.relevantContract.reference] : []),
      ].map((reference, index) => {
        let issue: string | null = null;
        try {
          resolveReference(reference, sources, testCase.sources[0].projectId);
        } catch (error) {
          issue = error instanceof Error ? error.message : String(error);
        }
        return {
          index,
          sourceId: reference.sourceId,
          fieldPath: reference.fieldPath,
          valid: !issue,
          issue,
          fieldEvidence: index < result.evidenceReferences.length,
        };
      })
    : [];
  let groundingError: string | null = null;
  if (result) {
    try {
      validateDetection(result, sources);
    } catch (error) {
      groundingError = error instanceof Error ? error.message : String(error);
    }
  }
  const expectedIds = [
    ...new Set(testCase.expected.expectedEvidenceSourceIds),
  ].sort();
  const actualIds = [
    ...new Set(result?.evidenceReferences.map((ref) => ref.sourceId) || []),
  ].sort();
  const validIds = new Set(
    referenceChecks
      .filter((ref) => ref.valid && ref.fieldEvidence)
      .map((ref) => ref.sourceId),
  );
  const matchedIds = expectedIds.filter((id) => validIds.has(id));
  const missedIds = expectedIds.filter((id) => !validIds.has(id));
  const unexpectedIds = actualIds.filter((id) => !expectedIds.includes(id));
  const unsupportedIds = [
    ...new Set(
      referenceChecks
        .filter((ref) => !sources.some((source) => source.id === ref.sourceId))
        .map((ref) => ref.sourceId),
    ),
  ];
  const invalidCitationCount = referenceChecks.filter(
    (ref) => !ref.valid,
  ).length;
  const abstains = result
    ? result.confidence === "low" ||
      result.eventType === "ambiguous" ||
      result.missingEvidence.length > 0
    : null;
  const checks =
    scorable && result
      ? {
          shouldFlag: result.possibleChange === testCase.expected.shouldFlag,
          eventType: result.eventType === testCase.expected.expectedEventType,
          evidenceIds:
            missedIds.length === 0 &&
            unexpectedIds.length === 0 &&
            invalidCitationCount === 0,
          abstention: abstains === testCase.expected.expectedAbstention,
        }
      : null;
  if (checks && result) {
    if (!checks.shouldFlag)
      failures.push(result.possibleChange ? "false_positive" : "missed_change");
    if (!checks.eventType) failures.push("wrong_event_type");
    if (missedIds.length) failures.push("missed_evidence");
    if (unexpectedIds.length) failures.push("unexpected_evidence");
    if (unsupportedIds.length) failures.push("unsupported_evidence");
    if (invalidCitationCount) failures.push("invalid_citation");
    if (groundingError) failures.push("invalid_grounding");
    if (!checks.abstention)
      failures.push(abstains ? "unnecessary_abstention" : "failed_to_abstain");
  }
  return {
    caseId: testCase.id,
    scoringVersion,
    scorable,
    providerError: error,
    schemaValidation,
    groundingError,
    checks,
    failures,
    predicted: result
      ? {
          possibleChange: result.possibleChange,
          eventType: result.eventType,
          confidence: result.confidence,
          abstains,
        }
      : null,
    evidence: {
      expectedIds,
      actualIds,
      matchedIds,
      missedIds,
      unexpectedIds,
      unsupportedIds,
      invalidCitationCount,
      referenceChecks,
    },
    noticeLikelihood: {
      expected: testCase.expected.noticeLikelyRequired,
      scored: false as const,
      reason:
        "Contract/policy fixtures are insufficient. Detection does not decide legal notice obligations.",
    },
  };
}
export type CaseComparison = ReturnType<typeof compareEvaluation>;
export function measuredRatio(numerator: number, denominator: number) {
  return {
    numerator,
    denominator,
    value: denominator ? numerator / denominator : null,
  };
}

export function aggregateEvaluation(
  cases: EvaluationCase[],
  observations: Array<EvaluationObservation & { caseId: string }>,
) {
  if (
    new Set(observations.map((run) => run.caseId)).size !== observations.length
  )
    throw new Error("Duplicate evaluation attempts");
  const reports = observations.map((run) => {
    const item = cases.find((item) => item.id === run.caseId);
    if (!item) throw new Error(`Unknown evaluation case ${run.caseId}`);
    return {
      expected: item.expected,
      ...compareEvaluation(item, run.output, run.error, run.toolCalls),
    };
  });
  const scored = reports.filter((report) => report.scorable);
  const tp = scored.filter(
    (r) => r.expected.shouldFlag && r.predicted!.possibleChange,
  ).length;
  const fp = scored.filter(
    (r) => !r.expected.shouldFlag && r.predicted!.possibleChange,
  ).length;
  const tn = scored.filter(
    (r) => !r.expected.shouldFlag && !r.predicted!.possibleChange,
  ).length;
  const fn = scored.filter(
    (r) => r.expected.shouldFlag && !r.predicted!.possibleChange,
  ).length;
  const expectedAbstentions = scored.filter(
    (r) => r.expected.expectedAbstention,
  ).length;
  const correctAbstentions = scored.filter(
    (r) => r.expected.expectedAbstention && r.predicted!.abstains,
  ).length;
  const missedAbstentions = expectedAbstentions - correctAbstentions;
  const unnecessaryAbstentions = scored.filter(
    (r) => !r.expected.expectedAbstention && r.predicted!.abstains,
  ).length;
  return {
    scoringVersion,
    casesInDataset: cases.length,
    attempted: observations.length,
    scored: scored.length,
    providerErrors: reports.filter((r) => !!r.providerError).length,
    malformedOutputs: reports.filter((r) =>
      r.failures.includes("malformed_structured_output"),
    ).length,
    boundaryViolations: reports.filter((r) =>
      r.failures.includes("inference_boundary_violation"),
    ).length,
    detection: {
      truePositives: tp,
      falsePositives: fp,
      trueNegatives: tn,
      falseNegatives: fn,
      precision: measuredRatio(tp, tp + fp),
      recall: measuredRatio(tp, tp + fn),
    },
    eventTypeAccuracy: measuredRatio(
      scored.filter((r) => r.checks!.eventType).length,
      scored.length,
    ),
    evidence: {
      recall: measuredRatio(
        scored.reduce((n, r) => n + r.evidence.matchedIds.length, 0),
        scored.reduce((n, r) => n + r.evidence.expectedIds.length, 0),
      ),
      unexpectedSourceCount: scored.reduce(
        (n, r) => n + r.evidence.unexpectedIds.length,
        0,
      ),
      unsupportedSourceCount: scored.reduce(
        (n, r) => n + r.evidence.unsupportedIds.length,
        0,
      ),
      invalidCitationCount: scored.reduce(
        (n, r) => n + r.evidence.invalidCitationCount,
        0,
      ),
      citationCount: scored.reduce(
        (n, r) => n + r.evidence.referenceChecks.length,
        0,
      ),
    },
    abstention: {
      expectedAbstentions,
      correctAbstentions,
      missedAbstentions,
      unnecessaryAbstentions,
      accuracy: measuredRatio(
        scored.filter((r) => r.checks!.abstention).length,
        scored.length,
      ),
    },
    reports,
  };
}
