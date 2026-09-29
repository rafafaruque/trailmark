# Recorded synthetic evaluation

The original `cases.json` contains ten independent synthetic scenarios and authored expected labels. It is unchanged from Phase 2, including its historical `not_run` preparation status. The actual completed Phase 3 status and results are in `runs/phase3-v1/` and `phase3-results.json`.

**Authored synthetic evaluation ground truth** means prototype expectations, not legal or construction-domain truth. The original “Human-authored” fixture note does not imply independent subject-matter-expert adjudication.

The completed batch used Codex CLI / gpt-6-astra once per case: 10 attempted, 0 provider errors. Component results: precision 7/7, recall 7/7, type match 10/10, source recall 17/17, 1 label-unexpected source, 0 unsupported sources, 0 invalid citations out of 18, abstention agreement 6/10. All four partial failures remain inspectable.

Each case has an exclusive attempt file, normalized input, exact production request/schema, original response and metadata record. The manifest freezes dataset and scorer hashes before inference. No labels or scoring logic were sent to the model. No LLM judge or retry was used.

```sh
npm run eval:report
npm run verify:evals
npm run eval:compare -- /path/to/outputs.json
```

`eval:report` regenerates only the derived results bundle. `verify:evals` checks artifacts and recomputes metrics without inference. `eval:compare` accepts an array of `{caseId, output, error?, toolCalls?}` and performs the same deterministic comparison; preserve provider errors in `error` so they are not treated as quality failures. These commands never contact the provider.

`noticeLikelyRequired` remains deliberately unscored until contract/policy fixtures exist. See [full metric definitions, failures, policy and business implications](../../docs/evaluation.md), [measured README results](../../README.md#evaluation--phase-3) and `/system/evals`.
