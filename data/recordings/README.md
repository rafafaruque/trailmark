# Preserved Phase 2 provider runs

Three real Codex CLI / gpt-6-astra calls were made: one Strawberry Fields detection, one Clover Court detection, and one Strawberry Fields notice-prose request. All ran against synthetic records, with zero tool calls. No detection was retried.

For each ID:

- `.attempt.json` is the exclusive attempt reservation; it prevents accidental reruns, including after failure.
- `.request.json` preserves the exact prompt and JSON Schema supplied.
- `.response.txt` preserves the original final provider response.
- `.json` contains provider/model/CLI version, input IDs and hashes, output, usage, latency, errors and original validation.

`strawberry-fields-notice.validation.json` is an additional offline validation record. The first validator rejected a valid reference to the retrieved contract because that source was omitted from its allowlist. Only the validator was corrected; the output is unchanged. Its SHA-256 fingerprint binds the corrected validation to the original response bytes. The original failed validation has not been overwritten.

```sh
npm run verify:recordings
```

This verifies current normalized inputs, saved prompts/schemas, response equivalence, exact citations and deterministic notice context. The app's build runs it automatically. Do not format, edit or replace these audit artifacts to change a result. Future experiments need distinct IDs and preserved failures.
