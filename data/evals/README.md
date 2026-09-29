# Evaluation foundation

`cases.json` contains ten synthetic cases with independent raw source records and expected labels. These expectations are authored fixtures, not externally adjudicated construction/legal ground truth. Status: **not_run**.

The cases cover owner-directed work, differing site condition, planned work, contractor rework, ambiguous direction, scope reduction, insufficient evidence, duplicate descriptions, unrelated records and an unconfirmed credit.

Each expected label set includes `shouldFlag`, `expectedEventType`, `expectedEvidenceSourceIds`, `noticeLikelyRequired` and `expectedAbstention`. The model should receive only a case's normalized sources, never its expected labels.

A small comparison utility accepts actual recorded model outputs:

```sh
npm run eval:compare -- /path/to/outputs.json
```

Input is an array of `{ "caseId": "owner-bollards", "output": { ... } }`, where `output` must match the production detection schema. The utility validates citations against that case and reports per-case matches for flag, type, unique source IDs and abstention. Abstention means a flagged event is low-confidence, ambiguous, or has missing evidence. `noticeLikelyRequired` is retained as a future target but explicitly not scored: evaluating it requires contract and policy fixtures, not an LLM-generated permission.

This utility makes no provider calls, retries or aggregate accuracy claims. Production recording tests and expected-label schema tests are software checks, not a model evaluation run.
