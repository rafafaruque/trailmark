"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Filter,
  Minus,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  events,
  evidence,
  formatMoney,
  getProject,
  projects,
} from "@/lib/fixtures";
import { useDemoState } from "@/lib/demo-store";
import type { ChangeEvent } from "@/lib/types";
import { EmptyState, EvidenceIcon, PriorityBadge, ProjectIcon } from "./ui";

export function EventCard({ event }: { event: ChangeEvent }) {
  const project = getProject(event.projectId);
  const state = useDemoState();
  const status = state[event.id]?.status;
  const resolved = status === "approved" || status === "dismissed";
  const ready = event.status === "ready";
  const href =
    ready && !resolved ? `/notices/${event.id}` : `/events/${event.id}`;
  const label = resolved
    ? "View details"
    : ready
      ? "Review notice"
      : event.status === "insufficient"
        ? "Request clarification"
        : event.status === "no-action"
          ? "Inspect"
          : "Review change";
  return (
    <article
      className={`event-card ${event.id === events[0].id ? "featured" : ""} ${resolved ? "resolved" : ""}`}
    >
      <div className="event-project">
        <ProjectIcon project={project} />
        <div>
          <Link href={`/events/${event.id}`} className="project-name">
            {project.name}
          </Link>
          <span className="project-subtitle">{project.subtitle}</span>
        </div>
      </div>
      <div className="event-info">
        <div className="event-title-line">
          <Link href={`/events/${event.id}`} className="event-title">
            {event.title}
          </Link>
          <PriorityBadge priority={event.priority} />
        </div>
        <p>{event.description}</p>
        <div className="evidence-badges">
          {event.evidenceIds.map((id) => {
            const item = evidence.find((entry) => entry.id === id)!;
            return (
              <Link
                title={`View ${item.label}`}
                key={id}
                className="evidence-badge"
                href={`/evidence?item=${id}`}
              >
                <EvidenceIcon kind={item.kind} />
                {item.label}
              </Link>
            );
          })}
          {event.missing && (
            <span className="missing-evidence">
              <TriangleAlert size={12} />
              Missing: {event.missing}
            </span>
          )}
        </div>
      </div>
      <div className="event-financial">
        <strong className={event.exposure < 0 ? "credit" : ""}>
          {formatMoney(event.exposure)}
        </strong>
        <span>
          {event.exposure < 0 ? "potential credit" : "potential exposure"}
        </span>
        <div
          className={`event-status ${resolved ? "ready" : ready ? "ready" : event.noticeHours ? "urgent" : "neutral"}`}
        >
          {status === "approved" ? (
            <>
              <Check size={13} />
              Approved · not sent
            </>
          ) : status === "dismissed" ? (
            <>
              <Minus size={13} />
              Not a change
            </>
          ) : status === "clarification-requested" ? (
            <>
              <Clock3 size={13} />
              Clarification requested
            </>
          ) : ready ? (
            <>
              <Check size={13} />
              Ready for notice
            </>
          ) : event.noticeHours ? (
            <>
              <Clock3 size={13} />
              <b>{event.noticeHours}h</b> until notice deadline
            </>
          ) : event.status === "no-action" ? (
            <>
              <Minus size={13} />
              No notice indicated
            </>
          ) : (
            <>
              <span className="small-dot" />
              Awaiting evidence
            </>
          )}
        </div>
      </div>
      <Link
        className={`event-cta ${event.id === events[0].id && !resolved ? "hero-cta" : ""}`}
        href={href}
      >
        {label}
        <ArrowRight size={15} />
      </Link>
    </article>
  );
}

export function EventQueue({
  fullPage = false,
  projectId = "all",
  initialDeadlineOnly = false,
}: {
  fullPage?: boolean;
  projectId?: string;
  initialDeadlineOnly?: boolean;
}) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState(
    initialDeadlineOnly ? "deadline" : "priority",
  );
  const [deadlineOnly, setDeadlineOnly] = useState(initialDeadlineOnly);
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [region, setRegion] = useState("all");
  const state = useDemoState();
  const relevant = events.filter(
    (event) =>
      (projectId === "all" || event.projectId === projectId) &&
      (region === "all" || getProject(event.projectId).region === region) &&
      (!deadlineOnly ||
        (!!event.noticeHours &&
          event.noticeHours < 24 &&
          state[event.id]?.status !== "dismissed")),
  );
  const active = relevant.filter(
    (event) =>
      !["approved", "dismissed"].includes(state[event.id]?.status || ""),
  );
  const review = active.filter((event) => event.status !== "ready");
  const ready = active.filter((event) => event.status === "ready");
  const display = (
    tab === "review" ? review : tab === "ready" ? ready : relevant
  )
    .filter((event) =>
      `${event.title} ${getProject(event.projectId).name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .toSorted((a, b) =>
      sort === "exposure"
        ? b.exposure - a.exposure
        : sort === "deadline"
          ? (a.noticeHours || 999) - (b.noticeHours || 999)
          : events.indexOf(a) - events.indexOf(b),
    );

  return (
    <section className="event-queue" aria-label="Potential change events">
      {deadlineOnly && (
        <div className="deadline-filter">
          <Clock3 size={14} />
          Showing open notices due within 24 hours
          <button
            className="text-button"
            onClick={() => setDeadlineOnly(false)}
          >
            Show all changes
          </button>
        </div>
      )}
      {!fullPage && (
        <div className="queue-heading">
          <div>
            <h2>
              Potential change events{" "}
              <span className="heading-count">{active.length}</span>
            </h2>
            <p>Review the evidence and choose the next action.</p>
          </div>
          <div className="source-status">
            <span className="live-dot" /> Records through Sept 29
          </div>
        </div>
      )}
      <div className="queue-toolbar">
        <div className="queue-tabs" role="group" aria-label="Filter changes">
          <button
            className={tab === "all" ? "selected" : ""}
            onClick={() => setTab("all")}
          >
            All changes <span>{relevant.length}</span>
          </button>
          <button
            className={tab === "review" ? "selected" : ""}
            onClick={() => setTab("review")}
          >
            Needs review <span>{review.length}</span>
          </button>
          <button
            className={tab === "ready" ? "selected" : ""}
            onClick={() => setTab("ready")}
          >
            Ready for notice <span>{ready.length}</span>
          </button>
        </div>
        <div className="queue-controls">
          <button
            className={`filter-button ${filtersOpen || region !== "all" || query ? "enabled" : ""}`}
            onClick={() => setFiltersOpen((value) => !value)}
            aria-expanded={filtersOpen}
          >
            <Filter size={14} />
            <span>Filter</span>
          </button>
          <label className="sort-control">
            <ArrowDownWideNarrow size={15} />
            <select
              aria-label="Sort change events"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="priority">Priority</option>
              <option value="deadline">Deadline</option>
              <option value="exposure">Exposure</option>
            </select>
            <ChevronDown size={12} />
          </label>
        </div>
      </div>
      {filtersOpen && (
        <div className="filter-bar">
          <label className="search-field compact">
            <Search size={16} />
            <input
              aria-label="Filter by project or change"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find a project or change..."
            />
          </label>
          <label className="select-control">
            <select
              aria-label="Filter by region"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="all">All regions</option>
              <option>Northeast</option>
              <option>Mid-Atlantic</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setRegion("all");
            }}
          >
            Reset filters
          </button>
        </div>
      )}
      <div className="event-list">
        {display.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {!display.length && (
          <EmptyState
            title="Nothing in this view"
            description="Try another filter, or check back as new field evidence arrives."
          />
        )}
      </div>
      <div className="queue-footnote">
        <Sparkles size={13} />
        <span>Source records are linked to each event.</span>
        <span className="snapshot-label">Snapshot · Sept 29, 2026</span>
      </div>
    </section>
  );
}

export function ProjectTable({ projectId = "all" }: { projectId?: string }) {
  const state = useDemoState();
  return (
    <div className="project-table-wrap">
      <table className="project-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Open changes</th>
            <th>Exposure</th>
            <th>Next deadline</th>
            <th>
              <span className="sr-only">View project</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {projects
            .filter(
              (project) => projectId === "all" || project.id === projectId,
            )
            .map((project) => {
              const projectEvents = events.filter(
                (event) => event.projectId === project.id,
              );
              const active = projectEvents.filter(
                (event) => state[event.id]?.status !== "dismissed",
              );
              const noticePending = active.length > 0;
              const value =
                active.reduce((sum, event) => sum + event.exposure, 0) +
                project.pendingExposure;
              return (
                <tr key={project.id}>
                  <td>
                    <Link
                      className="table-project"
                      href={`/projects/${project.id}`}
                    >
                      <ProjectIcon small project={project} />
                      <span>
                        {project.name}
                        <small>{project.subtitle}</small>
                      </span>
                    </Link>
                  </td>
                  <td>
                    <span className="table-count">
                      {active.length.toString().padStart(2, "0")}
                    </span>
                  </td>
                  <td className={value < 0 ? "credit" : ""}>
                    {formatMoney(value)}
                    {project.pendingExposure > 0 && (
                      <span
                        className="table-pending"
                        title={`Includes ${formatMoney(project.pendingExposure)} in pending project costs`}
                      >
                        *
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={
                        noticePending &&
                        project.noticeHours &&
                        project.noticeHours < 24
                          ? "deadline-text"
                          : "muted"
                      }
                    >
                      {noticePending ? project.nextDeadline || "—" : "—"}
                    </span>
                  </td>
                  <td>
                    <Link
                      className="icon-button"
                      href={`/projects/${project.id}`}
                      aria-label={`View ${project.name}`}
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
