import dataset from "../../../data/raw/additional-projects/sources.json";
import bundle from "../../../data/recordings/additional-projects/results.json";
import { evaluationRecordSchema } from "../evaluation/records";
import { normalizeSources, sourceText } from "../sources/normalize";
import { validateDetection } from "../ai/link-evidence";
import { assessReliability } from "./reliability";
import type { ChangeEvent, EvidenceItem, EvidenceKind } from "../types";
export const additionalProjectRecords = bundle.records.map((record) =>
  evaluationRecordSchema.parse(record),
);
export const additionalProjectSources = dataset.cases.flatMap((item) =>
  normalizeSources(item.sources),
);
const eventIds: Record<string, string> = {
  "blueberry-hill": "blueberry-hill-rock-excavation",
  "honeybee-yard": "honeybee-yard-added-bollards",
  "moonbeam-garage": "moonbeam-garage-charger-revision",
};
export function applyProjectDetection(base: ChangeEvent): ChangeEvent {
  const record = additionalProjectRecords.find(
    (record) => record.caseId === base.projectId,
  );
  if (!record) return base;
  const sources = additionalProjectSources.filter(
    (source) => source.projectId === base.projectId,
  );
  if (record.error || record.toolCalls || !record.validation.valid)
    return {
      ...base,
      status: "insufficient",
      priority: "needs-evidence",
      confidence: "Needs evidence",
      summary:
        "Recorded analysis could not be validated. Review the source records before treating this as a commercial change.",
      missing: "Validated analysis",
      contract: undefined,
      recommendation: "Request field clarification.",
      analysisRecordId: record.caseId,
    };
  const analysis = validateDetection(record.output, sources);
  const reliability = assessReliability(analysis, sources);
  const insufficient = reliability.disposition !== "pm_review";
  return {
    ...base,
    title: analysis.title,
    summary: analysis.shortSummary,
    description: analysis.shortSummary.split(". ")[0].replace(/\.$/, "") + ".",
    evidenceIds: [
      ...new Set(analysis.evidenceReferences.map((ref) => ref.sourceId)),
    ],
    recommendation: analysis.recommendedNextStep,
    confidence:
      analysis.confidence === "high"
        ? "High confidence"
        : analysis.confidence === "medium"
          ? "Medium confidence"
          : "Needs evidence",
    priority: insufficient ? "needs-evidence" : base.priority,
    status: insufficient ? "insufficient" : base.status,
    missing: insufficient ? "Independent corroboration" : undefined,
    recordedDetection: { analysis, reliability },
    analysisRecordId: record.caseId,
  };
}
const labels: Record<string, [EvidenceKind, string]> = {
  "bh-log": ["log", "Daily log"],
  "bh-photos": ["photo", "4 photos"],
  "bh-report": ["report", "Geotech report"],
  "hy-log": ["log", "Daily log"],
  "hy-notes": ["notes", "Meeting notes"],
  "hy-email": ["email", "Email confirmation"],
  "mg-drawing": ["drawing", "Drawing Rev F"],
  "mg-order": ["order", "Purchase order"],
};
export const additionalProjectEvidence: EvidenceItem[] =
  additionalProjectSources.map((source) => {
    const [kind, label] = labels[source.id];
    const record = additionalProjectRecords.find(
      (record) => record.caseId === source.projectId,
    )!;
    const analysis = record.validation.valid
      ? validateDetection(
          record.output,
          additionalProjectSources.filter(
            (s) => s.projectId === source.projectId,
          ),
        )
      : null;
    return {
      id: source.id,
      eventId: eventIds[source.projectId],
      kind,
      label,
      title: source.title,
      time: new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/New_York",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(source.recordedAt)),
      date: "Sept 28, 2026",
      summary:
        analysis?.evidenceReferences.find((ref) => ref.sourceId === source.id)
          ?.explanation || "Project source record",
      content: sourceText(source),
      author: source.author,
      system: source.system,
    };
  });
