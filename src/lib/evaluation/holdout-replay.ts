import dataset from "../../../data/evals/holdout/cases.json";
import bundle from "../../../data/evals/holdout/results.json";
import freeze from "../../../data/evals/holdout/freeze.json";
import { evaluationRecordSchema } from "./records";
import { evaluationCaseSchema, aggregateEvaluation } from "./compare";
export const evaluationCases = dataset.cases.map((item) =>
  evaluationCaseSchema.parse(item),
);
export const evaluationRecords = bundle.records.map((record) =>
  evaluationRecordSchema.parse(record),
);
export const evaluationSummary = aggregateEvaluation(
  evaluationCases,
  evaluationRecords,
);
export const evaluationManifest = bundle.manifest;
export { freeze };
