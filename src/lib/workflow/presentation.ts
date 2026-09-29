import type { ChangeEvent, CostItem, EvidenceItem } from "../types";
import type { NormalizedSource } from "../sources/normalize";
import { sourceText } from "../sources/normalize";
import { strawberryWorkflow, cloverWorkflow } from "./replay";
import {
  strawberrySources,
  cloverSources,
  projectTimezone,
  projectPricing,
} from "../sources/records";
import { moneyFromCents } from "../calculations/cost";
import type { WorkflowResult } from "./derive";

export const strawberryEventId = "strawberry-fields-transformer-relocation";
export const cloverEventId = "clover-court-conduit-reroute";
const sourceKinds = {
  daily_log: "log",
  email: "email",
  rfi: "rfi",
  drawing: "drawing",
  contract: "report",
} as const;
const sourceLabels = {
  daily_log: "Daily log",
  email: "Utility email",
  rfi: "RFI-042",
  drawing: "Drawing Rev C",
  contract: "Contract §12.4",
};

function presentationEvent(
  id: string,
  workflow: WorkflowResult,
  sources: NormalizedSource[],
): ChangeEvent {
  const { analysis, cost, deadline } = workflow;
  const contract = analysis.relevantContract;
  const contractSource = sources.find(
    (source) => source.id === contract?.reference.sourceId,
  );
  const prefix = contract?.reference.fieldPath.replace(/\.text$/, "");
  const costs: CostItem[] = [];
  if (cost) {
    for (const group of [...new Set(cost.lines.map((line) => line.group))]) {
      const lines = cost.lines.filter((line) => line.group === group);
      costs.push({
        label: group,
        amount: lines.reduce((sum, line) => sum + line.amountCents, 0) / 100,
        detail: lines.map((line) => line.formula).join(" + "),
      });
    }
    costs.push({
      label: "Contract markup",
      amount: cost.markupCents / 100,
      detail: `${cost.markupBasisPoints / 100}% × ${moneyFromCents(cost.markupBaseCents)} eligible costs; excludes $60 fee`,
    });
  }
  // Clover's field allowance remains a raw, explicitly unverified record, not AI cost math.
  const rawAllowance =
    Number(
      sources.find((source) => source.sourceType === "daily_log")?.fields
        .fieldAllowanceCents || 0,
    ) / 100;
  if (!cost && rawAllowance)
    costs.push({
      label: "Unverified field allowance",
      amount: rawAllowance,
      detail: "Daily report allowance; quantities and rates not substantiated",
    });
  return {
    id,
    projectId: analysis.projectId,
    title: analysis.title,
    priority: workflow.draftEligible ? "high" : "needs-evidence",
    exposure: cost ? cost.totalCents / 100 : rawAllowance,
    description:
      analysis.shortSummary
        .split(". ")
        .slice(0, 1)
        .join(". ")
        .replace(/\.$/, "") + ".",
    summary: analysis.shortSummary,
    noticeHours: deadline?.hoursRemaining,
    status: workflow.draftEligible ? "review" : "insufficient",
    confidence:
      analysis.confidence === "high"
        ? "High confidence"
        : workflow.draftEligible
          ? "Medium confidence"
          : "Needs evidence",
    evidenceIds: [
      ...new Set(
        analysis.evidenceReferences.map((reference) => reference.sourceId),
      ),
    ],
    missing: workflow.draftEligible ? undefined : "Direction / responsibility",
    contract:
      contract && contractSource && deadline
        ? {
            clause: `§${contract.clauseId}`,
            title: contractSource.fields[`${prefix}.title`],
            noticeRequired: true,
            deadline: deadline.deadlineLabel,
            excerpt: contractSource.fields[`${prefix}.text`],
          }
        : undefined,
    costs,
    recommendation: analysis.recommendedNextStep,
    workflow,
    analysisRecordId: `${analysis.projectId}-detection`,
  };
}
export const strawberryEvent = presentationEvent(
  strawberryEventId,
  strawberryWorkflow,
  strawberrySources,
);
export const cloverEvent = presentationEvent(
  cloverEventId,
  cloverWorkflow,
  cloverSources,
);

const pricingWorksheet = [
  projectPricing.scheduleReference,
  `Prepared by ${projectPricing.preparedBy}`,
  projectPricing.estimateBasis,
  ...strawberryWorkflow.cost!.lines.map(
    (line) =>
      `${line.label}\n${line.formula} = ${moneyFromCents(line.amountCents)}\nQuantity basis: ${line.basis}\nSource: ${line.sourceId === "sf-log" ? "Marcus Reed’s daily log, Sept 28" : "PM estimating worksheet, Sept 29"}\n${line.markupEligible ? "Contract markup applies" : "Pass-through fee; excluded from markup"}`,
  ),
  `Direct cost: ${moneyFromCents(strawberryWorkflow.cost!.directCostCents)}`,
  `Contract §${projectPricing.markup.clauseId}: ${projectPricing.markup.basisPoints / 100}% × ${moneyFromCents(strawberryWorkflow.cost!.markupBaseCents)} = ${moneyFromCents(strawberryWorkflow.cost!.markupCents)}. ${projectPricing.markup.basis}`,
  `Preliminary total: ${moneyFromCents(strawberryWorkflow.cost!.totalCents)}`,
].join("\n\n");

function evidenceFromSource(
  source: NormalizedSource,
  workflow: WorkflowResult,
  eventId: string,
): EvidenceItem {
  const reference = workflow.analysis.evidenceReferences.find(
    (reference) => reference.sourceId === source.id,
  );
  return {
    id: source.id,
    eventId,
    kind: sourceKinds[source.sourceType],
    label: sourceLabels[source.sourceType],
    title: source.title,
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: projectTimezone,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(source.recordedAt)),
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: projectTimezone,
      month: "short",
      day: "numeric",
      year: "numeric",
    })
      .format(new Date(source.recordedAt))
      .replace("Sep ", "Sept "),
    summary: reference?.explanation || "Executed contract excerpt",
    content: sourceText(source),
    author: source.author,
    system: source.system,
  };
}
export const derivedEvidence = [
  ...strawberrySources.map((source) =>
    evidenceFromSource(source, strawberryWorkflow, strawberryEventId),
  ),
  ...cloverSources.map((source) =>
    evidenceFromSource(source, cloverWorkflow, cloverEventId),
  ),
  {
    id: projectPricing.id,
    eventId: strawberryEventId,
    kind: "report" as const,
    label: "Rate schedule & quantities",
    title: projectPricing.scheduleReference,
    time: "09:00",
    date: "Sept 29, 2026",
    summary: projectPricing.estimateBasis,
    content: pricingWorksheet,
    author: projectPricing.preparedBy,
    system: "Project estimating worksheet",
  },
];
