import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  CheckCheck,
  Database,
  ShieldCheck,
} from "lucide-react";
import {
  analysisRecords,
  strawberryWorkflow,
  cloverWorkflow,
} from "@/lib/workflow/replay";
import { noticeRecord, revalidation } from "@/lib/workflow/notice-replay";
import {
  strawberrySources,
  cloverSources,
  projectPricing,
} from "@/lib/sources/records";
import dataset from "../../../../data/evals/cases.json";
import { moneyFromCents } from "@/lib/calculations/cost";

export const metadata = { title: "Analysis record" };

export default function AnalysisPage() {
  const records = [
    analysisRecords.strawberry,
    analysisRecords.clover,
    noticeRecord,
  ];
  return (
    <>
      <Link href="/" className="back-link">
        <ArrowLeft size={15} />
        Workspace overview
      </Link>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">TECHNICAL INSPECTION</span>
          <h1>Recorded analysis</h1>
          <p>
            Real provider responses against synthetic source records. Hosted
            replay; no live inference.
          </p>
        </div>
        <span className="badge priority-medium">
          <CheckCheck size={14} />
          Detection run once per project
        </span>
      </div>
      <div className="inspection-summary">
        <section className="panel">
          <ShieldCheck size={21} />
          <h2>Model interpretation</h2>
          <p>
            Four distinct field sources linked. Strawberry Fields: medium
            confidence, with {strawberryWorkflow.reviewQuestions.length}{" "}
            unresolved questions. Clover Court: low confidence; notice
            preparation blocked.
          </p>
        </section>
        <section className="panel">
          <Database size={21} />
          <h2>Deterministic calculations</h2>
          <p>
            {strawberryWorkflow.deadline!.triggerLabel} + 48 elapsed hours ={" "}
            {strawberryWorkflow.deadline!.deadlineLabel}.{" "}
            {moneyFromCents(strawberryWorkflow.cost!.totalCents)} from
            configured quantities, rates and markup.
          </p>
        </section>
      </div>
      <section className="panel inspection-flow">
        <h2>Execution boundary</h2>
        <p>
          Raw sources → normalization → recorded detection and exact citation
          validation → contract selection → TypeScript deadline and cost →
          provisional notice → explicit PM review. Sending is not connected.
        </p>
        <p>
          Draft preparation does not establish entitlement or clear unresolved
          evidence. Approval requires PM confirmation and acknowledgment of
          provisional assumptions. This local review policy is not
          authentication.
        </p>
      </section>
      {records.map((record) => (
        <section className="panel inspection-run" key={record.id}>
          <div className="panel-heading">
            <h2>{record.id}</h2>
            <span
              className={`badge ${record.validation.valid ? "priority-medium" : "priority-high"}`}
            >
              {record.validation.valid
                ? "Validated at recording"
                : "Original failure retained · revalidated"}
            </span>
          </div>
          <dl className="inspection-facts">
            <div>
              <dt>Provider / model</dt>
              <dd>
                {record.provider} / {record.model}
              </dd>
            </div>
            <div>
              <dt>Recorded at</dt>
              <dd>{record.startedAt}</dd>
            </div>
            <div>
              <dt>Latency</dt>
              <dd>{(record.latencyMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Usage</dt>
              <dd>
                {record.usage?.inputTokens.toLocaleString()} input ·{" "}
                {record.usage?.outputTokens.toLocaleString()} output tokens
              </dd>
            </div>
            <div>
              <dt>Attempt / tool calls</dt>
              <dd>
                {record.attempt} / {record.toolCalls}
              </dd>
            </div>
            <div>
              <dt>Source IDs</dt>
              <dd>{record.inputSourceIds.join(", ")}</dd>
            </div>
          </dl>
          <details>
            <summary>Structured response</summary>
            <pre>{JSON.stringify(record.output, null, 2)}</pre>
          </details>
          <details>
            <summary>Validation and input fingerprints</summary>
            <pre>
              {JSON.stringify(
                {
                  originalValidation: record.validation,
                  currentValidation:
                    record.id === noticeRecord.id
                      ? revalidation
                      : record.validation,
                  inputHash: record.inputHash,
                  promptHash: record.promptHash,
                  schemaHash: record.schemaHash,
                  error: record.error,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </section>
      ))}
      <section className="panel inspection-run">
        <h2>Raw inputs and calculations</h2>
        <p>
          The source fixtures do not import or embed a generated event. Pricing
          is withheld from detection and is never supplied by the model.
        </p>
        <details>
          <summary>Normalized source records</summary>
          <pre>
            {JSON.stringify([...strawberrySources, ...cloverSources], null, 2)}
          </pre>
        </details>
        <details>
          <summary>Configured pricing and deterministic result</summary>
          <pre>
            {JSON.stringify(
              {
                pricing: projectPricing,
                deadline: strawberryWorkflow.deadline,
                cost: strawberryWorkflow.cost,
                cloverBlockers: cloverWorkflow.blockers,
              },
              null,
              2,
            )}
          </pre>
        </details>
      </section>
      <section className="panel inspection-run">
        <h2>Detection evaluation</h2>
        <p>
          {dataset.cases.length} synthetic cases with preserved inference
          results and deterministic component metrics. Expected labels are
          prototype fixtures.
        </p>
        <Link href="/system/evals" className="text-link">
          Open measured evaluation <ArrowUpRight size={14} />
        </Link>
        <div className="eval-labels">
          {dataset.cases.map((item) => (
            <span className="badge neutral-badge" key={item.id}>
              {item.id}
            </span>
          ))}
        </div>
        <details>
          <summary>Expected case labels</summary>
          <pre>
            {JSON.stringify(
              dataset.cases.map((item) => ({
                id: item.id,
                expected: item.expected,
              })),
              null,
              2,
            )}
          </pre>
        </details>
        <Link
          href="/events/strawberry-fields-transformer-relocation"
          className="text-link"
        >
          Open the PM review <ArrowUpRight size={14} />
        </Link>
      </section>
    </>
  );
}
