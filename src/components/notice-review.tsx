"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Clock3,
  FileText,
  Pencil,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { formatMoney, getProject } from "@/lib/fixtures";
import type { ChangeEvent, DraftNotice } from "@/lib/types";
import { updateEvent, useDemoState } from "@/lib/demo-store";
import { Modal, ProjectIcon } from "./ui";
import { reviewContext } from "@/lib/workflow/review-context";
import { authorizeApproval } from "@/lib/workflow/approval";

export function NoticeReview({
  event,
  draft,
}: {
  event: ChangeEvent;
  draft: DraftNotice;
}) {
  const workflow = reviewContext(event);
  const state = useDemoState();
  const saved = state[event.id];
  const project = getProject(event.projectId);
  const [body, setBody] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [humanConfirmed, setHumanConfirmed] = useState(false);
  const [uncertaintyAcknowledged, setUncertaintyAcknowledged] = useState(false);
  const [approvalError, setApprovalError] = useState("");
  const currentBody = body ?? saved?.body ?? draft.body;
  const currentRecipient = recipient ?? saved?.recipient ?? draft.email;
  const approved = saved?.status === "approved";
  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentRecipient) &&
    currentBody.trim().length > 0;
  function save() {
    updateEvent(event.id, {
      body: currentBody,
      recipient: currentRecipient,
      status: "saved",
    });
    setEditing(false);
    setFeedback(
      "Draft saved in this browser. You can come back to it anytime.",
    );
  }
  if (saved?.status === "dismissed" || workflow.draftEligible === false)
    return (
      <>
        <Link className="back-link" href={`/events/${event.id}`}>
          <ArrowLeft size={15} />
          Back to change event
        </Link>
        <div className="page-intro secondary-intro">
          <div>
            <span className="eyebrow">REVIEW CLOSED</span>
            <h1>
              {saved?.status === "dismissed"
                ? "This event was marked not a change"
                : "More evidence is required"}
            </h1>
            <p>
              Reopen the event for review before editing or approving its
              notice.
            </p>
          </div>
        </div>
        <Link className="button primary" href={`/events/${event.id}`}>
          View change record <ArrowRight size={16} />
        </Link>
      </>
    );
  return (
    <>
      <Link className="back-link" href={`/events/${event.id}`}>
        <ArrowLeft size={15} />
        Back to change event
      </Link>
      <div className="page-intro secondary-intro notice-intro">
        <div>
          <span className="eyebrow">CONTRACTUAL NOTICE</span>
          <h1>{approved ? "Notice approved" : "Review your notice"}</h1>
          <p>
            {approved
              ? "Approval recorded. Delivery is pending."
              : "Review the recipient, supporting evidence and estimated impact."}
          </p>
        </div>
        <span
          className={`badge ${approved ? "priority-medium" : "neutral-badge"}`}
        >
          <span className="badge-dot" />
          {approved
            ? "Approved · not sent"
            : saved?.status === "saved"
              ? "Saved draft"
              : "Draft · needs approval"}
        </span>
      </div>
      {approved && (
        <div className="status-banner" role="status">
          <CheckCheck size={22} />
          <div>
            <strong>Notice approved for sending</strong>
            <span>
              Your approval is recorded in this browser. Delivery is not
              connected, so no email has been sent and the notice deadline
              remains open.
            </span>
          </div>
          <Link className="text-link" href="/">
            Back to overview <ArrowRight size={15} />
          </Link>
        </div>
      )}
      {feedback && !approved && (
        <div className="status-banner" role="status">
          <Check size={18} />
          <span>{feedback}</span>
        </div>
      )}
      {!!workflow.reviewQuestions.length && (
        <div className="notice-review-warning">
          <ShieldCheck size={19} />
          <div>
            <strong>
              Provisional notice · {workflow.analysis!.confidence} confidence
            </strong>
            <p>
              Review the open evidence and responsibility questions below before
              approval.
            </p>
            <details>
              <summary>
                Review {workflow.reviewQuestions.length} open items
              </summary>
              <ul>
                {workflow.reviewQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </details>
          </div>
        </div>
      )}
      <div className="notice-grid">
        <div className="notice-paper">
          <div className="notice-paper-top">
            <div className="letter-brand">
              <span className="workspace-logo">
                b<span>b</span>
              </span>
              <div>
                <strong>BobsBuildings</strong>
                <span>INFRASTRUCTURE</span>
              </div>
            </div>
            <div>
              <span>FORMAL PROJECT CORRESPONDENCE</span>
              <strong>September 29, 2026</strong>
            </div>
          </div>
          <div className="notice-recipient">
            <div>
              <label>TO</label>
              {editing ? (
                <input
                  aria-label="Recipient email"
                  type="email"
                  value={currentRecipient}
                  onChange={(change) => setRecipient(change.target.value)}
                />
              ) : (
                <>
                  <strong>
                    {draft.recipient} <span>· {draft.recipientRole}</span>
                  </strong>
                  <span>{currentRecipient}</span>
                </>
              )}
            </div>
            <div>
              <label>PROJECT</label>
              <strong>{project.name}</strong>
              <span>
                {project.subtitle} · {project.code}
              </span>
            </div>
          </div>
          <div className="notice-subject">
            <span className="eyebrow">NOTICE OF POTENTIAL CHANGE</span>
            <h2>{event.title}</h2>
            <p>
              Reference: {event.contract!.clause} {event.contract!.title}
            </p>
          </div>
          {editing ? (
            <label className="form-label letter-editor">
              Notice body
              <textarea
                aria-label="Notice body"
                value={currentBody}
                onChange={(change) => setBody(change.target.value)}
                rows={22}
              />
            </label>
          ) : (
            <div className="letter-body">
              {currentBody.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
          <div className="letter-bottom">
            <FileText size={14} />
            <span>
              Supporting evidence: {event.evidenceIds.length} linked records
            </span>
            <Link href={`/events/${event.id}`}>
              Review evidence <ArrowRight size={13} />
            </Link>
          </div>
        </div>
        <aside className="notice-aside">
          <section className="panel notice-checklist">
            <div className="panel-heading">
              <h2>Ready for your review</h2>
              <ShieldCheck size={20} />
            </div>
            <div className="notice-project">
              <ProjectIcon small project={project} />
              <div>
                <strong>{project.name}</strong>
                <span>{project.subtitle}</span>
              </div>
            </div>
            <div className="notice-fact">
              <span>Estimated exposure</span>
              <strong>{formatMoney(event.exposure)}</strong>
            </div>
            <div className="notice-deadline">
              <Clock3 size={18} />
              <div>
                <strong>Notice due {event.contract!.deadline}</strong>
                <span>
                  {event.noticeHours} hours remaining · Sept 29 snapshot
                </span>
              </div>
            </div>
            <ul className="checklist">
              <li>
                <Check size={15} />
                Event summary included
              </li>
              <li>
                <Check size={15} />
                Contract clause referenced
              </li>
              <li>
                <Check size={15} />
                Preliminary cost stated
              </li>
              <li>
                <Check size={15} />
                Rights expressly reserved
              </li>
            </ul>
            <div className="notice-demo-note">
              <ShieldCheck size={15} />
              <p>
                PM approval is required. Delivery is not connected; approval
                records your decision without sending an email.
              </p>
            </div>
            {!approved && (
              <div className="notice-buttons">
                <button
                  className="button primary"
                  disabled={!valid}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Send size={16} />
                  Approve & send
                  <ArrowRight size={15} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => (editing ? save() : setEditing(true))}
                  disabled={editing && !valid}
                >
                  {editing ? <Check size={16} /> : <Pencil size={16} />}
                  {editing ? "Save edits" : "Edit draft"}
                </button>
                <button
                  className="button quiet"
                  disabled={!valid}
                  onClick={save}
                >
                  <Save size={16} />
                  Save for later
                </button>
              </div>
            )}
            {approved && (
              <Link className="button secondary" href={`/events/${event.id}`}>
                View change record <ArrowRight size={16} />
              </Link>
            )}
            {!valid && (
              <p role="alert" className="field-error">
                Enter a valid recipient email and a notice body.
              </p>
            )}
          </section>
          <p className="notice-side-caption">
            Approval owner: Jordan Lee
            <br />
            Delivery status: not connected
          </p>
        </aside>
      </div>
      {confirmOpen && (
        <Modal
          title="Approve this notice?"
          onClose={() => setConfirmOpen(false)}
        >
          <div className="confirm-recipient">
            <Send size={22} />
            <div>
              <strong>{draft.recipient}</strong>
              <span>{currentRecipient}</span>
            </div>
          </div>
          <p className="modal-description">
            Approve the notice for <strong>{project.name}</strong>, including
            the preliminary {formatMoney(event.exposure)} exposure and
            reservation of rights.
          </p>
          <div className="callout subtle">
            Delivery is not connected; no email will be sent. Approval is saved
            locally and does not close the notice deadline.
          </div>
          <label className="review-checkbox">
            <input
              type="checkbox"
              checked={humanConfirmed}
              onChange={(change) => setHumanConfirmed(change.target.checked)}
            />
            I have reviewed the recipient, notice and supporting records.
          </label>
          {workflow && !workflow.noticeEligible && (
            <label className="review-checkbox">
              <input
                type="checkbox"
                checked={uncertaintyAcknowledged}
                onChange={(change) =>
                  setUncertaintyAcknowledged(change.target.checked)
                }
              />
              I have reviewed the unresolved scope, authority and trigger
              assumptions and approve this as a provisional notice.
            </label>
          )}
          {approvalError && (
            <p className="field-error" role="alert">
              {approvalError}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmOpen(false)}
            >
              Keep reviewing
            </button>
            <button
              className="button primary"
              disabled={
                !humanConfirmed ||
                (!!workflow &&
                  !workflow.noticeEligible &&
                  !uncertaintyAcknowledged)
              }
              onClick={() => {
                try {
                  authorizeApproval({
                    reviewerRole: "project_manager",
                    eventStatus: saved?.status,
                    draftEligible: workflow.draftEligible ?? !!event.contract,
                    noticeEligible: workflow.noticeEligible ?? !!event.contract,
                    humanConfirmed,
                    uncertaintyAcknowledged,
                    recipient: currentRecipient,
                    body: currentBody,
                  });
                  updateEvent(event.id, {
                    status: "approved",
                    body: currentBody,
                    recipient: currentRecipient,
                    approvedBy: "Jordan Lee",
                    approvedAt: new Date().toISOString(),
                  });
                  setConfirmOpen(false);
                  setEditing(false);
                } catch (error) {
                  setApprovalError(
                    error instanceof Error ? error.message : String(error),
                  );
                }
              }}
            >
              <CheckCheck size={16} />
              Approve notice
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
