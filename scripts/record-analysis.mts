import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { CodexCliProvider } from "./providers/codex-cli";
import { detectChangeEvent } from "../src/lib/ai/detect-change-event";
import { draftNotice } from "../src/lib/ai/draft-notice";
import { deriveWorkflow } from "../src/lib/workflow/derive";
import {
  strawberrySources,
  cloverSources,
  projectPricing,
  snapshotTime,
  projectTimezone,
} from "../src/lib/sources/records";
import type { NormalizedSource } from "../src/lib/sources/normalize";

const model = process.env.TRAILMARK_AI_MODEL || "gpt-6-astra";
const provider = new CodexCliProvider(model);
const cliVersion = execFileSync("codex", ["--version"], {
  encoding: "utf8",
}).trim();
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const directory = resolve("data/recordings");
await mkdir(directory, { recursive: true });

async function reserve(id: string) {
  const startedAt = new Date().toISOString();
  // Exclusive creation prevents accidental reruns, including after an interrupted or failed request.
  await writeFile(
    resolve(directory, `${id}.attempt.json`),
    JSON.stringify(
      { id, attempt: 1, startedAt, provider: "codex-cli", model, cliVersion },
      null,
      2,
    ),
    { flag: "wx" },
  );
  return startedAt;
}

async function save(
  id: string,
  startedAt: string,
  sources: NormalizedSource[],
  run: Awaited<ReturnType<typeof detectChangeEvent>>,
  stage: "detection" | "notice",
  context: unknown = null,
) {
  const record = {
    id,
    stage,
    attempt: 1,
    startedAt,
    completedAt: new Date().toISOString(),
    provider: run.response.provider,
    model: run.response.model,
    cliVersion,
    inputSourceIds: sources.map((source) => source.id),
    inputHash: hash(sources),
    promptHash: hash(run.request.prompt),
    schemaHash: hash(run.request.schema),
    latencyMs: run.response.latencyMs,
    usage: run.response.usage,
    toolCalls: run.response.toolCalls,
    output: run.response.output,
    validation: run.validation,
    error: run.response.error,
    context,
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
  return record;
}

const sfStarted = await reserve("strawberry-fields-detection");
const sfRun = await detectChangeEvent(provider, strawberrySources);
const sfRecord = await save(
  "strawberry-fields-detection",
  sfStarted,
  strawberrySources,
  sfRun,
  "detection",
);

const ccStarted = await reserve("clover-court-detection");
const ccRun = await detectChangeEvent(provider, cloverSources);
await save(
  "clover-court-detection",
  ccStarted,
  cloverSources,
  ccRun,
  "detection",
);

if (sfRecord.validation.valid) {
  const workflow = deriveWorkflow(
    sfRecord.output,
    strawberrySources,
    projectPricing,
    snapshotTime,
    projectTimezone,
  );
  if (workflow.draftEligible) {
    const started = await reserve("strawberry-fields-notice");
    const run = await draftNotice(provider, workflow, strawberrySources);
    await save(
      "strawberry-fields-notice",
      started,
      strawberrySources,
      run,
      "notice",
      {
        detectionRecord: sfRecord.id,
        detectionOutputHash: hash(sfRecord.output),
        pricingHash: hash(projectPricing),
        deadline: workflow.deadline,
        cost: workflow.cost,
        prerequisitesPassed: true,
      },
    );
  } else
    console.log(
      JSON.stringify({ notice: "blocked", blockers: workflow.blockers }),
    );
}
if (!sfRun.validation.valid || !ccRun.validation.valid) process.exitCode = 1;
