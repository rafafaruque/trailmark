"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Info,
  ScanLine,
  Send,
  Sun,
} from "lucide-react";
import { events, formatMoney, getExposure, projects } from "@/lib/fixtures";
import { useDemoState } from "@/lib/demo-store";
import { EventQueue, ProjectTable } from "./event-queue";

export function Overview() {
  const [projectId, setProjectId] = useState("all");
  const state = useDemoState();
  const relevant = events.filter(
    (event) =>
      (projectId === "all" || event.projectId === projectId) &&
      !["approved", "dismissed"].includes(state[event.id]?.status || ""),
  );
  const due = events.filter(
    (event) =>
      (projectId === "all" || event.projectId === projectId) &&
      state[event.id]?.status !== "dismissed" &&
      event.noticeHours &&
      event.noticeHours < 24,
  ).length;
  const pending = projects
    .filter((project) => projectId === "all" || project.id === projectId)
    .reduce((sum, project) => sum + project.pendingExposure, 0);
  const exposure = getExposure(
    projectId === "all" ? undefined : projectId,
    state,
  );
  const ready = relevant.filter((event) => event.status === "ready").length;
  return (
    <>
      <div className="page-intro">
        <div>
          <div className="greeting-eyebrow">
            <Sun size={16} />
            <span>TUESDAY · PROJECT REVIEW</span>
          </div>
          <h1>
            Good morning, Jordan<span className="greeting-period">.</span>
          </h1>
          <p>
            <strong>{relevant.length} potential changes</strong> need review.
          </p>
        </div>
        <div className="intro-date">
          <CalendarDays size={15} />
          Tuesday, September 29
          <ChevronDown size={13} />
        </div>
      </div>
      <div className="overview-filter-row">
        <div className="section-label">YOUR WORK AT A GLANCE</div>
        <label className="select-control project-select">
          <span className="tiny-project-icon">
            <ScanLine size={14} />
          </span>
          <select
            aria-label="Filter overview by project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
      </div>
      <section className="metrics" aria-label="Portfolio summary">
        <div className="metric-card exposure-card">
          <div className="metric-label">
            Potential exposure <CircleDollarSign size={18} />
          </div>
          <div className="metric-value">
            ${(exposure / 1000).toFixed(1)}
            <span>K</span>
            <svg className="sparkline" viewBox="0 0 105 45" aria-hidden="true">
              <path
                d="M1 41 17 32 29 36 42 24 54 28 67 16 78 19 91 7 104 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 41 17 32 29 36 42 24 54 28 67 16 78 19 91 7 104 3V45H1Z"
                fill="currentColor"
                opacity=".07"
              />
            </svg>
          </div>
          <div className="metric-footer">
            <span>
              Across{" "}
              {projectId === "all" ? "5 active projects" : "this project"}
            </span>
            <span
              className="info-tip"
              tabIndex={0}
              aria-label={`Includes ${formatMoney(pending)} pending costs. Potential credits are separate.`}
            >
              <Info size={13} />
              <span className="tooltip">
                {formatMoney(exposure)} in potential costs, including{" "}
                {formatMoney(pending)} in pending project costs. Credits are
                tracked separately.
              </span>
            </span>
          </div>
        </div>
        <Link href="/events?view=deadlines" className="metric-card">
          <div className="metric-label">
            Notice due &lt;24h <Clock3 className="icon-amber" size={18} />
          </div>
          <div className="metric-value">
            {due.toString().padStart(2, "0")}
            <span className="metric-pill amber-pill">Time sensitive</span>
          </div>
          <div className="metric-footer">
            <span>Written notice approaching</span>
            <ArrowUpRight size={15} />
          </div>
        </Link>
        <Link href="/events" className="metric-card">
          <div className="metric-label">
            Needs PM review <ScanLine size={18} />
          </div>
          <div className="metric-value">
            {(relevant.length - ready).toString().padStart(2, "0")}
          </div>
          <div className="metric-footer">
            <span>Awaiting your decision</span>
            <ArrowUpRight size={15} />
          </div>
        </Link>
        <Link href="/notices" className="metric-card">
          <div className="metric-label">
            Ready to notify <Send size={17} />
          </div>
          <div className="metric-value">
            {ready.toString().padStart(2, "0")}
            <span className="metric-pill green-pill">
              <span className="live-dot" />
              Draft prepared
            </span>
          </div>
          <div className="metric-footer">
            <span>Draft awaiting approval</span>
            <ArrowUpRight size={15} />
          </div>
        </Link>
      </section>
      <EventQueue projectId={projectId} />
      <section className="active-projects">
        <div className="section-heading">
          <div>
            <h2>
              Active projects{" "}
              <span className="heading-count">
                {projectId === "all" ? 5 : 1}
              </span>
            </h2>
            <p>Open changes and upcoming deadlines.</p>
          </div>
          <Link href="/projects" className="text-link">
            View all projects <ArrowRight size={15} />
          </Link>
        </div>
        <ProjectTable projectId={projectId} />
        <p className="table-note">
          * Includes pending project costs. Potential credits are shown
          separately from the {formatMoney(getExposure(undefined, state))}{" "}
          portfolio exposure.
        </p>
      </section>
    </>
  );
}
