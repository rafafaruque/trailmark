/** Provider-neutral boundary. Local CLI implementations are never imported by hosted routes. */
export interface AnalysisRequest {
  prompt: string;
  schema: Record<string, unknown>;
}
export interface ProviderResponse {
  provider: string;
  model: string;
  output: unknown;
  rawResponse: string;
  latencyMs: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cachedInputTokens: number;
  } | null;
  toolCalls: number;
  error: string | null;
}
export interface AnalysisProvider {
  generate(request: AnalysisRequest): Promise<ProviderResponse>;
}
