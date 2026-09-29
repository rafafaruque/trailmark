export interface ApprovalInput {
  reviewerRole: "project_manager" | "superintendent" | "viewer";
  eventStatus: string | undefined;
  noticeEligible: boolean;
  draftEligible: boolean;
  uncertaintyAcknowledged: boolean;
  humanConfirmed: boolean;
  recipient: string;
  body: string;
}

/** Local review policy only, not an authentication boundary. There is no delivery adapter. */
export function authorizeApproval(input: ApprovalInput) {
  if (input.reviewerRole !== "project_manager")
    throw new Error("Only a project manager can approve a notice");
  if (!input.draftEligible)
    throw new Error(
      "Evidence, contract, deadline and cost prerequisites are required",
    );
  if (!input.noticeEligible && !input.uncertaintyAcknowledged)
    throw new Error(
      "The PM must review the unresolved scope, authority and trigger assumptions",
    );
  if (input.eventStatus === "dismissed")
    throw new Error("Reopen this event before approving a notice");
  if (!input.humanConfirmed)
    throw new Error("The PM must explicitly confirm review");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.recipient) || !input.body.trim())
    throw new Error("A recipient and notice body are required");
  return { status: "approved" as const, delivery: "not_connected" as const };
}
