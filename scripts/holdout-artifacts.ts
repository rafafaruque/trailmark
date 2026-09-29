import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import dataset from "../data/evals/holdout/cases.json";
import freeze from "../data/evals/holdout/freeze.json";
import { readVerifiedEvaluation } from "./eval-artifacts";
export function verifyFrozenSystem() {
  for (const [path, digest] of Object.entries(freeze.fileHashes))
    assert.equal(
      createHash("sha256").update(readFileSync(path)).digest("hex"),
      digest,
      `Frozen system changed: ${path}`,
    );
}
export function readVerifiedHoldout() {
  verifyFrozenSystem();
  const batch = readVerifiedEvaluation(
    dataset,
    "data/evals/runs/phase4-holdout-v1",
  );
  assert.equal(batch.manifest.split, "holdout");
  assert.equal(
    batch.manifest.freezeHash,
    createHash("sha256").update(JSON.stringify(freeze)).digest("hex"),
  );
  assert.deepEqual(batch.manifest.fileHashes, freeze.fileHashes);
  assert.ok(
    new Date(freeze.frozenAt).getTime() <
      new Date(dataset.authoredAt).getTime(),
  );
  assert.ok(
    new Date(dataset.authoredAt).getTime() <
      new Date(batch.manifest.startedAt).getTime(),
  );
  return batch;
}
