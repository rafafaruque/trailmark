# Phase 3 reliability evaluation

The evaluation asks whether the unchanged detection pipeline agrees with ten authored synthetic scenarios beyond the Strawberry Fields example. It measures component behavior, not an overall AI score or legal/construction-domain validity. The PM homepage remains focused on exposure, deadlines, evidence and action. Engineering results live at `/system/evals` with a separate view for every case.

## Fixed boundary and preserved attempts

The existing `data/evals/cases.json` is unchanged. Its `status: not_run` records its Phase 2 preparation state; Phase 3 execution status lives in the new run manifest, completion record and results bundle. Its existing “Human-authored” notes are original fixture wording, not an assertion of expert adjudication. Treat all expected labels as **Authored synthetic evaluation ground truth** for this prototype.

Before inference, the runner freezes dataset and scorer/policy/prompt/schema/provider fingerprints. It strips expected labels, descriptions and evaluation notes, then uses only normalized source records with the same `detectionRequest` / `detectChangeEvent` and Codex CLI adapter as Phase 2. Neither scoring code nor other cases' answers enters a request. Each task runs in an isolated directory with file, web and tool access disabled. The [official non-interactive Codex documentation](https://learn.chatgpt.com/docs/non-interactive-mode) describes the structured-output execution path.

Each case gets one provider call, without retries. An exclusive batch manifest and per-case attempt files prevent accidental reruns. Inputs and exact requests are saved before inference. Outputs, response bytes, provider/model, source IDs, latency, usage, schema validation, citation validation, tool calls and provider errors are saved after each call. Interrupted batches must be investigated, not silently retried or overwritten. All source data is fictional; the authenticated CLI is used only by the local recorder, never Vercel.

A completed but malformed JSON answer is a model-output failure. Missing provider response, transport/CLI failure or timeout is a provider error. The adapter now keeps those separate. No second model interprets results or writes failure explanations.

## Scoring rules fixed before inference

`src/lib/evaluation/compare.ts`, version `phase3-v1`, is deterministic. The production prompt and schema are unchanged. Fingerprints in the manifest bind the scoring implementation used for this run.

| Component              | Calculation                                                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| Change detection       | Compare `possibleChange` to `shouldFlag`; report TP, FP, TN, FN                                     |
| Precision              | TP / (TP + FP)                                                                                      |
| Recall                 | TP / (TP + FN)                                                                                      |
| Classification         | Exact `eventType` matches / scored cases                                                            |
| Expected source recall | Micro-average: validly cited distinct expected IDs / all expected IDs in scored cases               |
| Unexpected sources     | Distinct cited IDs outside the authored expected list, counted per case                             |
| Unsupported sources    | Distinct referenced IDs absent from supplied inputs, counted per case                               |
| Invalid citations      | Every failed source/project/type/field/exact-excerpt check, including contract citations if present |
| Abstention             | Existing Phase 2 proxy: low confidence OR ambiguous event type OR nonempty `missingEvidence`        |
| Abstention accuracy    | Expected/observed abstention agreements / scored cases, including correct non-abstentions           |

Expected and actual abstentions, missed abstentions and unnecessary abstentions are reported separately. A valid unexpected citation is not fabricated evidence; it can reflect a label disagreement over relevance. A missing expected record only counts as retrieved when at least one exact citation to it validates. Repeated citations cannot inflate recall. Exact string checks establish provenance, not whether the quoted material supports the conclusion semantically.

Provider errors, malformed schemas and tool-boundary failures are reported separately and excluded from semantic denominators. They never become false negatives by default. Schema-valid responses with grounding failures remain in semantic scoring so invalid evidence is not hidden. The UI shows attempted and scored counts beside metrics. Ratios with no eligible denominator display **Not available**, never 0% or 100%.

`noticeLikelyRequired` is deliberately unscored: cases lack sufficient executed-contract/trigger/policy fixtures. Deadline legality, entitlement, cost recovery, pricing and real-world citation semantics are also not evaluated. No pass percentage combining unrelated components is presented.

## PM surfacing gate

`src/lib/workflow/reliability.ts` is used by the production workflow before notice-draft prerequisites, and shown separately for each evaluated case. It uses no expected labels.

1. Schema and all references must validate.
2. A commercial change hypothesis must exist; planned work, contractor rework and negative detections are not surfaced as commercial changes.
3. Confidence must be medium or high, event type non-ambiguous, and at least two independent field records must be linked.
4. Uncertain or insufficiently grounded positive cases become **Needs evidence**. Otherwise create a potential event for **PM review**, retaining all unresolved questions.

The independence check groups explicit matching message IDs and exact copied content. In the duplicate-email case, two source IDs with the same original message ID count once. This is a conservative prototype proxy, not robust semantic lineage detection; richer source-system message/revision relationships are needed in production.

This gate does not send notices, approve cost recovery or establish entitlement. Existing deterministic deadline/cost functions and explicit PM approval remain separate. The Phase 3 metrics score raw model decisions, not filtered alerts, so gate behavior cannot hide poor inference results.

## Business implications

| Error class                             | Operational consequence                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------- |
| Missed change / false negative          | Legitimate added work may miss a notice window or remain unrecovered              |
| False positive                          | PM time spent investigating normal work; alert fatigue and lower adoption         |
| Wrong type                              | Wrong reviewer, commercial framing or next action                                 |
| Missing evidence                        | PM cannot reconstruct the full record; more investigation and delay               |
| Unsupported evidence / invalid citation | Indefensible conclusion, poor commercial decision and loss of trust               |
| Failed abstention                       | Unclear responsibility presented too confidently; risk of unsupported notice      |
| Unnecessary abstention                  | Additional clarification and slower action despite sufficient authored evidence   |
| Malformed output / provider failure     | Automation is unavailable; route to manual review and monitor service reliability |

Higher recall catches more potential revenue but may waste PM attention. Higher precision reduces noise but risks missing legitimate changes. This threshold is a business choice to make with the commercial team, not a model leaderboard choice.

## Limits and next production step

Ten concise synthetic cases are too small to estimate production reliability. Their scenario-revealing IDs and explicit wording were retained from Phase 2, so this is not a blinded benchmark. Cases and expected labels were authored within this prototype; they have not been independently reviewed by construction experts. One run per case does not measure variability, and the abstention proxy treats any missing evidence as caution, even when requesting it may be commercially prudent.

Replace synthetic cases with adjudicated historical project events from BobsBuildings PMs and commercial managers. Include missed changes, normal daily activity, disputed authority, incomplete records, duplicates, credits and real notice obligations. Agree on labels and useful abstention behavior before measuring precision/recall, alert burden per project and PM review time on held-out cases. Review uncertain disagreements with subject-matter experts before rollout.

Blueberry Hill, Honeybee Yard and Moonbeam Garage remained fixtures during Phase 3. They were promoted after the Phase 4 holdout, with separate detection recordings excluded from all evaluation metrics.

## Reproduce scoring without inference

```sh
npm run eval:report
npm run verify:evals
```

`eval:report` regenerates the derived bundle from immutable run artifacts; it performs no model calls. `verify:evals` checks frozen dataset/scorer hashes, each exact isolated request, original responses, validation results and recomputed aggregate metrics. Both verification suites run before the production build. `eval:record` is protected by the existing manifest and will refuse to rerun this batch.
