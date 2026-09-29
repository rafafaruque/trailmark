import type { ChangeEvent } from "../types";
/** Apply the frozen surfacing result to local PM review without granting delivery authority. */
export function reviewContext(event: ChangeEvent) {
  if (event.workflow) return event.workflow;
  const analysis = event.recordedDetection?.analysis;
  const reviewQuestions = analysis?.missingEvidence || [];
  const draftEligible =
    !!event.contract &&
    (!event.recordedDetection ||
      event.recordedDetection.reliability.disposition === "pm_review");
  return {
    analysis,
    reviewQuestions,
    draftEligible,
    noticeEligible:
      draftEligible &&
      (!analysis ||
        (analysis.confidence === "high" && !reviewQuestions.length)),
  };
}
