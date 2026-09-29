"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  FileText,
  FolderKanban,
  MapPin,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  events,
  evidence,
  formatMoney,
  getExposure,
  getProject,
  notices,
  projects,
} from "@/lib/fixtures";
import { useDemoState } from "@/lib/demo-store";
import type { EvidenceItem, Project } from "@/lib/types";
import { EmptyState, EvidenceIcon, ProjectIcon } from "./ui";
import { EvidenceViewer } from "./evidence-viewer";
import { EventQueue } from "./event-queue";

export function ProjectsPage() {
  const [filter, setFilter] = useState("all");
  const state = useDemoState();
  return (
    <>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">PROJECT PORTFOLIO</span>
          <h1>Projects</h1>
          <p>Five active projects across two regions.</p>
        </div>
        <label className="select-control">
          <FolderKanban size={15} />
          <select
            aria-label="Project ownership"
            value={filter}
            onChange={(change) => setFilter(change.target.value)}
          >
            <option value="all">All projects</option>
            <option value="mine">My projects</option>
          </select>
          <ChevronDown size={13} />
        </label>
      </div>
      <div className="project-cards">
        {projects
          .filter(
            (project) => filter === "all" || project.manager === "Jordan Lee",
          )
          .map((project) => {
            const active = events.filter(
              (event) =>
                event.projectId === project.id &&
                state[event.id]?.status !== "dismissed",
            );
            return (
              <Link
                className="project-card"
                key={project.id}
                href={`/projects/${project.id}`}
              >
                <div className="project-card-top">
                  <ProjectIcon project={project} />
                  <span className="badge neutral-badge">
                    <span className="live-dot" />
                    Active
                  </span>
                  <ArrowRight size={18} />
                </div>
                <span className="project-code">{project.code}</span>
                <h2>{project.name}</h2>
                <p>{project.subtitle}</p>
                <div className="project-card-location">
                  <MapPin size={14} />
                  {project.region}
                  <span>·</span>
                  <UserRound size={14} />
                  {project.manager}
                </div>
                <div className="project-card-stats">
                  <div>
                    <span>Open changes</span>
                    <strong>{active.length.toString().padStart(2, "0")}</strong>
                  </div>
                  <div>
                    <span>
                      {project.id === "moonbeam-garage"
                        ? "Potential credit"
                        : "Potential exposure"}
                    </span>
                    <strong>
                      {formatMoney(
                        project.id === "moonbeam-garage"
                          ? active.reduce(
                              (sum, event) => sum + event.exposure,
                              0,
                            )
                          : active.reduce(
                              (sum, event) => sum + Math.max(0, event.exposure),
                              0,
                            ) + project.pendingExposure,
                      )}
                    </strong>
                  </div>
                </div>
                <div className="project-card-deadline">
                  {active.length > 0
                    ? project.nextDeadline
                      ? `Next notice · ${project.nextDeadline}`
                      : "Notice window not established"
                    : "No open notice deadline"}
                </div>
              </Link>
            );
          })}
      </div>
    </>
  );
}

export function ProjectDetail({ project }: { project: Project }) {
  return (
    <>
      <Link href="/projects" className="back-link">
        <ArrowLeft size={15} />
        All projects
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
        <span className="badge neutral-badge">
          <span className="live-dot" />
          Active project
        </span>
      </div>
      <div className="project-detail-meta">
        <span>
          <MapPin size={15} />
          {project.region}
        </span>
        <span>
          <UserRound size={15} />
          {project.manager}
        </span>
        <span>
          <FolderKanban size={15} />
          BobsBuildings
        </span>
      </div>
      {project.pendingExposure > 0 && (
        <div className="callout subtle pending-note">
          <FileText size={20} />
          <span>
            <strong>
              {formatMoney(project.pendingExposure)} in pending project costs
            </strong>
            Unallocated equipment standby and field allowances under PM review.
            Included in this project’s {formatMoney(getExposure(project.id))}{" "}
            exposure; not yet linked to a detected change event.
          </span>
        </div>
      )}
      <EventQueue projectId={project.id} />
    </>
  );
}

export function NoticesPage() {
  const state = useDemoState();
  const [tab, setTab] = useState("drafts");
  const visible = notices.filter((notice) =>
    tab === "approved"
      ? state[notice.eventId]?.status === "approved"
      : !["approved", "dismissed"].includes(
          state[notice.eventId]?.status || "",
        ),
  );
  return (
    <>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">NOTICE REGISTER</span>
          <h1>Notices</h1>
          <p>Drafts, approvals and delivery status.</p>
        </div>
        <span className="demo-label">
          <ShieldCheck size={15} />
          Delivery not connected
        </span>
      </div>
      <div className="library-tabs queue-tabs">
        <button
          className={tab === "drafts" ? "selected" : ""}
          onClick={() => setTab("drafts")}
        >
          Draft notices{" "}
          <span>
            {
              notices.filter(
                (notice) =>
                  !["approved", "dismissed"].includes(
                    state[notice.eventId]?.status || "",
                  ),
              ).length
            }
          </span>
        </button>
        <button
          className={tab === "approved" ? "selected" : ""}
          onClick={() => setTab("approved")}
        >
          Approved · not sent{" "}
          <span>
            {
              notices.filter(
                (notice) => state[notice.eventId]?.status === "approved",
              ).length
            }
          </span>
        </button>
      </div>
      <div className="notice-list">
        {visible.map((notice) => {
          const event = events.find((event) => event.id === notice.eventId)!;
          const project = getProject(event.projectId);
          const status = state[event.id]?.status;
          return (
            <Link
              className="notice-list-item"
              key={event.id}
              href={`/notices/${event.id}`}
            >
              <div className="notice-list-icon">
                <FileText size={24} />
              </div>
              <div className="notice-list-main">
                <span className="eyebrow">{project.name}</span>
                <h2>{event.title}</h2>
                <p>
                  To {notice.recipient} · {event.contract!.clause}{" "}
                  {event.contract!.title}
                </p>
              </div>
              <div className="notice-list-status">
                <span
                  className={`badge ${status === "approved" || event.status === "ready" ? "priority-medium" : "neutral-badge"}`}
                >
                  {status === "approved"
                    ? "Approved · not sent"
                    : status === "saved"
                      ? "Saved for later"
                      : event.status === "ready"
                        ? "Ready to notify"
                        : "Needs PM review"}
                </span>
                <span>{formatMoney(event.exposure)} estimated exposure</span>
              </div>
              <ArrowRight size={18} />
            </Link>
          );
        })}
        {!visible.length && (
          <EmptyState
            title={
              tab === "approved"
                ? "Your first notice starts with a review"
                : "You’re all caught up"
            }
            description={
              tab === "approved"
                ? "Notices appear here after explicit PM approval. Delivery remains pending."
                : "No open drafts are waiting for review."
            }
          />
        )}
      </div>
      <div className="library-note">
        <ShieldCheck size={15} />
        Notices are drafted only when supporting evidence and contract context
        are available.
      </div>
    </>
  );
}

export function EvidencePage({ initialItem }: { initialItem?: string }) {
  const [selected, setSelected] = useState<EvidenceItem | null>(
    () => evidence.find((item) => item.id === initialItem) || null,
  );
  const [query, setQuery] = useState("");
  const [project, setProject] = useState("all");
  const shown = evidence.filter((item) => {
    const event = events.find((event) => event.id === item.eventId)!;
    return (
      (project === "all" || event.projectId === project) &&
      `${item.label} ${item.title} ${getProject(event.projectId).name} ${item.content}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  });
  return (
    <>
      <div className="page-intro secondary-intro">
        <div>
          <span className="eyebrow">PROJECT SOURCE RECORDS</span>
          <h1>Evidence library</h1>
          <p>Daily logs, correspondence, RFIs and drawings.</p>
        </div>
        <span className="page-count">{evidence.length} connected records</span>
      </div>
      <div className="evidence-library-toolbar">
        <label className="search-field compact">
          <Search size={17} />
          <input
            placeholder="Search evidence..."
            aria-label="Search evidence"
            value={query}
            onChange={(change) => setQuery(change.target.value)}
          />
        </label>
        <label className="select-control">
          <select
            aria-label="Filter evidence by project"
            value={project}
            onChange={(change) => setProject(change.target.value)}
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} />
        </label>
      </div>
      <div className="evidence-library-grid">
        {shown.map((item) => {
          const event = events.find((event) => event.id === item.eventId)!;
          const project = getProject(event.projectId);
          return (
            <button
              className="evidence-library-card"
              key={item.id}
              onClick={() => setSelected(item)}
            >
              <div className="evidence-card-top">
                <span className="document-icon">
                  <EvidenceIcon kind={item.kind} size={21} />
                </span>
                <span className="small-muted">{item.date}</span>
                <ArrowRight size={16} />
              </div>
              <span className={`evidence-project-label ${project.color}`}>
                {project.name}
              </span>
              <h2>{item.title}</h2>
              <p>{item.summary}</p>
              <div className="evidence-card-footer">
                <span>{item.author.split(" · ")[0]}</span>
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      {!shown.length && (
        <EmptyState
          title="No matching evidence"
          description="Try a different search term or project."
        />
      )}
      {selected && (
        <EvidenceViewer item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
