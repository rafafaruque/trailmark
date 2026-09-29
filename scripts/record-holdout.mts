import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import dataset from "../data/evals/holdout/cases.json";
import freeze from "../data/evals/holdout/freeze.json";
import { normalizeSources } from "../src/lib/sources/normalize";
import {
  detectionRequest,
  detectChangeEvent,
} from "../src/lib/ai/detect-change-event";
import { detectionSchema } from "../src/lib/ai/schemas";
import { CodexCliProvider } from "./providers/codex-cli";
import type { ProviderResponse } from "../src/lib/ai/provider";

const model = "gpt-6-astra";
const directory = "data/evals/runs/phase4-holdout-v1";
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fileHash = async (path: string) =>
  createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
const save = (path: string, value: unknown) =>
  writeFile(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
// Strip all expected outcomes, descriptions, evaluation notes and metadata BEFORE constructing requests.
const inputs = dataset.cases.map(({ id, sources }) => ({
  caseId: id,
  sources: normalizeSources(sources),
}));
assert.equal(inputs.length, 10);
const cliVersion = execFileSync("codex", ["--version"], {
  encoding: "utf8",
}).trim();
await mkdir(directory, { recursive: true });
const files = Object.keys(freeze.fileHashes);
const fileHashes = Object.fromEntries(
  await Promise.all(files.map(async (file) => [file, await fileHash(file)])),
);
assert.deepEqual(
  fileHashes,
  freeze.fileHashes,
  "Frozen system changed before holdout inference",
);
// Exclusive batch reservation prevents reruns, even following interruption. No resume/retry path.
await save(`${directory}/manifest.json`, {
  id: "phase4-holdout-v1",
  split: "holdout",
  freezeHash: hash(freeze),
  startedAt: new Date().toISOString(),
  provider: "codex-cli",
  model,
  cliVersion,
  caseIds: inputs.map((item) => item.caseId),
  datasetHash: hash(dataset),
  fileHashes,
  scoringVersion: "phase3-v1",
  attemptsPerCase: 1,
});
const provider = new CodexCliProvider(model);
for (const { caseId, sources } of inputs) {
  const startedAt = new Date().toISOString();
  const prefix = `${directory}/${caseId}`;
  const request = detectionRequest(sources);
  await save(`${prefix}.attempt.json`, { caseId, attempt: 1, startedAt });
  await save(`${prefix}.input.json`, sources);
  await save(`${prefix}.request.json`, request);
  let response: ProviderResponse;
  let validation: { valid: boolean; errors: string[] };
  const started = performance.now();
  try {
    const run = await detectChangeEvent(
      {
        generate: async (actualRequest) => {
          assert.deepEqual(actualRequest, request);
          return provider.generate(actualRequest);
        },
      },
      sources,
    );
    response = run.response;
    validation = run.validation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    response = {
      provider: "codex-cli",
      model,
      output: null,
      rawResponse: "",
      latencyMs: Math.round(performance.now() - started),
      usage: null,
      toolCalls: 0,
      error: message,
    };
    validation = { valid: false, errors: [message] };
  }
  const parsed = detectionSchema.safeParse(response.output);
  await writeFile(`${prefix}.response.txt`, response.rawResponse, {
    flag: "wx",
  });
  const record = {
    caseId,
    attempt: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    cliVersion,
    inputSourceIds: sources.map((source) => source.id),
    inputHash: hash(sources),
    promptHash: hash(request.prompt),
    schemaHash: hash(request.schema),
    responseHash: createHash("sha256")
      .update(response.rawResponse)
      .digest("hex"),
    ...response,
    schemaValidation: {
      valid: parsed.success,
      errors: parsed.success
        ? []
        : parsed.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
    },
    validation,
  };
  await save(`${prefix}.json`, record);
  console.log(
    JSON.stringify({
      caseId,
      providerError: response.error,
      validation,
      latencyMs: response.latencyMs,
      usage: response.usage,
    }),
  );
}
await save(`${directory}/completion.json`, {
  completedAt: new Date().toISOString(),
  casesAttempted: inputs.length,
});
