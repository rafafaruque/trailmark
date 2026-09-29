import strawberryRecord from "../../../data/recordings/strawberry-fields-detection.json";
import cloverRecord from "../../../data/recordings/clover-court-detection.json";
import {
  strawberrySources,
  cloverSources,
  projectPricing,
  snapshotTime,
  projectTimezone,
} from "../sources/records";
import { deriveWorkflow } from "./derive";

function assertRecording(record: {
  validation: { valid: boolean };
  error: string | null;
  toolCalls: number;
}) {
  if (!record.validation.valid || record.error || record.toolCalls)
    throw new Error(
      "Recorded analysis is invalid; a handcrafted result must not substitute for a failed run",
    );
}
assertRecording(strawberryRecord);
assertRecording(cloverRecord);
export const strawberryWorkflow = deriveWorkflow(
  strawberryRecord.output,
  strawberrySources,
  projectPricing,
  snapshotTime,
  projectTimezone,
);
export const cloverWorkflow = deriveWorkflow(
  cloverRecord.output,
  cloverSources,
  null,
  snapshotTime,
  projectTimezone,
);
export const analysisRecords = {
  strawberry: strawberryRecord,
  clover: cloverRecord,
};
