import dataset from "../../../data/evals/cases.json";
import bundle from "../../../data/evals/phase3-results.json";
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
export const evaluationCompletion = bundle.completion;
export function formatRatio(metric: {
  value: number | null;
  numerator: number;
  denominator: number;
}) {
  return metric.value === null
    ? "Not available"
    : `${(metric.value * 100).toFixed(1)}%`;
}
