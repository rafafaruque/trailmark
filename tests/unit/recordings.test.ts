import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  strawberryWorkflow,
  cloverWorkflow,
  analysisRecords,
} from "../../src/lib/workflow/replay";
import {
  strawberryNotice,
  noticeRecord,
  revalidation,
} from "../../src/lib/workflow/notice-replay";
import {
  strawberrySources,
  cloverSources,
  projectPricing,
} from "../../src/lib/sources/records";
import { validateNoticeNarrative } from "../../src/lib/ai/draft-notice";
import { authorizeApproval } from "../../src/lib/workflow/approval";
import dataset from "../../data/evals/cases.json";
import { evaluationCaseSchema } from "../../src/lib/evaluation/compare";
import { events, evidence } from "../../src/lib/fixtures";

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

test("recorded detections preserve original provider bytes, input fingerprints and exact-once attempts", () => {
  for (const [record, sources] of [
    [analysisRecords.strawberry, strawberrySources],
    [analysisRecords.clover, cloverSources],
  ] as const) {
    assert.equal(record.attempt, 1);
    assert.equal(record.toolCalls, 0);
    assert.equal(record.validation.valid, true);
    assert.equal(record.error, null);
    assert.deepEqual(
      record.inputSourceIds,
      sources.map((source) => source.id),
    );
    assert.equal(record.inputHash, hash(sources));
    assert.deepEqual(
      record.output,
      JSON.parse(
        readFileSync(`data/recordings/${record.id}.response.txt`, "utf8"),
      ),
    );
    const request = JSON.parse(
      readFileSync(`data/recordings/${record.id}.request.json`, "utf8"),
    );
    assert.equal(record.promptHash, hash(request.prompt));
    assert.equal(record.schemaHash, hash(request.schema));
  }
});

test("real Strawberry result is medium confidence with open questions; provisional draft remains human-gated", () => {
  assert.equal(strawberryWorkflow.analysis.confidence, "medium");
  assert.equal(strawberryWorkflow.analysis.eventType, "owner_directed_change");
  assert.equal(
    new Set(
      strawberryWorkflow.analysis.evidenceReferences.map((ref) => ref.sourceId),
    ).size,
    4,
  );
  assert.equal(strawberryWorkflow.reviewQuestions.length, 4);
  assert.equal(strawberryWorkflow.noticeEligible, false);
  assert.equal(strawberryWorkflow.draftEligible, true);
  assert.equal(
    strawberryWorkflow.deadline!.deadline,
    "2026-09-30T14:43:00.000Z",
  );
  assert.equal(strawberryWorkflow.cost!.totalCents, 1842000);
  assert.match(strawberryNotice.body, /\$18,420/);
  assert.match(strawberryNotice.body, /remain unverified/);
  assert.match(strawberryNotice.body, /reserves its contractual rights/);
});

test("notice contract citation regression: retrieved contract is valid supporting evidence; original failure stays visible", () => {
  assert.equal(noticeRecord.validation.valid, false);
  assert.equal(revalidation.validation.valid, true);
  assert.equal(noticeRecord.context.pricingHash, hash(projectPricing));
  const response = readFileSync(
    "data/recordings/strawberry-fields-notice.response.txt",
    "utf8",
  );
  assert.equal(
    revalidation.responseSha256,
    createHash("sha256").update(response).digest("hex"),
  );
  assert.deepEqual(noticeRecord.output, JSON.parse(response));
  const draft = validateNoticeNarrative(
    noticeRecord.output,
    strawberryWorkflow,
    strawberrySources,
  );
  assert.ok(
    draft.evidenceReferences.some((ref) => ref.sourceId === "sf-contract"),
  );
  const forged = structuredClone(draft);
  forged.evidenceReferences[0].sourceId = "cc-log";
  assert.throws(
    () =>
      validateNoticeNarrative(forged, strawberryWorkflow, [
        ...strawberrySources,
        ...cloverSources,
      ]),
    /not linked/,
  );
  assert.throws(
    () =>
      validateNoticeNarrative(
        { ...draft, eventNarrative: "We demand $50000" },
        strawberryWorkflow,
        strawberrySources,
      ),
    /financial/,
  );
});

test("real Clover result abstains and never has a calculated cost, deadline or notice", () => {
  assert.equal(cloverWorkflow.analysis.possibleChange, true);
  assert.equal(cloverWorkflow.analysis.confidence, "low");
  assert.equal(cloverWorkflow.analysis.eventType, "ambiguous");
  assert.ok(cloverWorkflow.reviewQuestions.length >= 3);
  assert.equal(cloverWorkflow.draftEligible, false);
  assert.equal(cloverWorkflow.noticeEligible, false);
  assert.equal(cloverWorkflow.deadline, null);
  assert.equal(cloverWorkflow.cost, null);
});

test("code requires a PM, explicit review and uncertainty acknowledgment; it never sends", () => {
  const input = {
    reviewerRole: "project_manager" as const,
    eventStatus: undefined,
    noticeEligible: false,
    draftEligible: true,
    humanConfirmed: true,
    uncertaintyAcknowledged: true,
    recipient: "morgan@example.com",
    body: strawberryNotice.body,
  };
  assert.deepEqual(authorizeApproval(input), {
    status: "approved",
    delivery: "not_connected",
  });
  assert.throws(
    () => authorizeApproval({ ...input, humanConfirmed: false }),
    /explicitly/,
  );
  assert.throws(
    () => authorizeApproval({ ...input, reviewerRole: "viewer" }),
    /project manager/,
  );
  assert.throws(
    () => authorizeApproval({ ...input, uncertaintyAcknowledged: false }),
    /unresolved/,
  );
  assert.throws(
    () => authorizeApproval({ ...input, draftEligible: false }),
    /prerequisites/,
  );
  assert.throws(
    () => authorizeApproval({ ...input, eventStatus: "dismissed" }),
    /Reopen/,
  );
  assert.throws(
    () => authorizeApproval({ ...input, recipient: "bad" }),
    /recipient/,
  );
});

test("all five events remain and every displayed evidence ID resolves", () => {
  assert.equal(events.length, 5);
  for (const event of events)
    for (const id of event.evidenceIds)
      assert.ok(
        evidence.some((item) => item.id === id && item.eventId === event.id),
      );
  assert.equal(events[0].title, analysisRecords.strawberry.output.title);
  assert.equal(events[3].title, analysisRecords.clover.output.title);
});

test("ten independently authored evaluation cases have valid raw sources and resolvable expected IDs", () => {
  assert.equal(dataset.cases.length, 10);
  assert.equal(dataset.status, "not_run");
  for (const value of dataset.cases) {
    const item = evaluationCaseSchema.parse(value);
    assert.ok(item.sources.every((source) => source.projectId === item.id));
    for (const id of item.expected.expectedEvidenceSourceIds)
      assert.ok(item.sources.some((source) => source.id === id));
  }
  assert.ok(dataset.cases.some((item) => !item.expected.shouldFlag));
  assert.ok(dataset.cases.some((item) => item.expected.expectedAbstention));
});
