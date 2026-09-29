"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  BookOpen,
  FileText,
  Mail,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  ShoppingBag,
  X,
  Check,
  ArrowUpRight,
} from "lucide-react";
import type { EvidenceKind, Priority, Project } from "@/lib/types";

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark ${small ? "small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path
          d="M7 27 17 8c.5-1 1.8-1 2.3 0L29 27h-7l-4-8-4 8H7Z"
          fill="currentColor"
        />
        <path d="m14 27 4-8 4 8" stroke="#f0f3e8" strokeWidth="2" />
        <circle cx="27.5" cy="8" r="2.5" fill="currentColor" />
      </svg>
    </span>
  );
}
export function ProjectIcon({
  project,
  small = false,
}: {
  project: Project;
  small?: boolean;
}) {
  return (
    <span
      className={`project-icon ${project.color} ${small ? "small" : ""}`}
      aria-hidden="true"
    >
      {project.initials}
    </span>
  );
}
export const evidenceIcons = {
  log: BookOpen,
  email: Mail,
  rfi: MessageSquare,
  drawing: Layers,
  photo: ImageIcon,
  report: FileText,
  notes: FileText,
  order: ShoppingBag,
};
export function EvidenceIcon({
  kind,
  size = 14,
}: {
  kind: EvidenceKind;
  size?: number;
}) {
  const Icon = evidenceIcons[kind];
  return <Icon size={size} strokeWidth={1.6} />;
}
export function PriorityBadge({ priority }: { priority: Priority }) {
  const labels = {
    high: "High priority",
    medium: "Medium",
    "needs-evidence": "Needs evidence",
    low: "Low priority",
  };
  return (
    <span className={`badge priority-${priority}`}>
      <span className="badge-dot" />
      {labels[priority]}
    </span>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-inner">
        <div className="modal-header">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Check size={24} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function ExternalArrow() {
  return <ArrowUpRight size={15} strokeWidth={1.7} />;
}
