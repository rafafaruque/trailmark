import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "daily_log",
  "email",
  "rfi",
  "drawing",
  "contract",
]);
export const timestampSchema = z.iso.datetime({ offset: true });
export const rawSourceSchema = z.strictObject({
  id: z.string().min(1),
  projectId: z.string().min(1),
  sourceType: sourceTypeSchema,
  system: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  recordedAt: timestampSchema,
  data: z.record(z.string(), z.json()),
});
export type RawSource = z.infer<typeof rawSourceSchema>;
export interface NormalizedSource extends Omit<RawSource, "data"> {
  fields: Record<string, string>;
}

function flatten(
  value: unknown,
  prefix: string,
  result: Record<string, string>,
) {
  if (value === null) return;
  if (typeof value !== "object") {
    result[prefix] = String(value);
    return;
  }
  for (const [key, child] of Object.entries(value))
    flatten(child, prefix ? `${prefix}.${key}` : key, result);
}

/** Normalization retains exact text. It never summarizes, invents an event, or assigns cost. */
export function normalizeSources(input: unknown[]): NormalizedSource[] {
  const sources = input.map((value) => {
    const { data, ...metadata } = rawSourceSchema.parse(value);
    const fields: Record<string, string> = Object.create(null);
    flatten(data, "", fields);
    return { ...metadata, fields };
  });
  if (new Set(sources.map((source) => source.id)).size !== sources.length)
    throw new Error("Duplicate source IDs in input");
  return sources;
}

export function sourceText(source: NormalizedSource): string {
  return Object.entries(source.fields)
    .map(([field, value]) => `${field}:\n${value}`)
    .join("\n\n");
}
