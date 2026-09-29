# Trailmark

A bright construction operations workspace for **Bob Builder Infrastructure**. Phase 2 turns raw project records into an evidence-backed potential change, a calculated notice deadline and cost estimate, and a PM-reviewed notice.

**AI connects and interprets evidence. Deterministic software owns dates, math, permissions, and contractual actions.**

## Run locally

Requires Node.js 20.9+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No API key or Codex installation is needed to run or build the app. The hosted workflow validates and replays preserved provider responses.

## Review the workflow

| Route                                               | View                                                                          |
| --------------------------------------------------- | ----------------------------------------------------------------------------- |
| `/`                                                 | Five potential changes, portfolio exposure and projects                       |
| `/events`                                           | Search, sort and filter changes                                               |
| `/events?view=deadlines`                            | Undelivered notices due within 24 hours                                       |
| `/events/strawberry-fields-transformer-relocation`  | Four linked field sources, uncertainty, contract and calculated cost          |
| `/notices/strawberry-fields-transformer-relocation` | Editable provisional notice and explicit PM approval                          |
| `/events/clover-court-conduit-reroute`              | Insufficient evidence and prepared clarification request                      |
| `/projects`, `/evidence`, `/notices`                | Project, source and notice libraries                                          |
| `/system/analysis`                                  | Actual outputs, usage, validation history, input hashes and evaluation labels |

Strawberry Fields and Clover Court are derived from real, recorded model responses to synthetic inputs. Blueberry Hill, Honeybee Yard and Moonbeam Garage retain the populated Phase 1 fixtures; they have not been run through the new pipeline.

## Recorded results

The authenticated local **Codex CLI 0.158.0 / gpt-6-astra** ran Strawberry Fields detection exactly once on September 29, 2026. It returned **“Charger Island Relocation and Trench Reroute”**, `owner_directed_change`, medium confidence, six exact references across four field sources, and §12.4. Four open questions remain: original scope, direction authority, earlier awareness, and final quantities/time/schedule.

| Preserved run                  | Latency | Input / output tokens | Result                                                                             |
| ------------------------------ | ------- | --------------------- | ---------------------------------------------------------------------------------- |
| Strawberry Fields detection    | 41.937s | 12,949 / 1,227        | Validated; medium confidence                                                       |
| Clover Court detection         | 71.392s | 11,108 / 475          | Validated; low confidence, no contract                                             |
| Strawberry Fields notice prose | 25.762s | 14,659 / 716          | Original validator failure retained; unchanged response passes corrected validator |

The notice validator initially omitted the separately retrieved contract from its permitted source set. That system bug was corrected and the **same response** revalidated offline. The initial failure and a separate, timestamped validation correction remain in `data/recordings`; no model output was replaced and no detection was retried. Draft preparation was also separated from final PM approval so uncertainty stays visible in a provisional notice.

The calculated deadline is **September 30, 2026, 10:43 AM America/New_York**: the selected email receipt timestamp plus 48 elapsed hours. It is provisional because the record mentions an earlier morning direction. The PM must resolve the trigger assumption; the calculation does not establish the legally controlling date.

The preliminary estimate is **$18,420**: $16,380 direct cost + $2,040 markup (12.5% of $16,320 eligible cost, excluding a $60 pass-through fee). Every quantity, rate and formula is inspectable. Labor includes forecast remaining work, not just recorded overtime.

## Source and code map

- `data/raw/`: independent daily logs, utility email, RFI-042, E-104 Rev C metadata, multi-clause contract and pricing worksheet. All records are synthetic.
- `data/recordings/`: original request, schema, response, attempt lock, metadata and validation history.
- `src/lib/sources/`: strict source normalization without rewriting evidence.
- `src/lib/ai/`: generic provider interface, structured schemas, detection, exact citation validation and notice prose.
- `src/lib/calculations/`: elapsed-time deadline and integer-cent cost calculations.
- `src/lib/workflow/`: validated replay, deterministic prerequisites, presentation and PM approval policy.
- `scripts/providers/`: local Codex adapter; never imported into the hosted app.
- `data/evals/`: ten labeled synthetic cases; evaluation status **not run**.

See [architecture and boundaries](docs/architecture.md), [recording audit](data/recordings/README.md), and [evaluation format](data/evals/README.md).

## Workflow semantics

- The fixed snapshot is September 29, 2026, 4:43 PM New York time. Relative deadlines do not count down.
- Portfolio exposure remains $71,800, including $6,630 of pending Blueberry Hill project costs. The potential $6,200 Moonbeam credit is tracked separately. Clover's $11,300 is a clearly unverified raw field allowance, not a calculated claim.
- Approval requires a deliberate PM confirmation. Strawberry Fields additionally requires acknowledgment of the unresolved scope, authority and trigger assumptions. Approval is saved as **approved, not sent** and does not close the deadline or imply recovery.
- No delivery integration exists. Clarification requests prepare text locally. No email or external contractual communication is sent.
- Review, edits, dismissal and clarification state persist under browser localStorage key `trailmark-review-v2`; clear it to reset. This is a local review policy, not authenticated authorization.
- Other projects' photo evidence is a source register; original photos are not included.

## Validation

```sh
npm run verify:recordings
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

The 17 unit tests cover exact citations, strict output boundaries, recorded response integrity, DST/leap/weekend deadlines, pricing/rounding, uncertainty, approval prerequisites and evaluation labels. Six browser tests exercise all five events, source previews, edits, local approval, open deadlines, clarification, filtering, technical inspection and a 390px mobile flow.

Install Chromium with `npx playwright install chromium` if needed. Playwright starts or reuses the app on port 3000. The production build first verifies the recordings; it makes no inference calls.

## Vercel

Import the `trailmark` Git repository, use the **Next.js** preset and repository root, and keep the default install command and `npm run build`. No provider credentials or environment variables are required for this phase. Include `data/raw` and `data/recordings` in the commit. Approval state stays in each browser, with no shared database.

The recording commands are developer-only. Their exclusive attempt files deliberately prevent rerunning the preserved Phase 2 examples. Do not delete those locks or overwrite the original audit artifacts; use new IDs for future experiments.
