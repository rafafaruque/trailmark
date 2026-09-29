# Trailmark

A bright construction operations workspace for **BobsBuildings**. The workflow turns raw project records into an evidence-backed potential change, a calculated notice deadline and cost estimate, and a PM-reviewed notice.

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
| `/system/evals`                                     | Measured detection evaluation and individual case inspection                  |
| `/system/analysis`                                  | Actual outputs, usage, validation history, input hashes and evaluation labels |

All five projects now have recorded detections and exact source links from independent synthetic inputs. Strawberry Fields has the full recorded notice plus deterministic cost/deadline workflow; Clover Court abstains. Blueberry Hill, Honeybee Yard and Moonbeam Garage were promoted after the holdout completed. Their estimates and contract/notice inputs remain PM-configured; their new detections do not establish those commercial terms.

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
- `data/evals/`: ten labeled synthetic cases with one real inference per case and preserved component scores.

See [evaluation policy and limits](docs/evaluation.md), [architecture and boundaries](docs/architecture.md), [recording audit](data/recordings/README.md), and [evaluation format](data/evals/README.md).

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
npm run verify:evals
npm run verify:holdout
npm run verify:projects
npm test
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

The 30 unit tests cover exact citations, strict output boundaries, recorded response integrity, DST/leap/weekend deadlines, pricing/rounding, uncertainty, approval prerequisites, evaluation isolation, confusion-matrix arithmetic, provider-error exclusion, failure categorization, null denominators, duplicate-source gating and original-run integrity. Twelve browser tests exercise all five events, source previews, edits, local approval, open deadlines, clarification, filtering, technical inspection, development and holdout case views, isolation from PM screens and 390px mobile layouts.

Install Chromium with `npx playwright install chromium` if needed. Playwright starts or reuses the app on port 3000. The production build first verifies the recordings; it makes no inference calls.

## Vercel

Import the `trailmark` Git repository, use the **Next.js** preset and repository root, and keep the default install command and `npm run build`. No provider credentials or environment variables are required for this phase. Include `data/raw`, `data/recordings` and `data/evals` in the commit. Approval state stays in each browser, with no shared database.

The recording commands are developer-only. Their exclusive attempt files deliberately prevent rerunning the preserved Phase 2 examples. Do not delete those locks or overwrite the original audit artifacts; use new IDs for future experiments.

## Evaluation — Phase 3

The existing ten synthetic cases test whether detection generalizes beyond the hero example. One call per case used **Codex CLI 0.158.0 / gpt-6-astra**, with the unchanged production prompt/schema and normalized source records only. Expected labels, scorer logic and other cases’ answers were withheld. Scoring rules and dataset fingerprints were saved before inference; no model call was retried and no LLM judge was used.

**10 attempted, 10 scored, 0 provider errors, 0 malformed outputs, 0 tool-boundary violations.**

| Measured component                                | Result                                     |
| ------------------------------------------------- | ------------------------------------------ |
| Change detection                                  | 7 TP · 0 FP · 3 TN · 0 FN                  |
| Precision / recall                                | **100% (7/7) / 100% (7/7)**                |
| Event-type exact match                            | **100% (10/10)**                           |
| Expected-source recall                            | **100% (17/17 distinct expected sources)** |
| Label-unexpected / unsupported source IDs         | **1 / 0**                                  |
| Invalid citations                                 | **0 of 18 references**                     |
| Abstention agreement                              | **60% (6/10)**                             |
| Expected / correct / missed abstentions           | **4 / 4 / 0**                              |
| Unnecessary abstentions under the authored labels | **4**                                      |

All partial failures are retained:

- **owner-bollards:** requested baseline, authority and release/installation confirmation; the expected label required no abstention.
- **rock-condition:** requested the original boring report, risk allocation, direction and later work records; expected no abstention.
- **credit-reduction:** requested scope baseline, authority/receipt and procurement status; expected no abstention.
- **unrelated-records:** requested scope/corroboration despite the expected non-abstention label, and cited the supplied north-gate email outside the expected source list. Its citation is valid; it is label-unexpected evidence, not an invented source.

The unchanged abstention proxy counts low confidence, an ambiguous type, or **any** missing evidence. Thus commercially reasonable caution can still disagree with this dataset. Labels and scoring were not adjusted after seeing results. The weak abstention result is visible at `/system/evals`; there is no manufactured overall score.

`noticeLikelyRequired` is not scored because executed-contract/policy fixtures are insufficient. Provider errors and malformed answers are separate from quality errors and excluded from semantic denominators, with coverage shown. A missing denominator displays “Not available.”

These are short synthetic cases with prototype-authored expected labels, not expert-adjudicated legal or construction truth. Descriptive source IDs and explicit scenario wording limit difficulty. Ten cases and one run each cannot establish production reliability or variability. **Next production step:** replace them with adjudicated historical events from BobsBuildings PMs/commercial managers, then measure precision, recall and alert burden before rollout.

The production surfacing gate requires valid structure and citations, medium/high confidence, a non-ambiguous commercial-change hypothesis and two independent supporting records. Duplicate message IDs count once. Other positive cases become Needs evidence; non-changes are not surfaced. This gate is separate from raw-model scoring and never grants notice, entitlement or recovery permission. See [policy, scoring and business tradeoffs](docs/evaluation.md).

```sh
npm run eval:report     # Recalculate from recorded artifacts; no inference
npm run verify:evals    # Verify sources, prompts, responses and metrics
```

`npm run eval:record` is the local-only recorder, locked against repeating the completed batch. The three remaining PM detections were subsequently promoted in Phase 4, separately from evaluation scoring.

## Holdout evaluation — Phase 4

The Phase 3 detection prompt, structured schema, reliability policy and deterministic evaluator were frozen **before** authoring ten new holdout cases. The normalizer, citation validator and provider adapter were frozen too. SHA-256 fingerprints and the base revision live in `data/evals/holdout/freeze.json`. Expected labels were saved before inference and excluded from the model input. No prompt, label, rule or model output was changed after seeing results.

Exactly one inference per case used **Codex CLI 0.158.0 / gpt-6-astra** with the unchanged production request. **10 attempted, 10 scored, 0 provider errors, 0 malformed outputs; no retries.** Results remain separate from the development set at `/system/evals#holdout`.

| Holdout component                                  | Measured result                    |
| -------------------------------------------------- | ---------------------------------- |
| Detection                                          | 6 TP · 0 FP · 4 TN · 0 FN          |
| Precision / recall                                 | **100% (6/6) / 100% (6/6)**        |
| Event-type exact match                             | **100% (10/10)**                   |
| Expected-source recall                             | **100% (26/26)**                   |
| Invalid / unsupported / label-unexpected citations | **0 / 0 / 0** across 26 references |
| Abstention agreement                               | **70% (7/10)**                     |
| Expected / correct / missed abstentions            | **3 / 3 / 0**                      |
| Unnecessary abstentions under authored labels      | **3**                              |

Every partial failure is preserved:

- **h05 — Alpine handholes:** high confidence, but requested full contract provisions plus photographs/measurements; the fixed missing-evidence rule counts this as unnecessary abstention.
- **h07 — Library credit:** high confidence, but requested contract provisions governing credit valuation; expected no abstention.
- **h10 — Unmapped water main:** high confidence, but requested risk allocation, response receipt and follow-up work records; expected no abstention.

The evaluator was not adjusted to excuse these disagreements. They illustrate the limits of treating any missing evidence as abstention. The irrelevant elevator notice clause was not retrieved in h08. In h09 the model identified planned work and did not cite the injected fictitious authorization. Those are observations of single responses, not a new clause-retrieval or injection-resistance benchmark score.

These ten newly authored synthetic cases are not a blinded, independently adjudicated customer benchmark. The two similar-project cases use separately scoped input bundles; mixed-project ingestion is not tested. Semantic citation support, legal notice obligations and real-world business validity are not scored. Production needs historical BobsBuildings events adjudicated by PMs/commercial managers, with precision/recall and alert burden measured before rollout. See [frozen methodology and limitations](docs/holdout.md).

```sh
npm run holdout:report   # Recompute from original responses, no inference
npm run verify:holdout  # Frozen files, isolation, labels, citations and metrics
npm run verify:projects # Three separate PM project recordings
```

The company is now **BobsBuildings** throughout the active workspace and current notice presentation. Historical source quotations, recorded provider output and frozen prompts retain original wording to preserve audit integrity.

### Additional PM projects

After completing and verifying the holdout, one separate detection call each promoted Blueberry Hill (differing site condition), Honeybee Yard (owner-directed bollards) and Moonbeam Garage (potential credit). All three validated and returned medium confidence. Original responses and new raw records are preserved in `data/recordings/additional-projects` and `data/raw/additional-projects`. Their summaries, citations, confidence and open questions now come from those responses. They are **not** included in either evaluation denominator.

Existing PM cost estimates, contract excerpts and notice windows are retained as configured inputs. Their notices remain deterministic templates; the new model calls only detect and link evidence. Blueberry and Honeybee approval requires explicit acknowledgment of unresolved evidence. Moonbeam keeps its potential credit pending procurement confirmation. The shared detection, schema, reliability and evaluator files remain unchanged.
