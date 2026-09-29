"use client";

import { EvidenceIcon, Modal } from "./ui";
import type { EvidenceItem } from "@/lib/types";
import { getProject, events } from "@/lib/fixtures";

export function EvidenceViewer({
  item,
  onClose,
}: {
  item: EvidenceItem;
  onClose: () => void;
}) {
  const event = events.find((event) => event.id === item.eventId)!;
  return (
    <Modal title={item.label} onClose={onClose} wide>
      <div className="evidence-document-meta">
        <span className="document-icon">
          <EvidenceIcon kind={item.kind} size={24} />
        </span>
        <div>
          <h3>{item.title}</h3>
          <p>
            {getProject(event.projectId).name} · {item.date} · {item.time}
          </p>
        </div>
      </div>
      <div className="source-document">{item.content}</div>
      <div className="evidence-document-footer">
        <span>{item.author}</span>
        <span className="badge neutral-badge">
          {item.system || "Source record"}
        </span>
      </div>
    </Modal>
  );
}
