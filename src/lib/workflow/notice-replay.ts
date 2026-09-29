import noticeRecord from "../../../data/recordings/strawberry-fields-notice.json";
import revalidation from "../../../data/recordings/strawberry-fields-notice.validation.json";
import { validateNoticeNarrative, renderNotice } from "../ai/draft-notice";
import { strawberryWorkflow } from "./replay";
import { strawberrySources } from "../sources/records";
import type { DraftNotice } from "../types";
import { strawberryEventId } from "./presentation";

if (
  noticeRecord.error ||
  noticeRecord.toolCalls ||
  !revalidation.validation.valid
)
  throw new Error("The saved notice cannot be replayed");
const narrative = validateNoticeNarrative(
  noticeRecord.output,
  strawberryWorkflow,
  strawberrySources,
);
const contract = strawberrySources.find(
  (source) => source.sourceType === "contract",
)!;
export const strawberryNotice: DraftNotice = {
  eventId: strawberryEventId,
  recipient: contract.fields["recipient.name"],
  recipientRole: contract.fields["recipient.role"],
  email: contract.fields["recipient.email"],
  subject: `Notice of potential change — ${strawberryWorkflow.analysis.title}`,
  body: renderNotice(narrative, strawberryWorkflow, strawberrySources),
};
export { noticeRecord, revalidation };
