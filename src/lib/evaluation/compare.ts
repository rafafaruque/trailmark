import { z } from "zod";
import { rawSourceSchema, normalizeSources } from "../sources/normalize";
import { validateDetection } from "../ai/link-evidence";
import { detectionSchema } from "../ai/schemas";

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

/** Scores only supplied outputs; it makes no provider calls and produces no invented benchmark result. */
export function compareEvaluation(testCase: EvaluationCase, output: unknown) {
  const result = validateDetection(output, normalizeSources(testCase.sources));
  const actualIds = [
    ...new Set(
      result.evidenceReferences.map((reference) => reference.sourceId),
    ),
  ].sort();
  const expectedIds = [...testCase.expected.expectedEvidenceSourceIds].sort();
  const abstains =
    result.confidence === "low" ||
    result.eventType === "ambiguous" ||
    result.missingEvidence.length > 0;
  return {
    caseId: testCase.id,
    checks: {
      shouldFlag: result.possibleChange === testCase.expected.shouldFlag,
      eventType: result.eventType === testCase.expected.expectedEventType,
      evidenceIds: JSON.stringify(actualIds) === JSON.stringify(expectedIds),
      abstention: abstains === testCase.expected.expectedAbstention,
    },
    noticeLikelihood: {
      expected: testCase.expected.noticeLikelyRequired,
      scored: false,
      reason:
        "Reserved for contract-policy evaluation with an executed clause and trigger; detection does not decide legal notice obligations.",
    },
  };
}
