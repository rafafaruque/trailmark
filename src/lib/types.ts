import type { Detection } from "./ai/schemas";
import type { assessReliability } from "./workflow/reliability";
import type { WorkflowResult } from "./workflow/derive";

export type Priority = "high" | "medium" | "needs-evidence" | "low";
export type EvidenceKind =
  "log" | "email" | "rfi" | "drawing" | "photo" | "report" | "notes" | "order";

export interface Project {
  id: string;
  name: string;
  subtitle: string;
  code: string;
  color: string;
  initials: string;
  region: string;
  manager: string;
  nextDeadline?: string;
  noticeHours?: number;
  pendingExposure: number;
}

export interface EvidenceItem {
  id: string;
  eventId: string;
  kind: EvidenceKind;
  label: string;
  title: string;
  time: string;
  date: string;
  summary: string;
  content: string;
  author: string;
  system?: string;
}

export interface ContractMetadata {
  clause: string;
  title: string;
  noticeRequired: boolean;
  deadline: string;
  excerpt: string;
}

export interface CostItem {
  label: string;
  amount: number;
  detail: string;
}

export interface ChangeEvent {
  id: string;
  projectId: string;
  title: string;
  priority: Priority;
  exposure: number;
  description: string;
  summary: string;
  noticeHours?: number;
  status: "review" | "ready" | "insufficient" | "no-action";
  confidence: "High confidence" | "Medium confidence" | "Needs evidence";
  evidenceIds: string[];
  missing?: string;
  contract?: ContractMetadata;
  costs: CostItem[];
  recommendation: string;
  workflow?: WorkflowResult;
  analysisRecordId?: string;
  recordedDetection?: {
    analysis: Detection;
    reliability: ReturnType<typeof assessReliability>;
  };
}

export interface DraftNotice {
  eventId: string;
  recipient: string;
  recipientRole: string;
  email: string;
  subject: string;
  body: string;
}

export type ReviewStatus =
  "approved" | "dismissed" | "clarification-requested" | "saved";
export interface SavedEvent {
  status?: ReviewStatus;
  body?: string;
  recipient?: string;
  note?: string;
  approvedBy?: string;
  approvedAt?: string;
}
export type DemoState = Record<string, SavedEvent>;
