import { test } from "node:test";
import assert from "node:assert/strict";
import { detectionSchema, type Detection } from "../../src/lib/ai/schemas";
import {
  resolveReference,
  validateDetection,
} from "../../src/lib/ai/link-evidence";
import { normalizeSources } from "../../src/lib/sources/normalize";
import {
  strawberrySources,
  strawberryRawSources,
  cloverSources,
  projectPricing,
  snapshotTime,
  projectTimezone,
} from "../../src/lib/sources/records";
import { deriveWorkflow } from "../../src/lib/workflow/derive";
import { detectionRequest } from "../../src/lib/ai/detect-change-event";
import { noticeRequest } from "../../src/lib/ai/draft-notice";

// A validator unit-test input, never a recorded AI result or production fallback.
function sample(): Detection {
  const ref = (
    id: string,
    field: string,
    supports: Detection["evidenceReferences"][number]["supports"],
  ) => {
    const source = strawberrySources.find((source) => source.id === id)!;
    return {
      sourceId: id,
      sourceType: source.sourceType,
      fieldPath: field,
      excerpt: source.fields[field],
      supports,
      explanation: "Unit-test reference",
    };
  };
  return {
    possibleChange: true,
    title: "Unit-test hypothesis",
    eventType: "owner_directed_change",
    shortSummary: "Unit-test summary",
    projectId: "strawberry-fields",
    estimatedEventTime: "2026-09-28T10:43:00-04:00",
    responsiblePartyHypothesis: "Utility direction, subject to review",
    confidence: "high",
    evidenceReferences: [
      ref("sf-email", "body", "direction"),
      ref("sf-log", "entries.2", "additional_work"),
    ],
    missingEvidence: [],
    recommendedNextStep: "PM review",
    relevantContract: {
      clauseId: "12.4",
      reference: ref("sf-contract", "clauses.2.text", "contract_terms"),
      trigger: {
        sourceId: "sf-email",
        fieldPath: "receivedAt",
        explanation: "Received direction",
      },
    },
  };
}

test("normalization preserves raw text, extra unrelated entries, and stable field paths", () => {
  const normalized = normalizeSources(strawberryRawSources);
  assert.equal(
    normalized.find((source) => source.id === "sf-log")!.fields[
      "quantities.additionalConduitFeet"
    ],
    "70",
  );
  assert.match(
    normalized.find((source) => source.id === "sf-log")!.fields["entries.3"],
    /Grounding electrode inspection/,
  );
  assert.throws(
    () => normalizeSources([strawberryRawSources[0], strawberryRawSources[0]]),
    /Duplicate source/,
  );
});

test("strict output cannot supply dates, rates, totals, entitlements, or send permissions", () => {
  for (const field of [
    "noticeDeadline",
    "totalCost",
    "rates",
    "permissionToSend",
    "entitlement",
  ])
    assert.equal(
      detectionSchema.safeParse({ ...sample(), [field]: "invented" }).success,
      false,
    );
  const prompt = detectionRequest(strawberrySources).prompt;
  assert.ok(!prompt.includes("sf-pricing"));
  assert.ok(!prompt.includes("18420"));
  assert.ok(!prompt.includes("18,420"));
});

test("all references resolve exactly, rejecting fabricated IDs, quotations, types and other projects", () => {
  const valid = sample();
  validateDetection(valid, strawberrySources);
  const ref = valid.evidenceReferences[0];
  assert.throws(() =>
    resolveReference(
      { ...ref, sourceId: "made-up" },
      strawberrySources,
      valid.projectId,
    ),
  );
  assert.throws(() =>
    resolveReference(
      { ...ref, excerpt: "approved payment of $18,420" },
      strawberrySources,
      valid.projectId,
    ),
  );
  assert.throws(() =>
    resolveReference(
      { ...ref, sourceType: "drawing" },
      strawberrySources,
      valid.projectId,
    ),
  );
  assert.throws(() => resolveReference(ref, strawberrySources, "clover-court"));
  const wrongClause = sample();
  wrongClause.relevantContract!.clauseId = "7.1";
  assert.throws(
    () => validateDetection(wrongClause, strawberrySources),
    /Clause ID/,
  );
});

test("workflow gates notice drafting on validated independent evidence, contract, deadline and costs", () => {
  const workflow = deriveWorkflow(
    sample(),
    strawberrySources,
    projectPricing,
    snapshotTime,
    projectTimezone,
  );
  assert.equal(workflow.noticeEligible, true);
  assert.equal(workflow.deadline!.deadline, "2026-09-30T14:43:00.000Z");
  assert.equal(workflow.cost!.totalCents, 1842000);
  const insufficient = sample();
  insufficient.missingEvidence = ["Need confirmation of responsibility"];
  const blocked = deriveWorkflow(
    insufficient,
    strawberrySources,
    projectPricing,
    snapshotTime,
    projectTimezone,
  );
  assert.equal(blocked.noticeEligible, false);
  assert.equal(blocked.draftEligible, true);
  assert.ok(
    noticeRequest(blocked, strawberrySources).prompt.includes("provisional"),
  );
  const forgedPricing = structuredClone(projectPricing);
  forgedPricing.markup.basisPoints = 9900;
  assert.throws(
    () =>
      deriveWorkflow(
        sample(),
        strawberrySources,
        forgedPricing,
        snapshotTime,
        projectTimezone,
      ),
    /Markup must match/,
  );
  const forgedQuantity = structuredClone(projectPricing);
  forgedQuantity.quantities[0].quantityMilli = 80000;
  assert.throws(
    () =>
      deriveWorkflow(
        sample(),
        strawberrySources,
        forgedQuantity,
        snapshotTime,
        projectTimezone,
      ),
    /Quantity does not match/,
  );
});

test("a lone field note cannot authorize a notice, even if a model reports high confidence", () => {
  const input: Detection = {
    ...sample(),
    projectId: "clover-court",
    relevantContract: null,
    evidenceReferences: [
      {
        sourceId: "cc-log",
        sourceType: "daily_log",
        fieldPath: "entries.1",
        excerpt: cloverSources[0].fields["entries.1"],
        supports: "additional_work",
        explanation: "Only one field record",
      },
    ],
  };
  const result = deriveWorkflow(
    input,
    cloverSources,
    null,
    snapshotTime,
    projectTimezone,
  );
  assert.equal(result.noticeEligible, false);
  assert.equal(result.draftEligible, false);
  assert.throws(() => noticeRequest(result, cloverSources), /Cannot draft/);
  assert.equal(result.deadline, null);
  assert.equal(result.cost, null);
  assert.ok(
    result.blockers.some((blocker) => blocker.includes("corroborating")),
  );
});
