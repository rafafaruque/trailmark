import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { readVerifiedEvaluation } from "./eval-artifacts";
const actual = readVerifiedEvaluation();
assert.deepEqual(
  JSON.parse(readFileSync("data/evals/phase3-results.json", "utf8")),
  actual,
);
console.log(
  `Phase 3: ${actual.records.length} single-attempt records, isolated prompts, frozen labels/scorer, citations and measured metrics verified (${actual.summary.providerErrors} provider errors)`,
);
