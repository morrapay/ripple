// ═══════════════════════════════════════════════════════
// events.schema.ts — Zod validation schemas for events
// Used by backend for request validation and by frontend
// for form validation. Single source of truth.
// ═══════════════════════════════════════════════════════

import { z } from "zod";

// ─── Behavioral Event Schemas ─────────────────────────

export const behavioralEventTypeSchema = z.enum([
  "page_view", "click", "submit", "field_change",
  "error_message_view", "error_message", "error",
  "tooltip_view", "tooltip", "popup_view", "popup",
  "toast", "experiment_trigger",
]);

export const eventStatusSchema = z.enum(["DRAFT", "READY", "APPROVED"]);

export const createBehavioralEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required").max(200),
  eventType: behavioralEventTypeSchema,
  description: z.string().max(500).optional(),
  userProperties: z.array(z.string()).optional(),
  eventProperties: z.array(z.string()).min(1, "At least one event property is required"),
});

export const updateBehavioralEventSchema = z.object({
  eventName: z.string().min(1).max(200).optional(),
  eventType: behavioralEventTypeSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  status: eventStatusSchema.optional(),
  userProperties: z.array(z.string()).nullable().optional(),
  eventProperties: z.array(z.string()).min(1).optional(),
});

export type CreateBehavioralEventInput = z.infer<typeof createBehavioralEventSchema>;
export type UpdateBehavioralEventInput = z.infer<typeof updateBehavioralEventSchema>;

// ─── Application Event Schemas ────────────────────────

export const applicationEventTypeSchema = z.enum(["API_TRIGGERED", "OFFLINE_PROCESS"]);

export const createApplicationEventSchema = z.object({
  eventName: z.string().min(1, "Event name is required").max(200),
  eventType: applicationEventTypeSchema,
  description: z.string().max(500).optional(),
  handshakeContext: z.record(z.unknown()).default({}),
  businessRationale: z.record(z.unknown()).optional(),
  producerMetadata: z.record(z.unknown()).optional(),
});

export const updateApplicationEventSchema = z.object({
  eventName: z.string().min(1).max(200).optional(),
  eventType: applicationEventTypeSchema.optional(),
  description: z.string().max(500).nullable().optional(),
  status: eventStatusSchema.optional(),
  handshakeContext: z.record(z.unknown()).optional(),
  businessRationale: z.record(z.unknown()).nullable().optional(),
  producerMetadata: z.record(z.unknown()).nullable().optional(),
});

export type CreateApplicationEventInput = z.infer<typeof createApplicationEventSchema>;
export type UpdateApplicationEventInput = z.infer<typeof updateApplicationEventSchema>;

// ─── Flow Schemas ─────────────────────────────────────

export const flowTypeSchema = z.enum(["HAPPY_FLOW", "UNHAPPY_FLOW"]);

export const createFlowSchema = z.object({
  name: z.string().min(1, "Flow name is required").max(200),
  flowType: flowTypeSchema,
  fileUrl: z.string().nullable().optional(),
  figmaLink: z.string().nullable().optional(),
});

export type CreateFlowInput = z.infer<typeof createFlowSchema>;

// ─── Domain Schemas ───────────────────────────────────

export const createDomainSchema = z.object({
  name: z.string().min(1, "Domain name is required").max(200),
  description: z.string().max(1000).optional(),
  selectedServiceId: z.string().optional(),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;

// ─── Journey Step Schemas ─────────────────────────────

export const stepKindSchema = z.enum([
  "ACTION", "SYSTEM_TRIGGER", "COMMUNICATION", "STATE",
  "DECISION", "WAIT_DELAY", "AB_SPLIT",
]);

export const createJourneyStepSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  kind: stepKindSchema.optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  behavioralEventId: z.string().optional(),
  applicationEventId: z.string().optional(),
  communicationPointName: z.string().optional(),
  triggerEvent: z.string().optional(),
  insertAfterOrder: z.number().optional(),
});

export const updateJourneyStepSchema = z.object({
  name: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  kind: stepKindSchema.optional(),
  order: z.number().optional(),
  posX: z.number().optional(),
  posY: z.number().optional(),
  imageUrl: z.string().optional(),
  behavioralEventId: z.string().optional(),
  applicationEventId: z.string().optional(),
  communicationPointName: z.string().optional(),
  triggerEvent: z.string().optional(),
  conditionConfig: z.record(z.unknown()).optional(),
  waitDuration: z.string().optional(),
  splitVariants: z.array(z.object({
    name: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
});

export type CreateJourneyStepInput = z.infer<typeof createJourneyStepSchema>;
export type UpdateJourneyStepInput = z.infer<typeof updateJourneyStepSchema>;

// ─── Journey Edge Schema ──────────────────────────────

export const createJourneyEdgeSchema = z.object({
  sourceStepId: z.string().min(1),
  targetStepId: z.string().min(1),
  label: z.string().nullable().optional(),
  condition: z.record(z.unknown()).optional(),
  sortOrder: z.number().optional(),
});

export type CreateJourneyEdgeInput = z.infer<typeof createJourneyEdgeSchema>;
