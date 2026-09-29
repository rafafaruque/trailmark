"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  CircleHelp,
  FolderKanban,
  LayoutDashboard,
  ListFilter,
  Menu,
  Search,
  Send,
  Sparkles,
  X,
  Layers,
  CheckCheck,
} from "lucide-react";
import { events, getProject } from "@/lib/fixtures";
import { useDemoState } from "@/lib/demo-store";
import { BrandMark, Modal, ProjectIcon } from "./ui";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/events", label: "Change events", icon: ListFilter },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/notices", label: "Notices", icon: Send },
  { href: "/evidence", label: "Evidence", icon: Layers },
];

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const state = useDemoState();
  const openEvents = events.filter(
    (event) =>
      !["approved", "dismissed"].includes(state[event.id]?.status || ""),
  );
  const due = events.filter(
    (event) =>
      state[event.id]?.status !== "dismissed" &&
      event.noticeHours &&
      event.noticeHours < 24,
  );
  const page = nav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
  );
  const searchResults = events.filter((event) =>
    `${event.title} ${getProject(event.projectId).name} ${event.description}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setSearchOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app-shell">
      {mobileOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <Link
          href="/"
          className="brand"
          aria-label="Trailmark home"
          onClick={() => setMobileOpen(false)}
        >
          <BrandMark />
          <span>
            trailmark<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="workspace">
          <div className="workspace-logo">
            b<span>b</span>
          </div>
          <div>
            <strong>Bob Builder</strong>
            <span>Infrastructure</span>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} strokeWidth={1.65} />
                <span>{item.label}</span>
                {item.href === "/events" && (
                  <span className="nav-count">{openEvents.length}</span>
                )}
                {item.href === "/notices" && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-spark">
              <Sparkles size={17} />
            </span>
            <strong>Every change. A clear trail.</strong>

            <div className="mini-trail" aria-hidden="true">
              <span />
              <i />
              <span />
              <i />
              <span className="last">
                <CheckCheck size={13} />
              </span>
            </div>
          </div>
          <button className="help-button" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={18} /> Help & getting started{" "}
            <ArrowRight size={15} />
          </button>
          <div className="profile">
            <span className="avatar">JL</span>
            <div>
              <strong>Jordan Lee</strong>
              <span>Senior Project Manager</span>
            </div>
            <span className="online-dot" title="Jordan Lee · Project manager" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{page?.label || "Overview"}</strong>
            {pathname.split("/").filter(Boolean).length > 1 && (
              <>
                <ChevronRight size={14} />
                <span className="breadcrumb-detail">
                  {pathname.startsWith("/notices")
                    ? "Review notice"
                    : "Change detail"}
                </span>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <button
              className="search-trigger"
              onClick={() => setSearchOpen(true)}
              aria-label="Search workspace"
            >
              <Search size={17} />
              <span>Search anything...</span>
              <kbd>⌘ K</kbd>
            </button>
            <span className="topbar-divider" />
            <button
              className="icon-button notification-button"
              aria-label={`Notifications, ${due.length} upcoming deadlines`}
              onClick={() => setNotificationsOpen(true)}
            >
              <Bell size={19} />
              {due.length > 0 && <span />}
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content" key={pathname}>
          {children}
        </main>
        <footer className="app-footer">
          <span>
            <span className="live-dot" /> Bob Builder Infrastructure
          </span>
          <Link href="/system/analysis">Analysis record</Link>
        </footer>
      </div>
      {searchOpen && (
        <Modal
          title="Search your workspace"
          onClose={() => setSearchOpen(false)}
        >
          <div className="search-field">
            <Search size={19} />
            <input
              autoFocus
              placeholder="Search projects, changes, or evidence..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button
              className="icon-button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
            >
              <X size={15} />
            </button>
          </div>
          <div className="search-results">
            {searchResults.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                onClick={() => setSearchOpen(false)}
              >
                <ProjectIcon small project={getProject(event.projectId)} />
                <div>
                  <strong>{event.title}</strong>
                  <span>{getProject(event.projectId).name}</span>
                </div>
                <ArrowRight size={17} />
              </Link>
            ))}
            {searchResults.length === 0 && (
              <p className="muted">
                No changes match “{query}”. Try a project name.
              </p>
            )}
          </div>
        </Modal>
      )}
      {notificationsOpen && (
        <Modal
          title="Coming up next"
          onClose={() => setNotificationsOpen(false)}
        >
          <p className="modal-description">
            Notice deadlines in the next 24 hours · Sept 29 snapshot
          </p>
          <div className="search-results">
            {due
              .sort((a, b) => a.noticeHours! - b.noticeHours!)
              .map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  onClick={() => setNotificationsOpen(false)}
                >
                  <ProjectIcon small project={getProject(event.projectId)} />
                  <div>
                    <strong>{getProject(event.projectId).name}</strong>
                    <span>
                      {event.title} · Notice due in {event.noticeHours}h
                    </span>
                  </div>
                  <ArrowRight size={17} />
                </Link>
              ))}
            {!due.length && (
              <p>
                You’re all caught up. No open notices due in the next 24 hours.
              </p>
            )}
          </div>
        </Modal>
      )}
      {helpOpen && (
        <Modal
          title="Reviewing project changes"
          onClose={() => setHelpOpen(false)}
        >
          <div className="help-steps">
            <p>
              <b>1. Review a change</b>Start with a high-priority event in your
              queue.
            </p>
            <p>
              <b>2. Follow the evidence</b>Open the source records and review
              the contract window and cost estimate.
            </p>
            <p>
              <b>3. Take the next step</b>Edit and approve a notice, ask for
              clarification, or mark the event as not a change.
            </p>
          </div>
          <div className="callout subtle">
            This workspace uses synthetic records and a fixed Sept 29, 2026
            snapshot. Reviews are saved in this browser. Email delivery is not
            connected; approval does not send a notice.
          </div>
          <button
            className="button primary modal-done"
            onClick={() => setHelpOpen(false)}
          >
            Got it <ArrowRight size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
