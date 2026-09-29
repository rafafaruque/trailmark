import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  evaluationSummary as summary,
  evaluationManifest as manifest,
  evaluationCompletion,
  formatRatio,
} from "@/lib/evaluation/replay";
export const metadata = { title: "Detection evaluation" };
export default function EvaluationPage() {
  const metrics = [
    ["Precision", summary.detection.precision, "TP / (TP + FP)"],
    ["Recall", summary.detection.recall, "TP / (TP + FN)"],
    [
      "Event-type accuracy",
      summary.eventTypeAccuracy,
      "Exact type matches / scored cases",
    ],
    [
      "Expected source recall",
      summary.evidence.recall,
      "Valid expected sources / expected sources",
    ],
    [
      "Abstention accuracy",
      summary.abstention.accuracy,
      "Matching abstention decisions / scored cases",
    ],
  ] as const;
  return (
    <div className="evaluation-page">
      <Link href="/system/analysis" className="back-link">
        <ArrowLeft size={15} />
        Analysis record
      </Link>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">SYSTEM REVIEW</span>
          <h1>Detection evaluation</h1>
          <p>One inference per case. Deterministic scoring. No LLM judge.</p>
        </div>
        <span className="badge neutral-badge">{manifest.id}</span>
      </div>
      <section className="panel inspection-run">
        <h2>Authored synthetic evaluation ground truth</h2>
        <p>
          These labels were authored for this prototype. They are not legal or
          construction-domain truth. Ten short synthetic scenarios measure
          agreement with those expectations, not production validity.
        </p>
        <dl className="inspection-facts">
          <div>
            <dt>Provider / model</dt>
            <dd>
              {manifest.provider} / {manifest.model}
            </dd>
          </div>
          <div>
            <dt>Completed</dt>
            <dd>{evaluationCompletion.completedAt}</dd>
          </div>
          <div>
            <dt>Cases attempted</dt>
            <dd>
              {summary.attempted} / {summary.casesInDataset}
            </dd>
          </div>
          <div>
            <dt>Cases scored</dt>
            <dd>
              {summary.scored} / {summary.attempted}
            </dd>
          </div>
          <div>
            <dt>Provider errors</dt>
            <dd>{summary.providerErrors}</dd>
          </div>
          <div>
            <dt>Malformed / boundary failures</dt>
            <dd>
              {summary.malformedOutputs} / {summary.boundaryViolations}
            </dd>
          </div>
        </dl>
      </section>
      <div className="eval-metrics">
        {metrics.map(([label, metric, formula]) => (
          <section className="panel eval-metric" key={label}>
            <h2>{label}</h2>
            <strong>{formatRatio(metric)}</strong>
            <p>
              {metric.denominator
                ? `${metric.numerator} / ${metric.denominator}`
                : "No eligible denominator"}
            </p>
            <small>{formula}</small>
          </section>
        ))}
        <section className="panel eval-metric">
          <h2>Invalid citations</h2>
          <strong>
            {summary.scored
              ? summary.evidence.invalidCitationCount
              : "Not available"}
          </strong>
          <p>
            {summary.scored
              ? `${summary.evidence.citationCount} references inspected`
              : "No eligible outputs"}
          </p>
          <small>Exact excerpt, field, source type and project checks</small>
        </section>
      </div>
      <section className="panel inspection-run">
        <h2>Component counts and coverage</h2>
        <p>
          Change detection: {summary.detection.truePositives} true positives ·{" "}
          {summary.detection.falsePositives} false positives ·{" "}
          {summary.detection.trueNegatives} true negatives ·{" "}
          {summary.detection.falseNegatives} false negatives.
        </p>
        <p>
          Evidence: {summary.evidence.unexpectedSourceCount} label-unexpected
          source IDs · {summary.evidence.unsupportedSourceCount} source IDs
          absent from supplied records. A valid but label-unexpected citation is
          reported separately from fabricated evidence.
        </p>
        <p>
          Abstention: {summary.abstention.expectedAbstentions} expected ·{" "}
          {summary.abstention.correctAbstentions} correct abstentions ·{" "}
          {summary.abstention.missedAbstentions} missed ·{" "}
          {summary.abstention.unnecessaryAbstentions} unnecessary under the
          authored labels.
        </p>
        <p>
          Provider errors, malformed outputs and tool-boundary violations are
          excluded from semantic denominators and reported separately; they are
          not false negatives. Citation failures remain visible and scored. No
          overall score is calculated.
        </p>
      </section>
      <section className="panel inspection-run">
        <h2>Case results</h2>
        <p>
          Select a case to inspect its sources, expected labels, original output
          and deterministic comparison.
        </p>
        <div className="eval-table-scroll">
          <table className="eval-table">
            <thead>
              <tr>
                {[
                  "Case",
                  "Expected",
                  "Predicted",
                  "Evidence",
                  "Abstention",
                  "Result",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.reports.map((report) => (
                <tr key={report.caseId}>
                  <th scope="row">
                    <Link href={`/system/evals/${report.caseId}`}>
                      {report.caseId}
                      <ArrowUpRight size={12} />
                    </Link>
                  </th>
                  <td>
                    {report.expected.shouldFlag ? "Flag" : "Do not flag"}
                    <small>{report.expected.expectedEventType}</small>
                  </td>
                  <td>
                    {report.predicted ? (
                      <>
                        {report.predicted.possibleChange
                          ? "Flag"
                          : "Do not flag"}
                        <small>{report.predicted.eventType}</small>
                      </>
                    ) : (
                      "Unavailable"
                    )}
                  </td>
                  <td>
                    {report.scorable
                      ? `${report.evidence.matchedIds.length}/${report.evidence.expectedIds.length} expected`
                      : "Not scored"}
                    <small>
                      {report.scorable
                        ? `${report.evidence.unexpectedIds.length} unexpected · ${report.evidence.invalidCitationCount} invalid`
                        : ""}
                    </small>
                  </td>
                  <td>
                    Expected:{" "}
                    {report.expected.expectedAbstention ? "yes" : "no"}
                    <small>
                      Predicted:{" "}
                      {report.scorable
                        ? report.predicted!.abstains
                          ? "yes"
                          : "no"
                        : "not scored"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`badge ${report.failures.length ? "priority-high" : "priority-medium"}`}
                    >
                      {report.failures.length
                        ? "Review findings"
                        : "Matches labels"}
                    </span>
                    <small>
                      {report.failures.join(", ").replaceAll("_", " ")}
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel inspection-run">
        <h2>Scoring definitions and limits</h2>
        <p>
          Abstention is the unchanged Phase 2 proxy: low confidence, ambiguous
          event type, or any missing evidence. It measures caution in output,
          not whether a notice may be sent. Source recall uses distinct expected
          IDs supported by at least one valid citation; extra IDs are counted
          separately. Exact citation checks cannot prove an interpretation is
          correct.
        </p>
        <p>
          <strong>Notice likelihood is not scored.</strong> The scenarios lack
          sufficient executed-contract and policy fixtures. No legal
          entitlement, deadline validity, pricing correctness or recovery
          probability is evaluated here.
        </p>
        <p>
          The original sources include descriptive scenario IDs and short,
          explicit text. This small authored set is not blinded or
          representative of messy customer records; one run does not measure
          variance. The PM surfacing policy below is separate from raw-model
          scoring.
        </p>
      </section>
      <section className="panel inspection-run">
        <h2>PM surfacing policy</h2>
        <p>
          A potential commercial change reaches PM review only when the schema
          and all citations validate, confidence is medium/high, the type is not
          ambiguous/planned work/contractor rework, and at least two independent
          source records support it. Low confidence, unresolved grounding or
          insufficient corroboration becomes Needs evidence; non-changes are not
          surfaced as commercial changes.
        </p>
        <p>
          Matching message IDs and exact copied content count once. This is a
          limited lineage check, not proof of real-world independence. Open
          questions remain visible. This gate never sends notice, establishes
          entitlement or approves recovery.
        </p>
      </section>
      <section className="panel inspection-run">
        <h2>Why these errors matter</h2>
        <ul className="eval-consequences">
          <li>
            <strong>Missed change:</strong> a legitimate cost may go unrecovered
            or a notice deadline may be missed.
          </li>
          <li>
            <strong>False positive:</strong> investigation consumes PM time and
            repeated noise can reduce adoption.
          </li>
          <li>
            <strong>Unsupported evidence:</strong> an indefensible conclusion
            can undermine commercial decisions and trust.
          </li>
          <li>
            <strong>Failed abstention:</strong> confident output despite unclear
            responsibility risks an unsupported notice.
          </li>
          <li>
            <strong>Unnecessary abstention:</strong> extra clarification may
            delay review and consume PM attention.
          </li>
        </ul>
        <p>
          Higher recall may capture more revenue opportunities but increase
          alert burden. Higher precision reduces noise but can miss legitimate
          changes. Next: replace these fixtures with adjudicated historical
          events from Bob Builder PMs and commercial managers; measure
          precision, recall and alerts per project before rollout.
        </p>
      </section>
    </div>
  );
}
