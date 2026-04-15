// ═══════════════════════════════════════════════════════
// types.ts — Single source of truth for every entity shape
// Both Cursor (backend) and Lovable (frontend) MUST respect these.
// ═══════════════════════════════════════════════════════

// ─── Enums ────────────────────────────────────────────

export type FlowType = "HAPPY_FLOW" | "UNHAPPY_FLOW";
export type EventStatus = "DRAFT" | "READY" | "APPROVED";
export type BehavioralEventType =
  | "page_view" | "click" | "submit" | "field_change"
  | "error_message_view" | "error_message" | "error"
  | "tooltip_view" | "tooltip" | "popup_view" | "popup"
  | "toast" | "experiment_trigger";
export type ApplicationEventType = "API_TRIGGERED" | "OFFLINE_PROCESS";
export type CommunicationStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "DEPRECATED" | "READY_FOR_BRAZE";
export type CommunicationType = "PROMOTIONAL" | "TRANSACTIONAL" | "OPERATIONAL";
export type ContentApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";
export type TicketType = "LEGAL_SIGNOFF" | "LOCALIZATION";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "DONE";
export type AuditAction = "CREATE" | "UPDATE" | "DELETE";
export type AuditEntityType =
  | "JOURNEY" | "STEP" | "COMMUNICATION" | "BEHAVIORAL_EVENT"
  | "APPLICATION_EVENT" | "COMMUNICATION_POINT" | "PREFERENCE_CATEGORY";
export type DependencyType = "MUST_PRECEDE" | "MUTUALLY_EXCLUSIVE" | "TRIGGERS";
export type BrazeAvailability = "AVAILABLE" | "NOT_AVAILABLE" | "REGION_SPECIFIC";
export type ChannelType = "INTERNAL" | "EXTERNAL";
export type UserRole = "ADMIN" | "MANAGER" | "PRODUCT_MANAGER" | "ANALYST" | "CONTENT_WRITER";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type NotificationType = "APPROVAL_REQUEST" | "APPROVAL_GRANTED" | "APPROVAL_REJECTED" | "SYSTEM" | "INFO";
export type StepKind = "ACTION" | "SYSTEM_TRIGGER" | "COMMUNICATION" | "STATE" | "DECISION" | "WAIT_DELAY" | "AB_SPLIT";

// ─── Auth ─────────────────────────────────────────────

export interface SessionUser {
  id: string;
  name?: string | null;
  email: string;
  role: UserRole;
}

// ─── Core Entities ────────────────────────────────────

export interface Domain {
  id: string;
  name: string;
  description?: string | null;
  tags: string[];
  eventsManuallyConfirmed: boolean;
  generationContext?: Record<string, unknown> | null;
  selectedServiceId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Flow {
  id: string;
  domainId: string;
  name: string;
  flowType: FlowType;
  fileUrl?: string | null;
  figmaLink?: string | null;
  createdAt: string;
}

export interface BehavioralEvent {
  id: string;
  domainId: string;
  eventName: string;
  eventType: BehavioralEventType;
  description?: string | null;
  status: EventStatus;
  userProperties?: string[] | null;
  eventProperties: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEvent {
  id: string;
  domainId: string;
  eventName: string;
  eventType: ApplicationEventType;
  description?: string | null;
  status: EventStatus;
  handshakeContext: Record<string, unknown>;
  businessRationale?: Record<string, unknown> | null;
  producerMetadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Journey {
  id: string;
  domainId: string;
  name: string;
  description?: string | null;
  audience?: string | null;
  objective?: string | null;
  coverImage?: string | null;
  status: string;
  platform: string;
  tags: string[];
  entryCriteria?: Record<string, unknown> | null;
  exitCriteria?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  steps?: JourneyStep[];
  edges?: JourneyEdge[];
}

export interface JourneyStep {
  id: string;
  domainId: string;
  journeyId?: string | null;
  flowIndex: number;
  order: number;
  name: string;
  description?: string | null;
  kind: StepKind;
  posX: number;
  posY: number;
  imageUrl?: string | null;
  conditionConfig?: Record<string, unknown> | null;
  waitDuration?: string | null;
  splitVariants?: { name: string; percentage: number }[] | null;
  triggerEvent?: string | null;
  createdAt: string;
  updatedAt: string;
  behavioralEvents?: { behavioralEvent: BehavioralEvent }[];
  applicationEvents?: { applicationEvent: ApplicationEvent }[];
  communicationPoints?: CommunicationPoint[];
}

export interface JourneyEdge {
  id: string;
  journeyId: string;
  sourceStepId: string;
  targetStepId: string;
  label?: string | null;
  condition?: Record<string, unknown> | null;
  sortOrder: number;
  createdAt: string;
  sourceStep?: { id: string; name: string };
  targetStep?: { id: string; name: string };
}

export interface CommunicationPoint {
  id: string;
  domainId: string;
  journeyStepId?: string | null;
  name: string;
  triggerEvent?: string | null;
  conditions?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Communication {
  id: string;
  domainId: string;
  communicationPointId?: string | null;
  templateId?: string | null;
  name: string;
  channel?: string | null;
  communicationType?: CommunicationType | null;
  category?: string | null;
  preferenceGroup?: string | null;
  preferenceCategories: string[];
  contentOutline?: Record<string, unknown> | null;
  description?: string | null;
  tags: string[];
  owner?: string | null;
  status: CommunicationStatus;
  contentApprovalStatus?: ContentApprovalStatus | null;
  contentApprovedBy?: string | null;
  contentApprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  domainId: string;
  communicationId: string;
  type: TicketType;
  status: TicketStatus;
  jiraKey?: string | null;
  jiraUrl?: string | null;
  assignee?: string | null;
  summary?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  brazeAvailability: BrazeAvailability;
  regionAvailability: string[];
  useCase?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  domainId: string;
  entityType: AuditEntityType;
  entityId: string;
  action: AuditAction;
  userId?: string | null;
  userName?: string | null;
  changes?: Record<string, unknown> | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  domainId: string;
  entityType: string;
  entityId: string;
  userId?: string | null;
  userName?: string | null;
  text: string;
  parentId?: string | null;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface ApprovalRequest {
  id: string;
  domainId: string;
  requesterId: string;
  reviewerId?: string | null;
  type: string;
  status: ApprovalStatus;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; name?: string | null; email: string };
  reviewer?: { id: string; name?: string | null; email: string } | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface PreferenceCategory {
  id: string;
  domainId: string;
  name: string;
  description?: string | null;
  canOptOut: boolean;
  mandatory: boolean;
  displayOrder: number;
  icon?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationDependency {
  id: string;
  domainId: string;
  fromCommunicationId: string;
  toCommunicationId: string;
  type: DependencyType;
  createdAt: string;
  fromCommunication?: { id: string; name: string; channel?: string | null; status: CommunicationStatus };
  toCommunication?: { id: string; name: string; channel?: string | null; status: CommunicationStatus };
}

// ─── Shared API Shapes ────────────────────────────────

export interface ApiError {
  error: string;
  fieldErrors?: Record<string, string[]>;
}

export interface SearchResults {
  communications: { id: string; name: string; channel?: string | null; type: "communication" }[];
  journeys: { id: string; name: string; type: "journey" }[];
  steps: { id: string; name: string; kind: string; journeyId?: string | null; type: "step" }[];
  behavioralEvents: { id: string; eventName: string; type: "behavioral_event" }[];
  applicationEvents: { id: string; eventName: string; type: "application_event" }[];
}
