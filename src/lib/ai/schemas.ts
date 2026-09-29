import { z } from "zod";
import { sourceTypeSchema, timestampSchema } from "../sources/normalize";

export const evidenceReferenceSchema = z.strictObject({
  sourceId: z.string().min(1),
  sourceType: sourceTypeSchema,
  fieldPath: z.string().min(1),
  excerpt: z.string().min(1),
  supports: z.enum([
    "direction",
    "design_change",
    "reason_for_change",
    "additional_work",
    "scope_baseline",
    "scope_reduction",
    "contract_terms",
  ]),
  explanation: z.string().min(1),
});

export const detectionSchema = z.strictObject({
  possibleChange: z.boolean(),
  title: z.string().min(1).max(100),
  eventType: z.enum([
    "owner_directed_change",
    "differing_site_condition",
    "planned_work",
    "contractor_rework",
    "ambiguous",
    "potential_credit",
  ]),
  shortSummary: z.string().min(1).max(1400),
  projectId: z.string().min(1),
  estimatedEventTime: timestampSchema.nullable(),
  responsiblePartyHypothesis: z.string().min(1),
  confidence: z.enum(["high", "medium", "low"]),
  evidenceReferences: z.array(evidenceReferenceSchema),
  missingEvidence: z.array(z.string().min(1)),
  recommendedNextStep: z.string().min(1).max(600),
  relevantContract: z
    .strictObject({
      clauseId: z.string().min(1),
      reference: evidenceReferenceSchema,
      trigger: z
        .strictObject({
          sourceId: z.string().min(1),
          fieldPath: z.string().min(1),
          explanation: z.string().min(1),
        })
        .nullable(),
    })
    .nullable(),
});

/** Amounts, dates, permission, and transport are absent from the model's notice response. */
export const noticeNarrativeSchema = z.strictObject({
  eventNarrative: z.string().min(1).max(1800),
  reservationOfRights: z.string().min(1).max(900),
  evidenceReferences: z.array(evidenceReferenceSchema).min(2),
});
export type Detection = z.infer<typeof detectionSchema>;
export type EvidenceReference = z.infer<typeof evidenceReferenceSchema>;
export type NoticeNarrative = z.infer<typeof noticeNarrativeSchema>;
