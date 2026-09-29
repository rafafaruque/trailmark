import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { CodexCliProvider } from "./providers/codex-cli";
import { draftNotice } from "../src/lib/ai/draft-notice";
import { deriveWorkflow } from "../src/lib/workflow/derive";
import {
  strawberrySources,
  projectPricing,
  snapshotTime,
  projectTimezone,
} from "../src/lib/sources/records";

// Uses the already-recorded detection. Never repeats or modifies it.
const directory = resolve("data/recordings");
const detection = JSON.parse(
  await readFile(
    resolve(directory, "strawberry-fields-detection.json"),
    "utf8",
  ),
);
if (!detection.validation.valid)
  throw new Error("Detection recording did not validate");
const workflow = deriveWorkflow(
  detection.output,
  strawberrySources,
  projectPricing,
  snapshotTime,
  projectTimezone,
);
if (!workflow.draftEligible)
  throw new Error(`Draft blocked: ${workflow.blockers.join("; ")}`);
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const id = "strawberry-fields-notice";
const model = detection.model;
const startedAt = new Date().toISOString();
const cliVersion = execFileSync("codex", ["--version"], {
  encoding: "utf8",
}).trim();
await mkdir(directory, { recursive: true });
await writeFile(
  resolve(directory, `${id}.attempt.json`),
  JSON.stringify(
    { id, attempt: 1, startedAt, provider: "codex-cli", model, cliVersion },
    null,
    2,
  ),
  { flag: "wx" },
);
const run = await draftNotice(
  new CodexCliProvider(model),
  workflow,
  strawberrySources,
);
const record = {
  id,
  stage: "notice",
  attempt: 1,
  startedAt,
  completedAt: new Date().toISOString(),
  provider: run.response.provider,
  model,
  cliVersion,
  inputSourceIds: strawberrySources.map((source) => source.id),
  inputHash: hash(strawberrySources),
  promptHash: hash(run.request.prompt),
  schemaHash: hash(run.request.schema),
  latencyMs: run.response.latencyMs,
  usage: run.response.usage,
  toolCalls: run.response.toolCalls,
  output: run.response.output,
  validation: run.validation,
  error: run.response.error,
  context: {
    detectionRecord: detection.id,
    detectionOutputHash: hash(detection.output),
    pricingHash: hash(projectPricing),
    deadline: workflow.deadline,
    cost: workflow.cost,
    prerequisitesPassed: workflow.draftEligible,
    unresolvedReviewQuestions: workflow.reviewQuestions,
    policy:
      "Provisional draft only; PM must explicitly review unresolved scope, authority and trigger assumptions before approval. No delivery adapter.",
  },
};
await writeFile(
  resolve(directory, `${id}.json`),
  JSON.stringify(record, null, 2) + "\n",
  { flag: "wx" },
);
await writeFile(
  resolve(directory, `${id}.response.txt`),
  run.response.rawResponse,
  { flag: "wx" },
);
await writeFile(
  resolve(directory, `${id}.request.json`),
  JSON.stringify(run.request, null, 2) + "\n",
  { flag: "wx" },
);
console.log(
  JSON.stringify({
    id,
    validation: record.validation,
    latencyMs: record.latencyMs,
    usage: record.usage,
  }),
);
if (!run.validation.valid) process.exitCode = 1;
