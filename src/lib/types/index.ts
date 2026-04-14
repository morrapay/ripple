import type { StepKind } from "@/lib/journey-constants";

export interface Domain {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
}

export interface Flow {
  id: string;
  domainId: string;
  name: string;
  flowType: "HAPPY_FLOW" | "UNHAPPY_FLOW";
  fileUrl: string | null;
  figmaLink: string | null;
  createdAt: string;
}

export interface BehavioralEvent {
  id: string;
  domainId: string;
  eventName: string;
  eventType: string;
  description: string | null;
  status: "DRAFT" | "READY" | "APPROVED";
  userProperties: Record<string, unknown> | null;
  eventProperties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationEvent {
  id: string;
  domainId: string;
  eventName: string;
  eventType: "API_TRIGGERED" | "OFFLINE_PROCESS";
  description: string | null;
  status: "DRAFT" | "READY" | "APPROVED";
  handshakeContext: Record<string, unknown>;
  businessRationale: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Journey {
  id: string;
  domainId: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  platform: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JourneyStep {
  id: string;
  domainId: string;
  journeyId: string | null;
  name: string;
  description: string | null;
  kind: StepKind;
  order: number;
  posX: number;
  posY: number;
  imageUrl: string | null;
  behavioralEvents: { behavioralEvent: BehavioralEvent }[];
  applicationEvents: { applicationEvent: ApplicationEvent }[];
  communicationPoints: { id: string; name: string }[];
}

export interface CommunicationPoint {
  id: string;
  domainId: string;
  journeyStepId: string | null;
  name: string;
  triggerEvent: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  status: string;
  note: string | null;
  requester: { name: string | null; email: string };
  reviewer: { name: string | null; email: string } | null;
}

export type { StepKind } from "@/lib/journey-constants";
