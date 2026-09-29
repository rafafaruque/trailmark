import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import dataset from "../data/raw/additional-projects/sources.json";
import freeze from "../data/evals/holdout/freeze.json";
import { normalizeSources } from "../src/lib/sources/normalize";
import { detectionRequest } from "../src/lib/ai/detect-change-event";
import { detectionSchema } from "../src/lib/ai/schemas";
import { validateDetection } from "../src/lib/ai/link-evidence";
import { evaluationRecordSchema } from "../src/lib/evaluation/records";
import { verifyFrozenSystem } from "./holdout-artifacts";
const directory = "data/recordings/additional-projects";
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function readVerifiedProjects() {
  verifyFrozenSystem();
  const manifest = json(`${directory}/manifest.json`);
  const completion = json(`${directory}/completion.json`);
  assert.equal(manifest.datasetHash, hash(dataset));
  assert.equal(manifest.freezeHash, hash(freeze));
  assert.deepEqual(manifest.fileHashes, freeze.fileHashes);
  assert.deepEqual(
    manifest.caseIds,
    dataset.cases.map((c) => c.id),
  );
  assert.equal(completion.casesAttempted, 3);
  const records = dataset.cases.map((item) => {
    const prefix = `${directory}/${item.id}`;
    const record = evaluationRecordSchema.parse(json(`${prefix}.json`));
    const attempt = json(`${prefix}.attempt.json`);
    const sources = normalizeSources(item.sources);
    const request = detectionRequest(sources);
    const raw = readFileSync(`${prefix}.response.txt`, "utf8");
    assert.equal(record.caseId, item.id);
    assert.equal(record.attempt, 1);
    assert.equal(attempt.attempt, 1);
    assert.equal(attempt.startedAt, record.startedAt);
    assert.equal(record.model, manifest.model);
    assert.equal(record.provider, manifest.provider);
    assert.equal(record.inputHash, hash(sources));
    assert.equal(record.inputHash, hash(json(`${prefix}.input.json`)));
    assert.deepEqual(
      record.inputSourceIds,
      sources.map((s) => s.id),
    );
    assert.deepEqual(json(`${prefix}.request.json`), request);
    assert.equal(record.promptHash, hash(request.prompt));
    assert.equal(record.schemaHash, hash(request.schema));
    assert.equal(record.rawResponse, raw);
    assert.equal(
      record.responseHash,
      createHash("sha256").update(raw).digest("hex"),
    );
    let output: unknown = null;
    try {
      output = JSON.parse(raw);
    } catch {}
    assert.deepEqual(record.output, output);
    const parsed = detectionSchema.safeParse(output);
    assert.deepEqual(record.schemaValidation, {
      valid: parsed.success,
      errors: parsed.success
        ? []
        : parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
    const errors: string[] = [];
    try {
      if (record.error) throw new Error(record.error);
      if (record.toolCalls)
        throw new Error(
          "Provider used tools outside the supplied source record boundary",
        );
      validateDetection(output, sources);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    assert.deepEqual(record.validation, { valid: !errors.length, errors });
    return record;
  });
  return { manifest, completion, records };
}
