import type { NormalizedSource } from "../sources/normalize";
import { validateDetection } from "../ai/link-evidence";
import {
  calculateCosts,
  pricingSchema,
  type CostCalculation,
} from "../calculations/cost";
import {
  calculateDeadline,
  type DeadlineCalculation,
} from "../calculations/deadline";
import type { Detection } from "../ai/schemas";
import { assessReliability } from "./reliability";

export interface WorkflowResult {
  analysis: Detection;
  deadline: DeadlineCalculation | null;
  cost: CostCalculation | null;
  draftEligible: boolean;
  noticeEligible: boolean;
  blockers: string[];
  reviewQuestions: string[];
  reliability: ReturnType<typeof assessReliability>;
}

export function deriveWorkflow(
  input: unknown,
  sources: NormalizedSource[],
  pricingInput: unknown | null,
  asOf: string,
  timezone: string,
): WorkflowResult {
  const analysis = validateDetection(input, sources);
  const blockers: string[] = [];
  const reliability = assessReliability(analysis, sources);
  if (reliability.disposition !== "pm_review")
    blockers.push(...reliability.reasons);
  const reviewQuestions = [...analysis.missingEvidence];
  if (!analysis.possibleChange) blockers.push("No potential change identified");
  if (analysis.confidence === "low")
    blockers.push("Evidence requires further field clarification");
  const supports = new Set(
    analysis.evidenceReferences.map((ref) => ref.supports),
  );
  if (new Set(analysis.evidenceReferences.map((ref) => ref.sourceId)).size < 2)
    blockers.push("An independent corroborating source is required");
  if (!supports.has("additional_work"))
    blockers.push("Additional field work is not established");
  if (!supports.has("direction"))
    blockers.push("Written direction has not been established");
  if (
    [
      "planned_work",
      "contractor_rework",
      "potential_credit",
      "ambiguous",
    ].includes(analysis.eventType)
  )
    blockers.push(
      "This event type is not eligible for a change notice in this workflow",
    );
  let deadline: DeadlineCalculation | null = null;
  const retrieval = analysis.relevantContract;
  if (retrieval?.trigger) {
    const contract = sources.find(
      (source) => source.id === retrieval.reference.sourceId,
    )!;
    const prefix = retrieval.reference.fieldPath.replace(/\.text$/, "");
    const period = Number(contract.fields[`${prefix}.noticePeriodHours`]);
    const clock = contract.fields[`${prefix}.clock`];
    if (clock !== "elapsed_hours")
      throw new Error(
        "Unsupported notice clock; manual contract review required",
      );
    const triggerSource = sources.find(
      (source) => source.id === retrieval.trigger!.sourceId,
    )!;
    const triggerTime =
      retrieval.trigger.fieldPath === "recordedAt"
        ? triggerSource.recordedAt
        : triggerSource.fields[retrieval.trigger.fieldPath];
    deadline = calculateDeadline(triggerTime, period, timezone, asOf);
  } else
    blockers.push(
      "A relevant clause and a documented trigger timestamp are required",
    );
  let cost: CostCalculation | null = null;
  if (pricingInput) {
    const pricing = pricingSchema.parse(pricingInput);
    if (pricing.projectId !== analysis.projectId)
      throw new Error("Pricing belongs to another project");
    const contract = sources.find(
      (source) =>
        source.id === pricing.markup.sourceId &&
        source.sourceType === "contract",
    );
    const markupField = Object.entries(contract?.fields || {})
      .find(
        ([field, value]) =>
          field.endsWith(".id") && value === pricing.markup.clauseId,
      )?.[0]
      .replace(/\.id$/, ".markupBasisPoints");
    if (
      !contract ||
      !markupField ||
      Number(contract.fields[markupField]) !== pricing.markup.basisPoints
    )
      throw new Error("Markup must match the configured contract terms");
    for (const quantity of pricing.quantities) {
      if (quantity.sourceId === pricing.id) continue; // Explicit PM-estimated quantities live in the pricing worksheet.
      const source = sources.find((source) => source.id === quantity.sourceId);
      if (
        !source ||
        Number(source.fields[quantity.sourceField]) * 1000 !==
          quantity.quantityMilli
      )
        throw new Error(`Quantity does not match source: ${quantity.id}`);
    }
    cost = calculateCosts(pricing);
  } else
    blockers.push(
      "A verified rate schedule and quantity worksheet are required",
    );
  // Preparing a provisional notice is distinct from approving it. Unresolved scope/authority
  // remains visible for the PM; it must never become fabricated certainty or entitlement.
  const draftEligible = blockers.length === 0 && !!deadline && !!cost;
  return {
    analysis,
    reliability,
    deadline,
    cost,
    blockers: [...new Set(blockers)],
    reviewQuestions,
    draftEligible,
    noticeEligible:
      draftEligible &&
      !reviewQuestions.length &&
      analysis.confidence === "high",
  };
}
