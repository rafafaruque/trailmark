import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { readVerifiedProjects } from "./project-artifacts";
assert.deepEqual(
  JSON.parse(
    readFileSync("data/recordings/additional-projects/results.json", "utf8"),
  ),
  readVerifiedProjects(),
);
console.log(
  "Three additional project recordings verified separately from evaluation metrics.",
);
