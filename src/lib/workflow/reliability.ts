import { validateDetection } from "../ai/link-evidence";
import type { NormalizedSource } from "../sources/normalize";

/** Conservative lineage proxy: matching message IDs and exact copied content are one record. */
export function independentRecordKeys(sources: NormalizedSource[]) {
  return [
    ...new Set(
      sources
        .filter((source) => source.sourceType !== "contract")
        .map((source) => {
          const body = Object.values(source.fields).join("\n");
          const messageId =
            source.fields.messageId ||
            body.match(/message id\s+([\w.-]+)/i)?.[1];
          return messageId
            ? `message:${messageId.toLowerCase()}`
            : `${source.sourceType}:${body.replace(/^forwarded\s+/i, "").trim()}`;
        }),
    ),
  ];
}

export function assessReliability(
  output: unknown,
  sources: NormalizedSource[],
) {
  let analysis;
  try {
    analysis = validateDetection(output, sources);
  } catch (error) {
    return {
      disposition: "needs_evidence" as const,
      independentRecords: 0,
      reasons: [error instanceof Error ? error.message : String(error)],
    };
  }
  if (
    !analysis.possibleChange ||
    ["planned_work", "contractor_rework"].includes(analysis.eventType)
  )
    return {
      disposition: "do_not_surface" as const,
      independentRecords: 0,
      reasons: ["No commercial change hypothesis supported"],
    };
  const linked = new Set(
    analysis.evidenceReferences.map((reference) => reference.sourceId),
  );
  const independentRecords = independentRecordKeys(
    sources.filter((source) => linked.has(source.id)),
  ).length;
  const reasons: string[] = [];
  if (analysis.confidence === "low" || analysis.eventType === "ambiguous")
    reasons.push("Uncertain classification requires clarification");
  if (independentRecords < 2)
    reasons.push("At least two independent source records are required");
  return {
    disposition: reasons.length
      ? ("needs_evidence" as const)
      : ("pm_review" as const),
    independentRecords,
    reasons,
  };
}
