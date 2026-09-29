import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import dataset from "../data/evals/cases.json";
import { normalizeSources } from "../src/lib/sources/normalize";
import { detectionRequest } from "../src/lib/ai/detect-change-event";
import { detectionSchema } from "../src/lib/ai/schemas";
import { validateDetection } from "../src/lib/ai/link-evidence";
import {
  evaluationCaseSchema,
  aggregateEvaluation,
} from "../src/lib/evaluation/compare";
import { evaluationRecordSchema } from "../src/lib/evaluation/records";

const directory = "data/evals/runs/phase3-v1";
const json = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const bytesHash = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");
export function readVerifiedEvaluation() {
  const manifest = json(`${directory}/manifest.json`);
  const completion = json(`${directory}/completion.json`);
  const cases = dataset.cases.map((item) => evaluationCaseSchema.parse(item));
  assert.equal(
    manifest.datasetHash,
    hash(dataset),
    "Evaluation labels or source dataset changed",
  );
  assert.equal(manifest.scoringVersion, "phase3-v1");
  assert.equal(manifest.attemptsPerCase, 1);
  assert.deepEqual(
    manifest.caseIds,
    cases.map((item) => item.id),
  );
  assert.equal(completion.casesAttempted, cases.length);
  for (const [file, fingerprint] of Object.entries(manifest.fileHashes))
    assert.equal(
      bytesHash(readFileSync(file)),
      fingerprint,
      `Frozen inference/scoring/policy file changed: ${file}`,
    );
  const records = cases.map((item) => {
    const prefix = `${directory}/${item.id}`;
    const record = evaluationRecordSchema.parse(json(`${prefix}.json`));
    const attempt = json(`${prefix}.attempt.json`);
    const sources = normalizeSources(item.sources);
    const savedInput = json(`${prefix}.input.json`);
    const savedRequest = json(`${prefix}.request.json`);
    const request = detectionRequest(sources);
    const response = readFileSync(`${prefix}.response.txt`, "utf8");
    assert.equal(attempt.attempt, 1);
    assert.equal(record.attempt, 1);
    assert.equal(attempt.caseId, item.id);
    assert.equal(record.caseId, item.id);
    assert.equal(attempt.startedAt, record.startedAt);
    assert.equal(record.provider, manifest.provider);
    assert.equal(record.model, manifest.model);
    assert.equal(record.cliVersion, manifest.cliVersion);
    assert.equal(record.inputHash, hash(sources));
    assert.equal(record.inputHash, hash(savedInput));
    assert.deepEqual(
      record.inputSourceIds,
      sources.map((source) => source.id),
    );
    // Exact equality to the unchanged production request proves no labels/scoring/other cases were appended.
    assert.deepEqual(savedRequest, request);
    assert.equal(record.promptHash, hash(savedRequest.prompt));
    assert.equal(record.schemaHash, hash(savedRequest.schema));
    assert.equal(record.rawResponse, response);
    assert.equal(record.responseHash, bytesHash(response));
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(response);
    } catch {
      /* Malformed output is retained. */
    }
    assert.deepEqual(record.output, parsed);
    const schema = detectionSchema.safeParse(record.output);
    assert.deepEqual(record.schemaValidation, {
      valid: schema.success,
      errors: schema.success
        ? []
        : schema.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
    });
    const errors: string[] = [];
    try {
      if (record.error) throw new Error(record.error);
      if (record.toolCalls)
        throw new Error(
          "Provider used tools outside the supplied source record boundary",
        );
      validateDetection(record.output, sources);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    assert.deepEqual(record.validation, { valid: !errors.length, errors });
    return record;
  });
  return {
    manifest,
    completion,
    records,
    summary: aggregateEvaluation(cases, records),
  };
}
