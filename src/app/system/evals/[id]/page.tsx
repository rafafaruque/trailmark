import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  evaluationCases,
  evaluationRecords,
  evaluationSummary,
} from "@/lib/evaluation/replay";
import { normalizeSources } from "@/lib/sources/normalize";
import { assessReliability } from "@/lib/workflow/reliability";
export const metadata = { title: "Evaluation case" };
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
  const sources = normalizeSources(item.sources);
  const policy =
    record.error || record.toolCalls
      ? {
          disposition: "needs_evidence",
          reasons: ["Inference was not eligible for PM surfacing"],
        }
      : assessReliability(record.output, sources);
  return (
    <div className="evaluation-page">
      <Link href="/system/evals" className="back-link">
        <ArrowLeft size={15} />
        All evaluation cases
      </Link>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">
            SYSTEM REVIEW · {comparison.scoringVersion}
          </span>
          <h1>{item.id}</h1>
          <p>{item.description}</p>
        </div>
      </div>
      <section className="panel inspection-run">
        <h2>Deterministic findings</h2>
        <p>
          {comparison.failures.length
            ? comparison.failures.join(" · ").replaceAll("_", " ")
            : "All scored components match the authored labels."}
        </p>
        <p>
          PM surfacing policy:{" "}
          <strong>{policy.disposition.replaceAll("_", " ")}</strong>. This is
          not a notice or recovery permission.
        </p>
        <details>
          <summary>Full deterministic comparison</summary>
          <pre>{JSON.stringify(comparison, null, 2)}</pre>
        </details>
      </section>
      <section className="panel inspection-run">
        <h2>Authored synthetic evaluation ground truth</h2>
        <p>
          Prototype expectations, not legal or construction-domain truth. These
          labels and the scorer were withheld from inference.
        </p>
        <pre>{JSON.stringify(item.expected, null, 2)}</pre>
      </section>
      <section className="panel inspection-run">
        <h2>Supplied source records</h2>
        <p>Exact input IDs: {record.inputSourceIds.join(", ")}</p>
        {item.sources.map((source) => (
          <details key={source.id}>
            <summary>
              {source.id} · {source.title}
            </summary>
            <pre>{JSON.stringify(source, null, 2)}</pre>
          </details>
        ))}
        <details>
          <summary>Exact normalized model inputs</summary>
          <pre>{JSON.stringify(sources, null, 2)}</pre>
        </details>
      </section>
      <section className="panel inspection-run">
        <h2>Original model output</h2>
        <p>
          {record.provider} / {record.model} · attempt {record.attempt} ·{" "}
          {(record.latencyMs / 1000).toFixed(2)}s ·{" "}
          {record.usage
            ? `${record.usage.inputTokens.toLocaleString()} input / ${record.usage.outputTokens.toLocaleString()} output tokens`
            : "Usage unavailable"}
        </p>
        <p>
          Provider error: {record.error || "none"} · schema:{" "}
          {record.schemaValidation.valid ? "valid" : "invalid"} · citations and
          production validation: {record.validation.valid ? "valid" : "invalid"}
        </p>
        <pre>{record.rawResponse || "No response received"}</pre>
      </section>
      <section className="panel inspection-run">
        <h2>Citation checks</h2>
        {comparison.evidence.referenceChecks.length ? (
          comparison.evidence.referenceChecks.map((ref) => (
            <p key={ref.index}>
              <strong>
                {ref.sourceId} · {ref.fieldPath}
              </strong>{" "}
              — {ref.valid ? "Exact citation resolves" : ref.issue}
            </p>
          ))
        ) : (
          <p>No schema-valid citations available.</p>
        )}
        <details>
          <summary>Recording fingerprints and validation</summary>
          <pre>
            {JSON.stringify(
              {
                startedAt: record.startedAt,
                completedAt: record.completedAt,
                inputHash: record.inputHash,
                promptHash: record.promptHash,
                schemaHash: record.schemaHash,
                responseHash: record.responseHash,
                schemaValidation: record.schemaValidation,
                validation: record.validation,
                toolCalls: record.toolCalls,
              },
              null,
              2,
            )}
          </pre>
        </details>
      </section>
    </div>
  );
}
