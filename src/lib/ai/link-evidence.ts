import type { NormalizedSource } from "../sources/normalize";
import {
  detectionSchema,
  type Detection,
  type EvidenceReference,
} from "./schemas";

export function resolveReference(
  reference: EvidenceReference,
  sources: NormalizedSource[],
  projectId: string,
) {
  const source = sources.find((source) => source.id === reference.sourceId);
  if (!source || source.projectId !== projectId)
    throw new Error(
      `Unresolved or cross-project source: ${reference.sourceId}`,
    );
  if (source.sourceType !== reference.sourceType)
    throw new Error(`Source type mismatch: ${source.id}`);
  const text = Object.hasOwn(source.fields, reference.fieldPath)
    ? source.fields[reference.fieldPath]
    : undefined;
  if (!text || !text.includes(reference.excerpt))
    throw new Error(
      `Excerpt is not an exact substring of ${source.id}:${reference.fieldPath}`,
    );
  return {
    ...reference,
    sourceTitle: source.title,
    sourceSystem: source.system,
  };
}

export function validateDetection(
  input: unknown,
  sources: NormalizedSource[],
): Detection {
  const result = detectionSchema.parse(input);
  if (
    !sources.length ||
    sources.some((source) => source.projectId !== result.projectId)
  )
    throw new Error("Analysis project does not match all supplied records");
  result.evidenceReferences.forEach((reference) =>
    resolveReference(reference, sources, result.projectId),
  );
  if (result.possibleChange && !result.evidenceReferences.length)
    throw new Error("A flagged change must cite evidence");
  if (result.relevantContract) {
    const { reference, clauseId, trigger } = result.relevantContract;
    resolveReference(reference, sources, result.projectId);
    if (
      reference.sourceType !== "contract" ||
      reference.supports !== "contract_terms"
    )
      throw new Error("Contract retrieval must cite contract evidence");
    const contract = sources.find(
      (source) => source.id === reference.sourceId,
    )!;
    const prefix = reference.fieldPath.replace(/\.text$/, "");
    if (
      !reference.fieldPath.endsWith(".text") ||
      contract.fields[`${prefix}.id`] !== clauseId
    )
      throw new Error("Clause ID and cited contract field do not match");
    if (trigger) {
      const source = sources.find((source) => source.id === trigger.sourceId);
      if (
        !source ||
        !result.evidenceReferences.some(
          (ref) => ref.sourceId === trigger.sourceId,
        )
      )
        throw new Error("Trigger must reference linked evidence");
      if (
        !["receivedAt", "respondedAt", "recordedAt", "uploadedAt"].includes(
          trigger.fieldPath,
        )
      )
        throw new Error(
          "Trigger must reference an authoritative record timestamp",
        );
      const value =
        trigger.fieldPath === "recordedAt"
          ? source.recordedAt
          : source.fields[trigger.fieldPath];
      if (!value) throw new Error("Trigger timestamp is missing");
    }
  }
  return result;
}
