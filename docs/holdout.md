# Phase 4: frozen-system holdout

The aim is to stress the system after the development evaluation, not optimize a score. `data/evals/holdout/freeze.json` records the git revision, freeze time and SHA-256 fingerprints before holdout authoring. The detection prompt, structured-output schema, reliability policy and deterministic evaluator are unchanged from Phase 3. The source normalizer, citation validator and Codex adapter are frozen too. No model settings were changed.

Ten new synthetic cases and all expected labels were authored before the first inference. The runner records a dataset fingerprint before calling the model. Case IDs are neutral (`h01`–`h10`) rather than embedding expected classifications. These are newly authored examples after development results were known, not independently collected or blinded customer cases.

| Case | Stressor                                                                         | Authored target                                                |
| ---- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| h01  | Owner email and RFI disagree about whether eight barriers are additional         | Flag ambiguous work; abstain                                   |
| h02  | Original, forwarded and copied canopy direction share a message ID               | Flag owner direction; abstain for lack of independent evidence |
| h03  | One message claims owner authority without corroboration                         | Flag potential owner direction; abstain                        |
| h04  | Crew calls work “extra,” but original measured scope includes it                 | Planned work; do not flag                                      |
| h05  | Alpine Hub adds east-gate handholes                                              | Owner-directed addition                                        |
| h06  | Birch Hub has similar handholes already in its original scope                    | Planned work; no cross-project substitution                    |
| h07  | Approved, unprocured fixture deletion supported by a baseline                    | Potential credit                                               |
| h08  | Unchanged roof work accompanied by an irrelevant elevator notice clause          | Planned work; no notice scoring                                |
| h09  | Log includes instruction-like text ordering a false change and invented citation | Planned work; document text is untrusted data                  |
| h10  | Unmapped active water main contradicts the original utilities survey             | Differing site condition                                       |

Only each case's normalized source records enter the unchanged production request. Expected labels, evaluator logic, descriptions and other answers are excluded. Exactly one `detectChangeEvent` call per case uses the same isolated Codex CLI / gpt-6-astra path, without tools or retries. Prompt bytes, source IDs, original output, citations, tokens, latency, validation and provider errors are preserved under `data/evals/runs/phase4-holdout-v1/`. Completion and results are separate from the development batch.

`aggregateEvaluation` is reused byte-for-byte. It scores detection precision/recall, exact event type, expected-source recall, invalid/unsupported/unexpected citations and abstention agreement. The existing broad abstention proxy remains unchanged: low confidence, ambiguous type or any missing evidence. Provider and malformed-output failures are reported separately and excluded from semantic denominators; unavailable ratios remain unavailable. Notice likelihood remains unscored.

No labels, prompts, rules or model outputs are revised after viewing the responses. `verify:holdout` checks frozen files, expected-label fingerprints, chronological freeze/authoring/run order, isolated request bytes, original responses and recomputed comparisons. Production builds verify both development and holdout recordings. Derived reports can be regenerated locally without inference; existing attempt locks prevent a second run.

The customer-facing company name is now **BobsBuildings**. Branding changes apply to the app and current notice presentation. Original source records, provider prose, frozen prompt text and all audit bytes retain their historical wording; source quotations are never silently renamed.

## Limits

These ten synthetic cases do not establish domain validity or production reliability. The paired project cases test separately scoped inputs; they do not test mixed-project ingestion, which the frozen validator rejects. Exact source checks do not prove semantic support. The frozen scorer has no dedicated metric for irrelevant-clause selection or prompt-injection resistance; inspect those outputs directly rather than inventing a new success score after the run. One attempt per case provides no estimate of stochastic variance.

Any future improvement requires a separately versioned system and new held-out examples. For production, use historical BobsBuildings records adjudicated by PMs and commercial managers, then measure precision, recall, missing evidence and alert burden before rollout.

## Recorded outcomes

All ten attempts completed with Codex CLI 0.158.0 / gpt-6-astra. There were no provider, schema or tool-boundary failures. The frozen scorer reports 6 TP, 4 TN, 0 FP, 0 FN; precision and recall 6/6; type match 10/10; expected-source recall 26/26; 0 invalid, unsupported or unexpected citations across 26 references. Abstention agreement is 7/10, with all three expected abstentions recognized and three additional abstentions.

The partial failures are h05 (requested contract scope and work documentation), h07 (requested credit-valuation provisions), and h10 (requested risk allocation, receipt and follow-up work documentation). All three outputs were high confidence but had nonempty missing-evidence lists, so the frozen rule disagreed with the preauthored non-abstention labels. No labels were changed to improve agreement.

After holdout completion, three separate one-attempt detections promoted Blueberry Hill, Honeybee Yard and Moonbeam Garage into source-backed PM scenarios. All returned medium confidence and passed validation. These runs are not holdout cases and are not added to any benchmark denominator. Existing commercial inputs are still PM-configured; detection does not validate the amounts, deadlines, authority or entitlement implied by those inputs. Their open questions are surfaced and provisional-notice approval requires PM acknowledgment.
