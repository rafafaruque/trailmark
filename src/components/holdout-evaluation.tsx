import Link from "next/link";
import {
  evaluationSummary as summary,
  evaluationManifest as manifest,
  freeze,
} from "@/lib/evaluation/holdout-replay";
import { formatRatio } from "@/lib/evaluation/replay";
export function HoldoutEvaluation() {
  const metrics = [
    ["Precision", summary.detection.precision],
    ["Recall", summary.detection.recall],
    ["Event-type exact match", summary.eventTypeAccuracy],
    ["Evidence-source recall", summary.evidence.recall],
    ["Abstention agreement", summary.abstention.accuracy],
  ] as const;
  return (
    <section id="holdout" aria-labelledby="holdout-heading">
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">FROZEN SYSTEM · NEW CASES</span>
          <h2 id="holdout-heading">Holdout evaluation</h2>
          <p>
            Separate from the development set. No tuning, relabeling or retries
            after inference.
          </p>
        </div>
        <span className="badge neutral-badge">{manifest.id}</span>
      </div>
      <section className="panel inspection-run">
        <h3>Authored synthetic evaluation ground truth</h3>
        <p>
          Ten new cases stress contradictory records, copied directions,
          unsupported authority, original-scope work, similar events in
          different projects, credits, irrelevant clauses and document
          instructions. Expected labels were authored before inference and
          withheld from the model. They are prototype expectations, not
          expert-adjudicated legal or construction truth.
        </p>
        <p>
          {summary.attempted} cases attempted · {summary.scored} scored ·{" "}
          {summary.providerErrors} provider errors · {summary.malformedOutputs}{" "}
          malformed outputs · {summary.boundaryViolations} tool-boundary
          violations.
        </p>
        <p>
          {manifest.provider} / {manifest.model} · frozen at {freeze.frozenAt} ·
          one call per case.
        </p>
        <details>
          <summary>Frozen system fingerprints</summary>
          <pre>{JSON.stringify(freeze, null, 2)}</pre>
        </details>
      </section>
      <div className="eval-metrics">
        {metrics.map(([label, value]) => (
          <section className="panel eval-metric" key={label}>
            <h3>{label}</h3>
            <strong>{formatRatio(value)}</strong>
            <p>
              {value.denominator
                ? `${value.numerator} / ${value.denominator}`
                : "No eligible denominator"}
            </p>
          </section>
        ))}
        <section className="panel eval-metric">
          <h3>Invalid / unsupported citations</h3>
          <strong>
            {summary.scored
              ? `${summary.evidence.invalidCitationCount} / ${summary.evidence.unsupportedSourceCount}`
              : "Not available"}
          </strong>
          <p>{summary.evidence.citationCount} citations inspected</p>
          <small>Unsupported = source ID absent from supplied records</small>
        </section>
      </div>
      <section className="panel inspection-run">
        <h3>Component counts</h3>
        <p>
          {summary.detection.truePositives} TP ·{" "}
          {summary.detection.falsePositives} FP ·{" "}
          {summary.detection.trueNegatives} TN ·{" "}
          {summary.detection.falseNegatives} FN.{" "}
          {summary.evidence.unexpectedSourceCount} label-unexpected source IDs.
        </p>
        <p>
          Abstention: {summary.abstention.expectedAbstentions} expected ·{" "}
          {summary.abstention.correctAbstentions} correct ·{" "}
          {summary.abstention.missedAbstentions} missed ·{" "}
          {summary.abstention.unnecessaryAbstentions} unnecessary under the
          authored labels.
        </p>
        <p>
          The frozen abstention rule counts any missing evidence, low confidence
          or ambiguous classification. Provider/format failures are excluded
          from semantic denominators, never recast as false negatives. No
          overall score or notice-likelihood score is calculated.
        </p>
      </section>
      <section className="panel inspection-run">
        <h3>Holdout case results</h3>
        <div className="eval-table-scroll">
          <table className="eval-table holdout-table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Expected</th>
                <th>Predicted</th>
                <th>Evidence</th>
                <th>Abstention</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {summary.reports.map((r) => (
                <tr key={r.caseId}>
                  <th scope="row">
                    <Link href={`/system/evals/holdout/${r.caseId}`}>
                      {r.caseId}
                    </Link>
                  </th>
                  <td>
                    {r.expected.shouldFlag ? "Flag" : "Do not flag"}
                    <small>{r.expected.expectedEventType}</small>
                  </td>
                  <td>
                    {r.scorable
                      ? r.predicted!.possibleChange
                        ? "Flag"
                        : "Do not flag"
                      : "Unavailable"}
                    <small>{r.predicted?.eventType}</small>
                  </td>
                  <td>
                    {r.scorable
                      ? `${r.evidence.matchedIds.length}/${r.evidence.expectedIds.length} expected`
                      : "Not scored"}
                    <small>
                      {r.evidence.unexpectedIds.length} unexpected ·{" "}
                      {r.evidence.invalidCitationCount} invalid
                    </small>
                  </td>
                  <td>
                    Expected: {r.expected.expectedAbstention ? "yes" : "no"}
                    <small>
                      Predicted:{" "}
                      {r.scorable
                        ? r.predicted!.abstains
                          ? "yes"
                          : "no"
                        : "unavailable"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${r.failures.length ? "priority-high" : "priority-medium"}`}
                    >
                      {r.failures.length ? "Review findings" : "Matches labels"}
                    </span>
                    <small>{r.failures.join(", ").replaceAll("_", " ")}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel inspection-run">
        <h3>Holdout limits</h3>
        <p>
          This is a new synthetic set authored after the development results
          were known, not a blinded customer benchmark. The project pair tests
          separately scoped inputs, not mixed-project ingestion. Citation
          validity checks exact provenance, not semantic support; irrelevant
          contract selection and instruction-following are inspectable but have
          no additional judge or newly invented score. A response can match
          these component labels yet contain an undesirable interpretation.
        </p>
        <p>
          Neither these results nor the company rename changes the frozen
          detection prompt, structured schema, reliability policy or
          deterministic evaluator. Historical source and response bytes remain
          intact. Production evaluation still needs adjudicated customer project
          histories and measured PM alert burden.
        </p>
      </section>
    </section>
  );
}
