import { readFileSync } from "node:fs";
import dataset from "../data/evals/cases.json";
import {
  compareEvaluation,
  evaluationCaseSchema,
} from "../src/lib/evaluation/compare";

const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: npm run eval:compare -- path/to/outputs.json (array of {caseId, output}); no live provider calls",
  );
const inputs: Array<{ caseId: string; output: unknown }> = JSON.parse(
  readFileSync(path, "utf8"),
);
if (!Array.isArray(inputs))
  throw new Error("Expected an array of actual provider outputs");
const reports = inputs.map((input) => {
  const testCase = dataset.cases.find(
    (testCase) => testCase.id === input.caseId,
  );
  if (!testCase) throw new Error(`Unknown evaluation case ${input.caseId}`);
  return compareEvaluation(evaluationCaseSchema.parse(testCase), input.output);
});
console.log(
  JSON.stringify({ casesCompared: reports.length, reports }, null, 2),
);
