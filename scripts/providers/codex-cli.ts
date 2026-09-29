import { spawn } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type {
  AnalysisProvider,
  AnalysisRequest,
  ProviderResponse,
} from "../../src/lib/ai/provider";

/** Local recording only. Isolated working directory; no project files, plugins, tools or external integrations. */
export class CodexCliProvider implements AnalysisProvider {
  constructor(readonly model: string) {}

  async generate(request: AnalysisRequest): Promise<ProviderResponse> {
    const directory = await mkdtemp(join(tmpdir(), "trailmark-analysis-"));
    const schemaFile = join(directory, "schema.json");
    const outputFile = join(directory, "response.json");
    await writeFile(schemaFile, JSON.stringify(request.schema));
    const args = [
      "exec",
      "--ignore-user-config",
      "--ephemeral",
      "--skip-git-repo-check",
      "--sandbox",
      "read-only",
      "--model",
      this.model,
      "--color",
      "never",
      "--json",
      "--output-schema",
      schemaFile,
      "--output-last-message",
      outputFile,
      "-c",
      'approval_policy="never"',
      "-c",
      'model_reasoning_effort="medium"',
      "-c",
      'web_search="disabled"',
      "-c",
      "features.shell_tool=false",
      "-c",
      "features.unified_exec=false",
      "-c",
      "features.apps=false",
      "-c",
      "features.plugins=false",
      "-c",
      "features.multi_agent=false",
      "-",
    ];
    const started = performance.now();
    let stdout = "";
    let stderr = "";
    let failure: string | null = null;
    const exitCode = await new Promise<number | null>((resolve) => {
      const child = spawn("codex", args, {
        cwd: directory,
        stdio: ["pipe", "pipe", "pipe"],
      });
      const timeout = setTimeout(() => {
        failure = "Provider timed out after 5 minutes; no retry attempted";
        child.kill("SIGTERM");
      }, 300_000);
      child.stdout.on("data", (chunk) => {
        stdout += String(chunk);
      });
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
      });
      child.on("error", (error) => {
        failure = error.message;
        clearTimeout(timeout);
        resolve(null);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        resolve(code);
      });
      child.stdin.on("error", () => {
        /* Exit handling records a failed subprocess. */
      });
      child.stdin.end(request.prompt);
    });
    const latencyMs = Math.round(performance.now() - started);
    const events: Array<Record<string, unknown>> = stdout
      .split("\n")
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line)];
        } catch {
          return [];
        }
      });
    const completed = events.findLast(
      (event) => event.type === "turn.completed",
    ) as
      | {
          usage?: {
            input_tokens?: number;
            output_tokens?: number;
            cached_input_tokens?: number;
          };
        }
      | undefined;
    const usage = completed?.usage
      ? {
          inputTokens: completed.usage.input_tokens || 0,
          outputTokens: completed.usage.output_tokens || 0,
          cachedInputTokens: completed.usage.cached_input_tokens || 0,
        }
      : null;
    const toolCalls = events.filter((event) => {
      const item = event.item as { type?: string } | undefined;
      return (
        event.type === "item.completed" &&
        !!item?.type &&
        [
          "command_execution",
          "mcp_tool_call",
          "web_search",
          "file_change",
          "collab_tool_call",
        ].includes(item.type)
      );
    }).length;
    let rawResponse = "";
    let output: unknown = null;
    try {
      rawResponse = await readFile(outputFile, "utf8");
    } catch (error) {
      failure ||= `No final response: ${error instanceof Error ? error.message : String(error)}`;
    }
    // A completed but malformed answer is model output failure, not provider transport failure.
    try {
      output = JSON.parse(rawResponse);
    } catch {
      output = null;
    }
    if (exitCode !== 0)
      failure ||= `Codex exited ${exitCode}: ${stderr.slice(-1500)}`;
    // Never bundle credentials, local config, or internal reasoning streams into the hosted app.
    return {
      provider: "codex-cli",
      model: this.model,
      output,
      rawResponse,
      latencyMs,
      usage,
      toolCalls,
      error: failure,
    };
  }
}
