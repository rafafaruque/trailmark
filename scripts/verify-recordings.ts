import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import {
  strawberrySources,
  cloverSources,
  projectPricing,
} from "../src/lib/sources/records";
import { validateDetection } from "../src/lib/ai/link-evidence";
import { validateNoticeNarrative } from "../src/lib/ai/draft-notice";
import { strawberryWorkflow } from "../src/lib/workflow/replay";
import type { NormalizedSource } from "../src/lib/sources/normalize";

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
function verify(id: string, sources: NormalizedSource[]) {
  const prefix = `data/recordings/${id}`;
  const record = JSON.parse(readFileSync(`${prefix}.json`, "utf8"));
  const request = JSON.parse(readFileSync(`${prefix}.request.json`, "utf8"));
  const attempt = JSON.parse(readFileSync(`${prefix}.attempt.json`, "utf8"));
  const response = readFileSync(`${prefix}.response.txt`, "utf8");
  assert.equal(record.attempt, 1);
  assert.equal(attempt.attempt, 1);
  assert.equal(record.startedAt, attempt.startedAt);
  assert.equal(record.toolCalls, 0);
  assert.equal(record.error, null);
  assert.equal(
    record.inputHash,
    hash(sources),
    `${id}: raw inputs changed since recording`,
  );
  assert.deepEqual(
    record.inputSourceIds,
    sources.map((source) => source.id),
  );
  assert.equal(record.promptHash, hash(request.prompt));
  assert.equal(record.schemaHash, hash(request.schema));
  assert.deepEqual(
    record.output,
    JSON.parse(response),
    `${id}: output differs from original provider response`,
  );
  if (record.stage === "detection") {
    assert.equal(record.validation.valid, true);
    validateDetection(record.output, sources);
  } else {
    const revision = JSON.parse(
      readFileSync(`${prefix}.validation.json`, "utf8"),
    );
    assert.equal(
      revision.responseSha256,
      createHash("sha256").update(response).digest("hex"),
    );
    assert.equal(revision.validation.valid, true);
    assert.equal(record.context.pricingHash, hash(projectPricing));
    const detection = JSON.parse(
      readFileSync("data/recordings/strawberry-fields-detection.json", "utf8"),
    );
    assert.equal(record.context.detectionOutputHash, hash(detection.output));
    assert.deepEqual(record.context.deadline, strawberryWorkflow.deadline);
    assert.deepEqual(record.context.cost, strawberryWorkflow.cost);
    validateNoticeNarrative(record.output, strawberryWorkflow, sources);
  }
  console.log(
    `${id}: original response, input fingerprints, evidence and calculations verified`,
  );
}
verify("strawberry-fields-detection", strawberrySources);
verify("clover-court-detection", cloverSources);
verify("strawberry-fields-notice", strawberrySources);
