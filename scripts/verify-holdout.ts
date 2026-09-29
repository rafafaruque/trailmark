import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { readVerifiedHoldout } from "./holdout-artifacts";
const bundle = readVerifiedHoldout();
assert.deepEqual(
  JSON.parse(readFileSync("data/evals/holdout/results.json", "utf8")),
  bundle,
);
console.log(
  `Holdout: frozen files unchanged; ${bundle.records.length} single-attempt isolated requests, response bytes and deterministic comparisons verified.`,
);
