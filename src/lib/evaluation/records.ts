import { z } from "zod";
export const evaluationRecordSchema = z.strictObject({
  caseId: z.string(),
  attempt: z.literal(1),
  startedAt: z.iso.datetime(),
  completedAt: z.iso.datetime(),
  cliVersion: z.string(),
  inputSourceIds: z.array(z.string()),
  inputHash: z.string(),
  promptHash: z.string(),
  schemaHash: z.string(),
  responseHash: z.string(),
  provider: z.string(),
  model: z.string(),
  output: z.unknown(),
  rawResponse: z.string(),
  latencyMs: z.number().int().nonnegative(),
  usage: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      cachedInputTokens: z.number(),
    })
    .nullable(),
  toolCalls: z.number().int().nonnegative(),
  error: z.string().nullable(),
  schemaValidation: z.object({
    valid: z.boolean(),
    errors: z.array(z.string()),
  }),
  validation: z.object({ valid: z.boolean(), errors: z.array(z.string()) }),
});
export type EvaluationRecord = z.infer<typeof evaluationRecordSchema>;
