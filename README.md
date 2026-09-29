# Trailmark

A bright, working operations demo for **Bob Builder Infrastructure**. Trailmark connects potential scope changes to field evidence, notice deadlines, preliminary cost, and the PM's next action.

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Routes

| Route                     | View                                                                         |
| ------------------------- | ---------------------------------------------------------------------------- |
| `/`                       | Portfolio overview, summary metrics, five changes, active projects           |
| `/events`                 | Searchable, sortable, region-filtered change queue                           |
| `/events?view=deadlines`  | Open notices due within 24 hours                                             |
| `/events/[id]`            | Change summary, source timeline, contract impact, cost estimate, next action |
| `/notices`                | Draft and approved notice lists                                              |
| `/notices/[id]`           | Editable notice, save-for-later, simulated approval and send                 |
| `/projects`               | Project cards with ownership filter                                          |
| `/projects/[id]`          | Project context and its change queue                                         |
| `/evidence`               | Searchable source library with project filter                                |
| `/evidence?item=sf-email` | Direct source preview                                                        |

The complete hero flow starts at `/events/strawberry-fields-transformer-relocation` and continues at `/notices/strawberry-fields-transformer-relocation`.

All five changes have populated detail views. Three supported changes have notice drafts. Clover Court requests clarification because responsibility is unconfirmed; Moonbeam Garage surfaces a potential credit and links to procurement evidence.

## Implementation

- Next.js App Router, TypeScript, React, Lucide icons, plain responsive CSS.
- `src/lib/types.ts`: typed projects, changes, evidence, contracts, costs, notices, and review state.
- `src/lib/fixtures.ts`: five projects, five change events, 13 source records, three contract excerpts, five cost breakdowns, and three notice drafts.
- `src/lib/demo-store.ts`: browser-local persistence with a shared external store and an in-memory fallback.
- `src/components/`: reusable shell, queue, project table, detail view, evidence preview, and notice review.
- Native dialog focus management, keyboard search (`⌘K` / `Ctrl+K`), responsive navigation, source previews, and empty states.

## Demo semantics

- Everything is fictional. The fixed snapshot is Sept 29, 2026, 4:43 PM; relative deadlines do not count down. “Good morning” is the requested product greeting.
- Portfolio exposure is **$71,800**: $65,170 in positive event estimates plus $6,630 of pending Blueberry Hill project costs. The potential $6,200 Moonbeam credit is tracked separately.
- Two notices fall within 24 hours: Strawberry Fields (18h) and Honeybee Yard (9h). Blueberry Hill is due in 31h.
- Approval removes a notice from the review/deadline queue but does **not** imply cost recovery. Exposure remains until the event is marked not a change.
- Edits, clarification requests, approval, and dismissal persist in this browser under `trailmark-demo-v1`. Reopening a review preserves its saved draft. Clear this localStorage key to restore the initial demo.
- Sending notices and requesting clarification are simulated; no email or external message is sent.
- Photo evidence is represented by a source register; original photographs are not included. All other evidence is a readable mock source excerpt.
- No AI service, authentication, database, real contract interpretation, external connectors, or email delivery is implemented in Phase 1.

## Validation

```sh
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The Playwright suite exercises source previews, editable drafts, persisted approval, portfolio behavior, sorting and filtering, sidebar navigation, insufficient-evidence handling, dismissal and reopening, missing-record UI, and the mobile flow.

For a machine without a Playwright browser installed, first run `npx playwright install chromium`. The test runner reuses a running local server, or starts one on port 3000.
