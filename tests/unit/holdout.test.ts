import test from "node:test";
import assert from "node:assert/strict";
import development from "../../data/evals/cases.json";
import holdout from "../../data/evals/holdout/cases.json";
import { evaluationCaseSchema } from "../../src/lib/evaluation/compare";
import { normalizeSources } from "../../src/lib/sources/normalize";
import { detectionRequest } from "../../src/lib/ai/detect-change-event";
import { verifyFrozenSystem } from "../../scripts/holdout-artifacts";
test("holdout is new, preauthored, schema-valid and isolated from development cases and expected labels", () => {
  verifyFrozenSystem();
  assert.equal(holdout.cases.length, 10);
  const developmentSources = development.cases.flatMap((c) =>
    c.sources.map((s) => JSON.stringify(s.data)),
  );
  for (const raw of holdout.cases) {
    const item = evaluationCaseSchema.parse(raw);
    assert.ok(!development.cases.some((c) => c.id === item.id));
    for (const source of item.sources)
      assert.ok(!developmentSources.includes(JSON.stringify(source.data)));
    for (const id of item.expected.expectedEvidenceSourceIds)
      assert.ok(item.sources.some((s) => s.id === id));
    const sources = normalizeSources(item.sources);
    const request = detectionRequest(sources);
    assert.deepEqual(
      JSON.parse(request.prompt.split("SOURCE RECORDS:\n")[1]),
      JSON.parse(JSON.stringify(sources)),
    );
    for (const field of [
      "expectedEventType",
      "shouldFlag",
      "expectedEvidenceSourceIds",
      "expectedAbstention",
      "evaluationNote",
    ])
      assert.ok(!request.prompt.includes(field));
    for (const other of holdout.cases.filter((c) => c.id !== item.id))
      assert.ok(!request.prompt.includes(other.sources[0].id));
  }
});

test("holdout artifacts reproduce the frozen comparison and preserve every original response", async () => {
  const { readVerifiedHoldout } =
    await import("../../scripts/holdout-artifacts");
  const batch = readVerifiedHoldout();
  assert.equal(batch.records.length, 10);
  assert.ok(batch.records.every((record) => record.attempt === 1));
  assert.equal(batch.summary.scoringVersion, "phase3-v1");
  assert.equal(batch.manifest.split, "holdout");
});

test("current notice branding does not alter historic source or model response wording", async () => {
  const { strawberryNotice, noticeRecord } =
    await import("../../src/lib/workflow/notice-replay");
  assert.ok(strawberryNotice.body.includes("BobsBuildings"));
  assert.ok(!strawberryNotice.body.includes("Bob Builder"));
  assert.ok(JSON.stringify(noticeRecord.output).includes("Bob Builder"));
  verifyFrozenSystem();
});

test("three promoted projects derive their scenarios and citations from preserved detections", async () => {
  const { readVerifiedProjects } =
    await import("../../scripts/project-artifacts");
  const { events, evidence } = await import("../../src/lib/fixtures");
  const bundle = readVerifiedProjects();
  const expectedTypes = [
    "differing_site_condition",
    "owner_directed_change",
    "potential_credit",
  ];
  for (const [i, record] of bundle.records.entries()) {
    assert.equal(record.validation.valid, true);
    const event = events.find((event) => event.projectId === record.caseId)!;
    assert.deepEqual(event.recordedDetection?.analysis, record.output);
    assert.equal(event.recordedDetection?.analysis.eventType, expectedTypes[i]);
    for (const id of event.evidenceIds)
      assert.ok(evidence.some((source) => source.id === id));
  }
  assert.equal(events.length, 5);
});

test("promoted notice review keeps model uncertainty human-controlled and configured amounts unchanged", async () => {
  const { events } = await import("../../src/lib/fixtures");
  const { reviewContext } =
    await import("../../src/lib/workflow/review-context");
  const { authorizeApproval } = await import("../../src/lib/workflow/approval");
  for (const id of ["blueberry-hill", "honeybee-yard"]) {
    const event = events.find((event) => event.projectId === id)!;
    const review = reviewContext(event);
    assert.equal(review.draftEligible, true);
    assert.equal(review.noticeEligible, false);
    assert.ok(review.reviewQuestions.length > 0);
    assert.throws(
      () =>
        authorizeApproval({
          reviewerRole: "project_manager",
          eventStatus: undefined,
          draftEligible: review.draftEligible,
          noticeEligible: review.noticeEligible,
          uncertaintyAcknowledged: false,
          humanConfirmed: true,
          recipient: "pm@example.com",
          body: "Reviewed provisional notice",
        }),
      /unresolved/,
    );
    assert.equal(
      event.costs.reduce((total, line) => total + line.amount, 0),
      event.exposure,
    );
  }
  const credit = events.find((event) => event.projectId === "moonbeam-garage")!;
  assert.equal(credit.exposure, -6200);
  assert.equal(reviewContext(credit).draftEligible, false);
});
