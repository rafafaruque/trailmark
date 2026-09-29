import { readFileSync } from "node:fs";
import { z } from "zod";
import dataset from "../data/evals/cases.json";
import {
  aggregateEvaluation,
  evaluationCaseSchema,
} from "../src/lib/evaluation/compare";
const path = process.argv[2];
if (!path)
  throw new Error(
    "Usage: npm run eval:compare -- path/to/outputs.json (array of {caseId, output, error?, toolCalls?}); no live provider calls",
  );
const observations = z
  .array(
    z.object({
      caseId: z.string(),
      output: z.unknown(),
      error: z.string().nullable().default(null),
      toolCalls: z.number().int().nonnegative().default(0),
    }),
  )
  .parse(JSON.parse(readFileSync(path, "utf8")));
console.log(
  JSON.stringify(
    aggregateEvaluation(
      dataset.cases.map((item) => evaluationCaseSchema.parse(item)),
      observations,
    ),
    null,
    2,
  ),
);
