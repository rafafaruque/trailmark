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
    "Please confirm who directed the conduit reroute and share the written direction, email, or RFI response. We also need confirmation of responsibility for the obstruction.";
  const status = state[event.id]?.status;
  const resolved = status === "sent" || status === "dismissed";
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
              {status === "sent"
                ? "Notice approved and sent in demo"
                : status === "dismissed"
                  ? "Marked as not a change"
                  : status === "clarification-requested"
                    ? "Clarification requested in demo"
                    : "Notice draft saved for later"}
            </strong>
            <span>
              {status === "sent"
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
            {resolved
              ? "Review complete"
              : event.contract
                ? `Tomorrow · ${event.contract.deadline.split(", ")[1]}`
                : event.status === "insufficient"
                  ? "Evidence needed"
                  : "No action required"}
          </strong>
        </div>
        <div>
          <span>Supporting evidence</span>
          <strong>
            {items.length} connected records{" "}
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
          <section className="panel timeline-panel">
            <div className="panel-heading">
              <h2>Evidence timeline</h2>
              <span className="small-muted">Sept 28, 2026</span>
            </div>
            <p className="panel-description">
              The story behind the change, in the order it happened.
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
              Every finding links back to its source.
            </div>
          </section>
          <section className="recommendation">
            <span className="recommendation-icon">
              <Sparkles size={21} />
            </span>
            <div>
              <span className="eyebrow">A CLEAR NEXT STEP</span>
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
                {status === "sent" && (
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
                    {resolved
                      ? "Review complete"
                      : `${event.noticeHours} hours to give notice`}
                  </strong>
                  <span>{event.contract.deadline}</span>
                </div>
              </div>
              <dl className="contract-facts">
                <div>
                  <dt>Notice required</dt>
                  <dd>
                    <span className="yes-dot" />
                    Yes
                  </dd>
                </div>
                <div>
                  <dt>Contract reference</dt>
                  <dd>{event.contract.clause}</dd>
                </div>
              </dl>
              <div className="contract-excerpt">
                <div>
                  <FileCheck2 size={14} />
                  <strong>
                    {event.contract.clause} {event.contract.title}
                  </strong>
                </div>
                <blockquote>“{event.contract.excerpt}”</blockquote>
                <span>Bob Builder subcontract · Demo excerpt</span>
              </div>
              <div className="contract-note">
                <InfoMark />
                Calculated from the first confirmed field direction. Verify
                against the executed agreement.
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
          <div className="reviewer-note">
            <span className="avatar small">JL</span>
            <div>
              <strong>You’re in the driver’s seat.</strong>
              <p>Trailmark connects the dots. You decide what happens next.</p>
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
            To Jamie Brooks · Superintendent
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
            Demo action: the request will be saved in this browser. No message
            will be sent.
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
