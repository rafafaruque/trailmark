import { notFound } from "next/navigation";
import {
  evaluationCases,
  evaluationRecords,
  evaluationSummary,
} from "@/lib/evaluation/holdout-replay";
import { EvaluationCaseView } from "@/components/evaluation-case";
export const metadata = { title: "Holdout evaluation case" };
export function generateStaticParams() {
  return evaluationCases.map((item) => ({ id: item.id }));
}
export default async function EvaluationCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = evaluationCases.find((item) => item.id === id);
  const record = evaluationRecords.find((record) => record.caseId === id);
  const comparison = evaluationSummary.reports.find(
    (report) => report.caseId === id,
  );
  if (!item || !record || !comparison) notFound();
  return (
    <EvaluationCaseView
      item={item}
      record={record}
      comparison={comparison}
      backHref="/system/evals#holdout"
      backLabel="All holdout cases"
      splitLabel="HOLDOUT EVALUATION"
    />
  );
}
