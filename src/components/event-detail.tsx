"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  Clock3,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { formatMoney, getEventEvidence, getProject } from "@/lib/fixtures";
import { resetEvent, updateEvent, useDemoState } from "@/lib/demo-store";
import type { ChangeEvent, EvidenceItem } from "@/lib/types";
import { EvidenceIcon, Modal, PriorityBadge, ProjectIcon } from "./ui";
import { EvidenceViewer } from "./evidence-viewer";
import { AnalysisEvidence } from "./analysis-evidence";
import { evidence } from "@/lib/fixtures";
import { moneyFromCents } from "@/lib/calculations/cost";

export function EventDetail({ event }: { event: ChangeEvent }) {
  const project = getProject(event.projectId);
  const items = getEventEvidence(event);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(
    null,
  );
  const [clarificationOpen, setClarificationOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [editedNote, setNote] = useState<string | null>(null);
  const state = useDemoState();
  const note =
    editedNote ??
    state[event.id]?.note ??
    (event.workflow?.reviewQuestions.length
      ? `Please confirm the following for ${project.name}:\n\n${event.workflow.reviewQuestions.map((question) => `• ${question}`).join("\n")}`
      : null) ??
    "Please confirm who directed the conduit reroute and share the written direction, email, or RFI response. We also need confirmation of responsibility for the obstruction.";
  const status = state[event.id]?.status;
  const resolved = status === "approved" || status === "dismissed";
  return (
    <>
      <Link href="/events" className="back-link">
        <ArrowLeft size={15} />
        All change events
      </Link>
      <div className="detail-header">
        <div className="detail-project">
          <ProjectIcon project={project} />
          <div>
            <div className="detail-project-line">
              <h1>{project.name}</h1>
              <span className="project-code">{project.code}</span>
            </div>
            <p>{project.subtitle}</p>
          </div>
        </div>
        <PriorityBadge priority={event.priority} />
      </div>
      <div className="detail-title-row">
        <h2>{event.title}</h2>
        <div className="detail-tags">
          <span className="badge neutral-badge">
            {event.exposure < 0 ? "Potential credit" : "Potential change"}
          </span>
          <span
            className={`confidence ${event.confidence === "Needs evidence" ? "warning" : ""}`}
          >
            <ShieldCheck size={14} />
            {event.confidence}
          </span>
        </div>
      </div>
      {status && (
        <div
          className={`status-banner ${status === "clarification-requested" ? "warm" : ""}`}
          role="status"
        >
          <CheckCheck size={19} />
          <div>
            <strong>
              {status === "approved"
                ? "Notice approved · not sent"
                : status === "dismissed"
                  ? "Marked as not a change"
                  : status === "clarification-requested"
                    ? "Clarification request prepared"
                    : "Notice draft saved for later"}
            </strong>
            <span>
              {status === "approved"
                ? "Your approval is saved in this browser. No email was sent."
                : status === "dismissed"
                  ? "This event is excluded from the active review queue and exposure."
                  : status === "clarification-requested"
                    ? "The request is saved locally. No message was sent to the field team."
                    : "Your saved draft is ready whenever you are."}
            </span>
          </div>
          <button className="text-button" onClick={() => resetEvent(event.id)}>
            Undo
          </button>
        </div>
      )}
      <div className="detail-summary-strip">
        <div>
          <span>
            {event.exposure < 0 ? "Potential credit" : "Potential exposure"}
          </span>
          <strong className={event.exposure < 0 ? "credit" : ""}>
            {formatMoney(event.exposure)}
          </strong>
        </div>
        <div>
          <span>{event.contract ? "Notice due" : "Review status"}</span>
          <strong
            className={event.contract && !resolved ? "deadline-text" : ""}
          >
            {status === "dismissed"
              ? "Not a change"
              : event.contract
                ? event.contract.deadline
                : event.status === "insufficient"
                  ? "Evidence needed"
                  : "No action required"}
          </strong>
        </div>
        <div>
          <span>Supporting evidence</span>
          <strong>
            {items.length} sources linked{" "}
            <span className="connected-dots">
              <i />
              <i />
              <i />
            </span>
          </strong>
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-main">
          <section className="panel summary-panel">
            <div className="panel-heading">
              <h2>What happened</h2>
              <span className="ai-label">
                <Sparkles size={13} />
                Evidence summary
              </span>
            </div>
            <p className="summary-copy">{event.summary}</p>
            {event.missing && (
              <div className="callout warning">
                <TriangleAlert size={17} />
                <span>
                  <strong>We need a little more context.</strong> Missing:{" "}
                  {event.missing}. Trailmark has not drafted a notice for this
                  event.
                </span>
              </div>
            )}
            <div className="summary-source">
              <span className="live-dot" />
              Based on {items.length} project records · PM verification required
            </div>
          </section>
          <AnalysisEvidence
            event={event}
            items={items}
            onOpen={setSelectedEvidence}
          />
          <section className="panel timeline-panel">
            <div className="panel-heading">
              <h2>Evidence timeline</h2>
              <span className="small-muted">Sept 28, 2026</span>
            </div>
            <p className="panel-description">
              Source records in chronological order.
            </p>
            <div className="timeline">
              {items
                .toSorted((a, b) => a.time.localeCompare(b.time))
                .map((item, index) => (
                  <button
                    key={item.id}
                    className="timeline-item"
                    onClick={() => setSelectedEvidence(item)}
                  >
                    <span className="timeline-time">{item.time}</span>
                    <span
                      className={`timeline-node ${index === items.length - 1 ? "last" : ""}`}
                    >
                      <EvidenceIcon kind={item.kind} size={18} />
                    </span>
                    <span className="timeline-content">
                      <strong>
                        {item.title}
                        <ArrowUpRight size={14} />
                      </strong>
                      <span>{item.summary}</span>
                      <small>{item.author}</small>
                    </span>
                  </button>
                ))}
            </div>
            <div className="timeline-bottom">
              <ShieldCheck size={14} />
              Open a record to verify the source.
            </div>
          </section>
          <section className="recommendation">
            <span className="recommendation-icon">
              <Sparkles size={21} />
            </span>
            <div>
              <span className="eyebrow">NEXT ACTION</span>
              <h2>Recommended action</h2>
              <p>{event.recommendation}</p>
              <div className="recommendation-actions">
                {!resolved &&
                  (event.status === "insufficient" ? (
                    <button
                      className="button primary"
                      onClick={() => setClarificationOpen(true)}
                    >
                      <MessageSquare size={16} />
                      {status === "clarification-requested"
                        ? "View clarification request"
                        : "Request clarification"}
                    </button>
                  ) : event.contract ? (
                    <Link
                      href={`/notices/${event.id}`}
                      className="button primary"
                    >
                      Review notice <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <Link
                      href="/evidence?item=mg-order"
                      className="button primary"
                    >
                      Review purchase order <ArrowRight size={16} />
                    </Link>
                  ))}
                {!resolved && (
                  <button
                    className="button quiet"
                    onClick={() => setDismissOpen(true)}
                  >
                    Mark not a change
                  </button>
                )}
                {!resolved &&
                  event.workflow?.draftEligible &&
                  event.workflow.reviewQuestions.length > 0 && (
                    <button
                      className="button secondary"
                      onClick={() => setClarificationOpen(true)}
                    >
                      Request clarification
                    </button>
                  )}
                {status === "approved" && (
                  <Link
                    href={`/notices/${event.id}`}
                    className="button primary"
                  >
                    View approved notice <ArrowRight size={16} />
                  </Link>
                )}
                {status === "dismissed" && (
                  <button
                    className="button primary"
                    onClick={() => resetEvent(event.id)}
                  >
                    Reopen for review <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          {event.contract ? (
            <section className="panel contract-panel">
              <div className="panel-heading">
                <h2>Contract impact</h2>
                <FileCheck2 size={18} />
              </div>
              <div className="deadline-callout">
                <span className="deadline-clock">
                  <Clock3 size={22} />
                </span>
                <div>
                  <strong>
                    {status === "dismissed"
                      ? "Not a change"
                      : `${event.noticeHours} hours to give notice`}
                  </strong>
                  <span>{event.contract.deadline}</span>
                </div>
              </div>
              <dl className="contract-facts">
                <div>
                  <dt>
                    {event.workflow ? "Notice indicated" : "Notice required"}
                  </dt>
                  <dd>
                    <span className="yes-dot" />
                    {event.workflow ? "Likely · verify" : "Yes"}
                  </dd>
                </div>
                <div>
                  <dt>Contract reference</dt>
                  <dd>{event.contract.clause}</dd>
                </div>
              </dl>
              {event.workflow?.deadline && (
                <div className="calculation-origin">
                  <p>
                    <span>AI identified</span>§
                    {event.workflow.analysis.relevantContract!.clauseId} ·
                    likely relevant clause
                  </p>
                  <p>
                    <span>Code calculated</span>
                    {event.workflow.deadline.triggerLabel} +{" "}
                    {event.workflow.deadline.periodHours} elapsed hours
                  </p>
                  <p>
                    <span>Source timestamp</span>
                    {
                      event.workflow.analysis.relevantContract!.trigger!
                        .sourceId
                    }{" "}
                    ·{" "}
                    {
                      event.workflow.analysis.relevantContract!.trigger!
                        .fieldPath
                    }
                  </p>
                  <p className="trigger-assumption">
                    Provisional trigger: email receipt. Confirm whether earlier
                    verbal direction or awareness starts the window sooner.
                  </p>
                </div>
              )}
              <div className="contract-excerpt">
                <div>
                  <FileCheck2 size={14} />
                  <strong>
                    {event.contract.clause} {event.contract.title}
                  </strong>
                </div>
                <blockquote>“{event.contract.excerpt}”</blockquote>
                {event.workflow ? (
                  <button
                    className="text-link"
                    onClick={() =>
                      setSelectedEvidence(
                        evidence.find(
                          (item) =>
                            item.id ===
                            event.workflow!.analysis.relevantContract!.reference
                              .sourceId,
                        )!,
                      )
                    }
                  >
                    Open contract <ArrowUpRight size={13} />
                  </button>
                ) : (
                  <span>Bob Builder subcontract</span>
                )}
              </div>
              <div className="contract-note">
                <InfoMark />
                {event.workflow
                  ? "Calculated from the documented receipt timestamp, not a definitive legal determination. Confirm the trigger and executed agreement."
                  : "Calculated from the first confirmed field direction. Verify against the executed agreement."}
              </div>
            </section>
          ) : (
            <section className="panel contract-panel">
              <div className="panel-heading">
                <h2>Contract impact</h2>
                <FileCheck2 size={18} />
              </div>
              <div className="callout subtle">
                <ShieldCheck size={20} />
                <span>
                  {event.status === "insufficient"
                    ? "Notice obligation cannot be determined until direction and responsibility are established."
                    : "No notice obligation identified in the available records. Confirm the reduction with procurement."}
                </span>
              </div>
            </section>
          )}
          <section className="panel cost-panel">
            <div className="panel-heading">
              <h2>Estimated cost</h2>
              <span className="badge neutral-badge">Preliminary</span>
            </div>
            <div className="cost-items">
              {event.costs.map((item) => (
                <div key={item.label}>
                  <span>
                    {item.label}
                    <small>{item.detail}</small>
                  </span>
                  <strong>{formatMoney(item.amount)}</strong>
                </div>
              ))}
            </div>
            <div className="cost-total">
              <span>
                {event.exposure < 0 ? "Potential credit" : "Estimated exposure"}
              </span>
              <strong>{formatMoney(event.exposure)}</strong>
            </div>
            <p className="cost-note">
              {event.status === "insufficient"
                ? "Unverified field estimate. Supporting quantities required."
                : "An estimate for review, subject to final quantities and contract terms."}
            </p>
          </section>
          {event.workflow?.cost && (
            <details className="panel calculation-details">
              <summary>View quantity and rate sources</summary>
              <p>{event.workflow.cost.scheduleReference}</p>
              {event.workflow.cost.lines.map((line) => (
                <div className="rate-source" key={line.id}>
                  <strong>
                    {line.label}
                    <span>{moneyFromCents(line.amountCents)}</span>
                  </strong>
                  <span>{line.formula}</span>
                  <p>{line.basis}</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      setSelectedEvidence(
                        evidence.find((item) => item.id === line.sourceId)!,
                      )
                    }
                  >
                    {line.sourceId === "sf-pricing"
                      ? "PM estimate worksheet"
                      : "Field quantity record"}{" "}
                    <ArrowUpRight size={12} />
                  </button>
                </div>
              ))}
              <div className="rate-source">
                <strong>
                  Contract markup{" "}
                  <span>{moneyFromCents(event.workflow.cost.markupCents)}</span>
                </strong>
                <p>
                  {event.workflow.cost.markupBasisPoints / 100}% ×{" "}
                  {moneyFromCents(event.workflow.cost.markupBaseCents)}.
                  Excludes the $60 pass-through fee under §12.6.
                </p>
                <button
                  className="text-link"
                  onClick={() =>
                    setSelectedEvidence(
                      evidence.find((item) => item.id === "sf-contract")!,
                    )
                  }
                >
                  Contract pricing rule <ArrowUpRight size={12} />
                </button>
              </div>
            </details>
          )}
          <div className="reviewer-note">
            <span className="avatar small">JL</span>
            <div>
              <strong>Assigned to Jordan Lee</strong>
              <p>PM review is required before a notice is approved.</p>
            </div>
          </div>
        </aside>
      </div>
      {selectedEvidence && (
        <EvidenceViewer
          item={selectedEvidence}
          onClose={() => setSelectedEvidence(null)}
        />
      )}
      {clarificationOpen && (
        <Modal
          title="Request field clarification"
          onClose={() => setClarificationOpen(false)}
        >
          <p className="modal-description">
            To{" "}
            {event.projectId === "strawberry-fields"
              ? "Marcus Reed"
              : "Jamie Brooks"}{" "}
            · Superintendent
            <br />
            {project.name}
          </p>
          <label className="form-label">
            What do you need to confirm?
            <textarea
              rows={6}
              value={note}
              onChange={(change) => setNote(change.target.value)}
            />
          </label>
          <div className="callout subtle">
            This request is saved in this browser. Messaging is not connected;
            no message will be sent.
          </div>
          <button
            className="button primary modal-done"
            disabled={!note.trim()}
            onClick={() => {
              updateEvent(event.id, {
                status: "clarification-requested",
                note,
              });
              setClarificationOpen(false);
            }}
          >
            Save clarification request <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {dismissOpen && (
        <Modal
          title="Mark as not a change?"
          onClose={() => setDismissOpen(false)}
        >
          <p className="modal-description">
            {event.title} will be removed from active review and the exposure
            total. Its evidence will remain available, and you can reopen it at
            any time.
          </p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDismissOpen(false)}
            >
              <X size={16} />
              Keep in review
            </button>
            <button
              className="button primary"
              onClick={() => {
                updateEvent(event.id, { status: "dismissed" });
                setDismissOpen(false);
              }}
            >
              <Check size={16} />
              Mark not a change
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function InfoMark() {
  return (
    <span className="info-mark" aria-hidden="true">
      i
    </span>
  );
}
