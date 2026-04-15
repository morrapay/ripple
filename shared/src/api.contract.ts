// ═══════════════════════════════════════════════════════
// api.contract.ts — Complete API contract
// Every endpoint, method, request body, and response shape.
// Both Cursor (backend) and Lovable (frontend) MUST respect this.
// ═══════════════════════════════════════════════════════

import type {
  Journey, JourneyStep, JourneyEdge, BehavioralEvent, ApplicationEvent,
  Communication, CommunicationDependency, Flow, Ticket, Comment,
  ApprovalRequest, Notification, PreferenceCategory, AuditLog,
  SearchResults, ApiError, StepKind, EventStatus, BehavioralEventType,
  ApplicationEventType, CommunicationType, CommunicationStatus,
  ApprovalStatus, DependencyType, FlowType, AuditEntityType,
} from "./types";

// ─── Helper: wraps every endpoint definition ──────────

interface Endpoint<
  TMethod extends string,
  TPath extends string,
  TBody = void,
  TQuery = void,
  TResponse = void,
> {
  method: TMethod;
  path: TPath;
  body: TBody;
  query: TQuery;
  response: TResponse;
}

// ═══════════════════════════════════════════════════════
// JOURNEYS
// ═══════════════════════════════════════════════════════

export type ListJourneys = Endpoint<
  "GET",
  "/api/domains/:id/journeys",
  void,
  void,
  { journeys: Journey[] }
>;

export type CreateJourney = Endpoint<
  "POST",
  "/api/domains/:id/journeys",
  { name?: string; description?: string; audience?: string; objective?: string },
  void,
  { journey: Journey }
>;

export type GetJourney = Endpoint<
  "GET",
  "/api/domains/:id/journeys/:journeyId",
  void,
  void,
  { journey: Journey }
>;

export type UpdateJourney = Endpoint<
  "PATCH",
  "/api/domains/:id/journeys/:journeyId",
  {
    name?: string;
    description?: string;
    audience?: string;
    objective?: string;
    coverImage?: string;
    entryCriteria?: Record<string, unknown>;
    exitCriteria?: Record<string, unknown>;
  },
  void,
  { journey: Journey }
>;

export type DeleteJourney = Endpoint<
  "DELETE",
  "/api/domains/:id/journeys/:journeyId",
  void,
  void,
  { success: true }
>;

export type SplitJourney = Endpoint<
  "POST",
  "/api/domains/:id/journeys/:journeyId/split",
  { stepId: string },
  void,
  { originalJourneyId: string; newJourney: Journey | null }
>;

// ═══════════════════════════════════════════════════════
// JOURNEY STEPS (nested under journey)
// ═══════════════════════════════════════════════════════

export type CreateJourneyStep = Endpoint<
  "POST",
  "/api/domains/:id/journeys/:journeyId/steps",
  {
    name?: string;
    description?: string;
    kind?: StepKind;
    posX?: number;
    posY?: number;
    behavioralEventId?: string;
    applicationEventId?: string;
    communicationPointName?: string;
    triggerEvent?: string;
    insertAfterOrder?: number;
  },
  void,
  { journey: Journey | null }
>;

export type UpdateJourneyStep = Endpoint<
  "PATCH",
  "/api/domains/:id/journeys/:journeyId/steps/:stepId",
  {
    name?: string;
    description?: string;
    kind?: StepKind;
    order?: number;
    posX?: number;
    posY?: number;
    imageUrl?: string;
    behavioralEventId?: string;
    applicationEventId?: string;
    communicationPointName?: string;
    triggerEvent?: string;
    conditionConfig?: Record<string, unknown>;
    waitDuration?: string;
    splitVariants?: { name: string; percentage: number }[];
  },
  void,
  { journey: Journey | null }
>;

export type DeleteJourneyStep = Endpoint<
  "DELETE",
  "/api/domains/:id/journeys/:journeyId/steps/:stepId",
  void,
  void,
  { journey: Journey | null }
>;

// ═══════════════════════════════════════════════════════
// JOURNEY EDGES
// ═══════════════════════════════════════════════════════

export type ListJourneyEdges = Endpoint<
  "GET",
  "/api/domains/:id/journeys/:journeyId/edges",
  void,
  void,
  { edges: JourneyEdge[] }
>;

export type CreateJourneyEdge = Endpoint<
  "POST",
  "/api/domains/:id/journeys/:journeyId/edges",
  {
    sourceStepId: string;
    targetStepId: string;
    label?: string | null;
    condition?: Record<string, unknown>;
    sortOrder?: number;
  },
  void,
  { edge: JourneyEdge }
>;

export type DeleteJourneyEdge = Endpoint<
  "DELETE",
  "/api/domains/:id/journeys/:journeyId/edges",
  void,
  { edgeId: string },
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// BEHAVIORAL EVENTS
// ═══════════════════════════════════════════════════════

export type ListBehavioralEvents = Endpoint<
  "GET",
  "/api/domains/:id/behavioral-events",
  void,
  void,
  { events: BehavioralEvent[] }
>;

export type CreateBehavioralEvent = Endpoint<
  "POST",
  "/api/domains/:id/behavioral-events",
  {
    eventName: string;
    eventType: BehavioralEventType;
    description?: string;
    userProperties?: string[];
    eventProperties: string[];
  },
  void,
  { event: BehavioralEvent }
>;

export type CreateBehavioralEventsBulk = Endpoint<
  "POST",
  "/api/domains/:id/behavioral-events",
  {
    bulk: true;
    events: {
      eventName: string;
      eventType: BehavioralEventType;
      description?: string;
      userProperties?: string[];
      eventProperties: string[];
    }[];
  },
  void,
  { events: BehavioralEvent[] }
>;

export type UpdateBehavioralEvent = Endpoint<
  "PATCH",
  "/api/domains/:id/behavioral-events/:eventId",
  {
    eventName?: string;
    eventType?: BehavioralEventType;
    description?: string | null;
    status?: EventStatus;
    userProperties?: string[] | null;
    eventProperties?: string[];
  },
  void,
  { event: BehavioralEvent }
>;

export type DeleteBehavioralEvent = Endpoint<
  "DELETE",
  "/api/domains/:id/behavioral-events/:eventId",
  void,
  void,
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// APPLICATION EVENTS
// ═══════════════════════════════════════════════════════

export type ListApplicationEvents = Endpoint<
  "GET",
  "/api/domains/:id/application-events",
  void,
  void,
  { events: ApplicationEvent[] }
>;

export type CreateApplicationEvent = Endpoint<
  "POST",
  "/api/domains/:id/application-events",
  {
    eventName: string;
    eventType: ApplicationEventType;
    description?: string;
    handshakeContext?: Record<string, unknown>;
    businessRationale?: Record<string, unknown>;
    producerMetadata?: Record<string, unknown>;
  },
  void,
  { event: ApplicationEvent }
>;

export type UpdateApplicationEvent = Endpoint<
  "PATCH",
  "/api/domains/:id/application-events/:eventId",
  {
    eventName?: string;
    eventType?: ApplicationEventType;
    description?: string | null;
    status?: EventStatus;
    handshakeContext?: Record<string, unknown>;
    businessRationale?: Record<string, unknown> | null;
    producerMetadata?: Record<string, unknown> | null;
  },
  void,
  { event: ApplicationEvent }
>;

export type DeleteApplicationEvent = Endpoint<
  "DELETE",
  "/api/domains/:id/application-events/:eventId",
  void,
  void,
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// COMMUNICATIONS
// ═══════════════════════════════════════════════════════

export type ListCommunications = Endpoint<
  "GET",
  "/api/domains/:id/communications",
  void,
  {
    search?: string;
    channel?: string;
    status?: CommunicationStatus;
    tag?: string;
    sortBy?: "updatedAt" | "name" | "channel" | "status";
    sortOrder?: "asc" | "desc";
  },
  { communications: Communication[]; pendingPoints: { id: string; name: string }[] }
>;

export type CreateCommunication = Endpoint<
  "POST",
  "/api/domains/:id/communications",
  {
    name?: string;
    description?: string;
    communicationPointId?: string;
    templateId?: string;
    channel?: string;
    communicationType?: CommunicationType;
    category?: string;
    preferenceGroup?: string;
    tags?: string[];
    owner?: string;
    status?: CommunicationStatus;
  },
  void,
  { communication: Communication }
>;

export type GetCommunication = Endpoint<
  "GET",
  "/api/domains/:id/communications/:commId",
  void,
  void,
  { communication: Communication }
>;

export type UpdateCommunication = Endpoint<
  "PATCH",
  "/api/domains/:id/communications/:commId",
  {
    name?: string;
    description?: string;
    templateId?: string;
    channel?: string;
    communicationType?: CommunicationType;
    category?: string;
    preferenceGroup?: string;
    preferenceCategories?: string[];
    tags?: string[];
    owner?: string;
    status?: CommunicationStatus;
    contentOutline?: Record<string, unknown>;
  },
  void,
  { communication: Communication }
>;

export type DeleteCommunication = Endpoint<
  "DELETE",
  "/api/domains/:id/communications/:commId",
  void,
  void,
  { success: true }
>;

export type ApproveCommunication = Endpoint<
  "POST",
  "/api/domains/:id/communications/:commId/approve",
  { approvedBy?: string },
  void,
  { communication: Communication; tickets: [Ticket, Ticket] }
>;

export type RejectCommunication = Endpoint<
  "POST",
  "/api/domains/:id/communications/:commId/reject",
  void,
  void,
  { communication: Communication }
>;

export type SubmitCommunicationReview = Endpoint<
  "POST",
  "/api/domains/:id/communications/:commId/submit-review",
  void,
  void,
  { communication: Communication }
>;

export type TestSendCommunication = Endpoint<
  "POST",
  "/api/domains/:id/communications/:commId/test-send",
  { recipientEmail: string },
  void,
  { success: true; message: string; previewUrl: null }
>;

export type SuggestContent = Endpoint<
  "POST",
  "/api/domains/:id/communications/suggest-content",
  {
    channel?: string;
    communicationType?: string;
    category?: string;
    triggerEvent?: string;
    commName?: string;
  },
  void,
  { content: Record<string, unknown> }
>;

export type ListCommunicationTickets = Endpoint<
  "GET",
  "/api/domains/:id/communications/:commId/tickets",
  void,
  void,
  { tickets: Ticket[] }
>;

// ═══════════════════════════════════════════════════════
// FLOWS
// ═══════════════════════════════════════════════════════

export type ListFlows = Endpoint<
  "GET",
  "/api/domains/:id/flows",
  void,
  void,
  { flows: Flow[] }
>;

export type CreateFlow = Endpoint<
  "POST",
  "/api/domains/:id/flows",
  { name: string; flowType: FlowType; fileUrl?: string | null; figmaLink?: string | null },
  void,
  { flow: Flow }
>;

export type DeleteFlow = Endpoint<
  "DELETE",
  "/api/domains/:id/flows/:flowId",
  void,
  void,
  { success: true }
>;

export type ImportFlowsFromFigma = Endpoint<
  "POST",
  "/api/domains/:id/flows/import-from-figma",
  { figmaUrl: string },
  void,
  { flows: Flow[] }
>;

// ═══════════════════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════════════════

export type ListComments = Endpoint<
  "GET",
  "/api/domains/:id/comments",
  void,
  { entityType: string; entityId: string },
  { comments: Comment[] }
>;

export type CreateComment = Endpoint<
  "POST",
  "/api/domains/:id/comments",
  { entityType: string; entityId: string; text: string; parentId?: string | null },
  void,
  { comment: Comment }
>;

export type UpdateComment = Endpoint<
  "PATCH",
  "/api/domains/:id/comments/:commentId",
  { text?: string; resolved?: boolean },
  void,
  { comment: Comment }
>;

export type DeleteComment = Endpoint<
  "DELETE",
  "/api/domains/:id/comments/:commentId",
  void,
  void,
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// APPROVALS
// ═══════════════════════════════════════════════════════

export type ListApprovals = Endpoint<
  "GET",
  "/api/domains/:id/approvals",
  void,
  void,
  { approvals: ApprovalRequest[] }
>;

export type CreateApproval = Endpoint<
  "POST",
  "/api/domains/:id/approvals",
  { type?: string },
  void,
  { approval: ApprovalRequest }
>;

export type ReviewApproval = Endpoint<
  "PATCH",
  "/api/domains/:id/approvals/:approvalId",
  { status: "APPROVED" | "REJECTED"; note?: string },
  void,
  { approval: ApprovalRequest }
>;

// ═══════════════════════════════════════════════════════
// PREFERENCE CATEGORIES
// ═══════════════════════════════════════════════════════

export type ListPreferenceCategories = Endpoint<
  "GET",
  "/api/domains/:id/preference-categories",
  void,
  void,
  { categories: PreferenceCategory[] }
>;

export type CreatePreferenceCategory = Endpoint<
  "POST",
  "/api/domains/:id/preference-categories",
  {
    name: string;
    description?: string;
    displayOrder?: number;
    canOptOut?: boolean;
    mandatory?: boolean;
    icon?: string | null;
  },
  void,
  { category: PreferenceCategory }
>;

export type UpdatePreferenceCategory = Endpoint<
  "PATCH",
  "/api/domains/:id/preference-categories/:catId",
  {
    name?: string;
    description?: string | null;
    canOptOut?: boolean;
    mandatory?: boolean;
    icon?: string | null;
    displayOrder?: number;
  },
  void,
  { category: PreferenceCategory }
>;

export type DeletePreferenceCategory = Endpoint<
  "DELETE",
  "/api/domains/:id/preference-categories/:catId",
  void,
  void,
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// COMMUNICATION DEPENDENCIES
// ═══════════════════════════════════════════════════════

export type ListDependencies = Endpoint<
  "GET",
  "/api/domains/:id/communication-dependencies",
  void,
  void,
  { dependencies: CommunicationDependency[] }
>;

export type CreateDependency = Endpoint<
  "POST",
  "/api/domains/:id/communication-dependencies",
  { fromCommunicationId: string; toCommunicationId: string; type: DependencyType },
  void,
  { dependency: CommunicationDependency }
>;

export type DeleteDependency = Endpoint<
  "DELETE",
  "/api/domains/:id/communication-dependencies/:depId",
  void,
  void,
  { success: true }
>;

// ═══════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════

export type GlobalSearch = Endpoint<
  "GET",
  "/api/search",
  void,
  { domainId: string; q?: string },
  { results: SearchResults }
>;

// ═══════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════

export type ListNotifications = Endpoint<
  "GET",
  "/api/notifications",
  void,
  void,
  { notifications: Notification[]; unreadCount: number }
>;

export type MarkNotificationRead = Endpoint<
  "PATCH",
  "/api/notifications/:id",
  void,
  void,
  { ok: true }
>;

export type MarkAllNotificationsRead = Endpoint<
  "POST",
  "/api/notifications/mark-all-read",
  void,
  void,
  { ok: true }
>;

// ═══════════════════════════════════════════════════════
// AUDIT
// ═══════════════════════════════════════════════════════

export type ListAuditLogs = Endpoint<
  "GET",
  "/api/domains/:id/audit",
  void,
  { entityType?: AuditEntityType; entityId?: string },
  { logs: AuditLog[] }
>;
