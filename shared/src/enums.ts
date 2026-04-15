export type FlowType = "HAPPY_FLOW" | "UNHAPPY_FLOW";

export type EventStatus = "DRAFT" | "READY" | "APPROVED";

export type BehavioralEventType =
  | "page_view"
  | "click"
  | "submit"
  | "field_change"
  | "error_message_view"
  | "error_message"
  | "error"
  | "tooltip_view"
  | "tooltip"
  | "popup_view"
  | "popup"
  | "toast"
  | "experiment_trigger";

export type ApplicationEventType = "API_TRIGGERED" | "OFFLINE_PROCESS";

export type CommunicationStatus =
  | "DRAFT"
  | "ACTIVE"
  | "PAUSED"
  | "DEPRECATED"
  | "READY_FOR_BRAZE";

export type ContentApprovalStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type TicketType = "LEGAL_SIGNOFF" | "LOCALIZATION";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "DONE";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export type AuditEntityType =
  | "JOURNEY"
  | "STEP"
  | "COMMUNICATION"
  | "BEHAVIORAL_EVENT"
  | "APPLICATION_EVENT"
  | "COMMUNICATION_POINT"
  | "PREFERENCE_CATEGORY";

export type DependencyType = "MUST_PRECEDE" | "MUTUALLY_EXCLUSIVE" | "TRIGGERS";

export type CommunicationType = "PROMOTIONAL" | "TRANSACTIONAL" | "OPERATIONAL";

export type BrazeAvailability = "AVAILABLE" | "NOT_AVAILABLE" | "REGION_SPECIFIC";

export type ChannelType = "INTERNAL" | "EXTERNAL";

export type UserRole = "ADMIN" | "MANAGER" | "PRODUCT_MANAGER" | "ANALYST" | "CONTENT_WRITER";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type NotificationType =
  | "APPROVAL_REQUEST"
  | "APPROVAL_GRANTED"
  | "APPROVAL_REJECTED"
  | "SYSTEM"
  | "INFO";
