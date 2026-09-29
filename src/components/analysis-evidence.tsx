"use client";

import { ArrowUpRight, FileText, ShieldCheck } from "lucide-react";
import type { ChangeEvent, EvidenceItem } from "@/lib/types";
import { EvidenceIcon } from "./ui";

const supportLabels = {
  direction: "Direction to relocate",
  design_change: "Revised design",
  reason_for_change: "Reason for field change",
  additional_work: "Additional field work",
  scope_baseline: "Original layout / constraint",
  scope_reduction: "Scope reduction",
  contract_terms: "Notice requirements",
};

export function AnalysisEvidence({
  event,
  items,
  onOpen,
}: {
  event: ChangeEvent;
  items: EvidenceItem[];
  onOpen: (item: EvidenceItem) => void;
}) {
  const workflow = event.workflow;
  if (!workflow) return null;
  const references = workflow.analysis.evidenceReferences;
  const uniqueSources = [
    ...new Set(references.map((reference) => reference.sourceId)),
  ];
  return (
    <section className="panel flagged-panel">
      <div className="panel-heading">
        <h2>Why Trailmark flagged this</h2>
        <span className="ai-label">
          <ShieldCheck size={14} />
          {uniqueSources.length} sources linked
        </span>
      </div>
      <div className="flagged-sources">
        {uniqueSources.map((sourceId) => {
          const item = items.find((item) => item.id === sourceId)!;
          const links = references.filter(
            (reference) => reference.sourceId === sourceId,
          );
          const reference = links[0];
          return (
            <article className="flagged-source" key={sourceId}>
              <div className="flagged-source-header">
                <span>
                  <EvidenceIcon kind={item.kind} size={15} />
                  {item.label}
                </span>
                <button
                  className="text-link"
                  onClick={() => onOpen(item)}
                  aria-label={`Open source: ${item.label}`}
                >
                  Open record <ArrowUpRight size={13} />
                </button>
              </div>
              <blockquote>“{reference.excerpt}”</blockquote>
              <div className="support-reason">
                <span>{supportLabels[reference.supports]}</span>
                <p>{reference.explanation}</p>
              </div>
              {links.length > 1 && (
                <details className="source-more">
                  <summary>
                    {links.length - 1} additional link in this record
                  </summary>
                  {links.slice(1).map((ref, index) => (
                    <div key={index}>
                      <blockquote>“{ref.excerpt}”</blockquote>
                      <p>{ref.explanation}</p>
                    </div>
                  ))}
                </details>
              )}
            </article>
          );
        })}
      </div>
      <details className="responsibility-note">
        <summary>
          <FileText size={14} />
          Responsibility assessment · subject to PM review
        </summary>
        <p>{workflow.analysis.responsiblePartyHypothesis}</p>
      </details>
      {!!workflow.reviewQuestions.length && (
        <details className="review-questions" open={!workflow.draftEligible}>
          <summary>
            {workflow.reviewQuestions.length} items require confirmation
          </summary>
          <ul>
            {workflow.reviewQuestions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
          <p>
            {workflow.draftEligible
              ? "A provisional notice can be reviewed. These uncertainties remain open and must be acknowledged by the PM before approval."
              : "Notice preparation is blocked until the supporting evidence is sufficient."}
          </p>
        </details>
      )}
    </section>
  );
}
