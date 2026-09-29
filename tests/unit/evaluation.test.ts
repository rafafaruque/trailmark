import test from "node:test";
import assert from "node:assert/strict";
import dataset from "../../data/evals/cases.json";
import {
  evaluationCaseSchema,
  compareEvaluation,
  aggregateEvaluation,
} from "../../src/lib/evaluation/compare";
import { normalizeSources } from "../../src/lib/sources/normalize";
import {
  detectChangeEvent,
  detectionRequest,
} from "../../src/lib/ai/detect-change-event";
import { assessReliability } from "../../src/lib/workflow/reliability";
import type { Detection } from "../../src/lib/ai/schemas";
const cases = dataset.cases.map((value) => evaluationCaseSchema.parse(value));
// Controlled outputs exercise scorer arithmetic; these are not provider runs or reported metrics.
function output(index = 0): Detection {
  const item = cases[index];
  return {
    possibleChange: item.expected.shouldFlag,
    title: "Unit test hypothesis",
    eventType: item.expected.expectedEventType,
    shortSummary: "Unit test only",
    projectId: item.sources[0].projectId,
    estimatedEventTime: null,
    responsiblePartyHypothesis: "Unverified",
    confidence: item.expected.expectedAbstention ? "low" : "high",
    evidenceReferences: normalizeSources(item.sources)
      .filter((s) => item.expected.expectedEvidenceSourceIds.includes(s.id))
      .map((s) => ({
        sourceId: s.id,
        sourceType: s.sourceType,
        fieldPath: "body",
        excerpt: s.fields.body,
        supports: "direction",
        explanation: "Unit test reference",
      })),
    missingEvidence: [],
    recommendedNextStep: "Review",
    relevantContract: null,
  };
}
const observation = (
  index: number,
  value: unknown = output(index),
  error: string | null = null,
) => ({ caseId: cases[index].id, output: value, error, toolCalls: 0 });
test("inference request contains only normalized case sources and production instructions; no labels or other cases", async () => {
  for (const item of cases) {
    const sources = normalizeSources(item.sources);
    const request = detectionRequest(sources);
    assert.deepEqual(
      JSON.parse(request.prompt.split("SOURCE RECORDS:\n")[1]),
      JSON.parse(JSON.stringify(sources)),
    );
    for (const key of [
      "shouldFlag",
      "expectedEventType",
      "expectedEvidenceSourceIds",
      "noticeLikelyRequired",
      "expectedAbstention",
      "evaluationNote",
    ])
      assert.ok(!request.prompt.includes(key));
    const other = cases.find((c) => c.id !== item.id)!;
    assert.ok(!request.prompt.includes(other.sources[0].id));
  }
  let calls = 0;
  const run = await detectChangeEvent(
    {
      generate: async () => {
        calls++;
        return {
          provider: "test",
          model: "test",
          output: null,
          rawResponse: "",
          latencyMs: 1,
          usage: null,
          toolCalls: 0,
          error: "transport failed",
        };
      },
    },
    normalizeSources(cases[0].sources),
  );
  assert.equal(calls, 1);
  assert.equal(run.validation.valid, false);
});
test("confusion matrix, classification and abstention metrics use explicit eligible denominators", () => {
  const missed = { ...output(0), possibleChange: false };
  const falsePositive = { ...output(2), possibleChange: true };
  const report = aggregateEvaluation(cases, [
    observation(0, missed),
    observation(1),
    observation(2, falsePositive),
    observation(3),
    observation(4),
  ]);
  assert.deepEqual(
    [
      report.detection.truePositives,
      report.detection.falsePositives,
      report.detection.trueNegatives,
      report.detection.falseNegatives,
    ],
    [2, 1, 1, 1],
  );
  assert.equal(report.detection.precision.value, 2 / 3);
  assert.equal(report.detection.recall.value, 2 / 3);
  assert.equal(report.abstention.correctAbstentions, 1);
  assert.equal(report.eventTypeAccuracy.value, 1);
});
test("provider errors, malformed output and boundary failures are separate and never false negatives", () => {
  const report = aggregateEvaluation(cases, [
    observation(0, null, "offline"),
    observation(1, {}),
    { ...observation(2), toolCalls: 1 },
  ]);
  assert.equal(report.providerErrors, 1);
  assert.equal(report.malformedOutputs, 1);
  assert.equal(report.boundaryViolations, 1);
  assert.equal(report.detection.falseNegatives, 0);
  assert.equal(report.scored, 0);
  assert.equal(report.detection.recall.value, null);
  assert.equal(report.eventTypeAccuracy.value, null);
  assert.equal(report.evidence.recall.value, null);
  assert.equal(report.abstention.accuracy.value, null);
  assert.equal(aggregateEvaluation(cases, []).detection.precision.value, null);
  assert.throws(
    () => aggregateEvaluation(cases, [observation(0), observation(0)]),
    /Duplicate/,
  );
});
test("grounding counts invalid excerpts, unknown sources and label-unexpected valid sources separately", () => {
  const bad = output();
  bad.evidenceReferences[0].excerpt = "Invented quote";
  bad.evidenceReferences.push({
    ...bad.evidenceReferences[1],
    sourceId: "not-supplied",
  });
  const report = compareEvaluation(cases[0], bad);
  assert.equal(report.evidence.invalidCitationCount, 2);
  assert.deepEqual(report.evidence.matchedIds, [cases[0].sources[1].id]);
  assert.deepEqual(report.evidence.unsupportedIds, ["not-supplied"]);
  assert.ok(report.failures.includes("missed_evidence"));
  const extra = output(8);
  const s = normalizeSources(cases[8].sources)[1];
  extra.evidenceReferences.push({
    ...extra.evidenceReferences[0],
    sourceId: s.id,
    sourceType: s.sourceType,
    excerpt: s.fields.body,
  });
  const unexpected = compareEvaluation(cases[8], extra);
  assert.equal(unexpected.evidence.invalidCitationCount, 0);
  assert.equal(unexpected.evidence.unexpectedIds.length, 1);
  assert.equal(unexpected.evidence.unsupportedIds.length, 0);
});
test("abstention flags both unnecessary caution and failure to express uncertainty", () => {
  const cautious = { ...output(), missingEvidence: ["Unresolved item"] };
  assert.ok(
    compareEvaluation(cases[0], cautious).failures.includes(
      "unnecessary_abstention",
    ),
  );
  const confident = { ...output(9), confidence: "high" as const };
  assert.ok(
    compareEvaluation(cases[9], confident).failures.includes(
      "failed_to_abstain",
    ),
  );
});
test("reliability gate blocks ungrounded, low-confidence, lone and forwarded evidence without granting contractual action", () => {
  assert.equal(
    assessReliability(output(), normalizeSources(cases[0].sources)).disposition,
    "pm_review",
  );
  assert.equal(
    assessReliability(output(2), normalizeSources(cases[2].sources))
      .disposition,
    "do_not_surface",
  );
  assert.equal(
    assessReliability(output(4), normalizeSources(cases[4].sources))
      .disposition,
    "needs_evidence",
  );
  const duplicated = { ...output(7), confidence: "high" as const };
  const policy = assessReliability(
    duplicated,
    normalizeSources(cases[7].sources),
  );
  assert.equal(policy.independentRecords, 1);
  assert.equal(policy.disposition, "needs_evidence");
  assert.equal(
    assessReliability({}, normalizeSources(cases[0].sources)).disposition,
    "needs_evidence",
  );
  assert.ok(!("permissionToSend" in policy));
});

test("preserved batch is complete and reproduces metrics from original responses without inference", async () => {
  const { readVerifiedEvaluation } =
    await import("../../scripts/eval-artifacts");
  const batch = readVerifiedEvaluation();
  assert.equal(batch.records.length, 10);
  assert.equal(batch.summary.providerErrors, 0);
  assert.ok(
    batch.records.every(
      (record) =>
        record.attempt === 1 &&
        record.schemaValidation.valid &&
        record.validation.valid,
    ),
  );
  assert.equal(batch.summary.evidence.invalidCitationCount, 0);
  assert.equal(batch.summary.abstention.unnecessaryAbstentions, 4);
  assert.equal(batch.summary.evidence.unexpectedSourceCount, 1);
  assert.deepEqual(
    batch.summary.reports
      .filter((report) => report.failures.length)
      .map((report) => report.caseId),
    [
      "owner-bollards",
      "rock-condition",
      "credit-reduction",
      "unrelated-records",
    ],
  );
});
test("unavailable metric formatting never invents a zero or perfect score", async () => {
  const { formatRatio } = await import("../../src/lib/evaluation/replay");
  assert.equal(
    formatRatio({ value: null, numerator: 0, denominator: 0 }),
    "Not available",
  );
  assert.equal(formatRatio({ value: 0, numerator: 0, denominator: 2 }), "0.0%");
});
