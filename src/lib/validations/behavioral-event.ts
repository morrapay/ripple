import { z } from "zod";

const behavioralEventType = z.enum([
  "page_view",
  "click",
  "submit",
  "field_change",
  "error_message_view",
  "error_message",
  "error",
  "tooltip_view",
  "tooltip",
  "popup_view",
  "popup",
  "toast",
  "experiment_trigger",
]);

const eventStatus = z.enum(["DRAFT", "READY", "APPROVED"]);

export const createBehavioralEventSchema = z.object({
  eventName: z.string().min(1).max(200),
  eventType: behavioralEventType,
  description: z.string().max(500).optional(),
  userProperties: z.array(z.string()).optional(),
  eventProperties: z.array(z.string()).min(1),
});

export const updateBehavioralEventSchema = z.object({
  eventName: z.string().min(1).max(200).optional(),
  eventType: behavioralEventType.optional(),
  description: z.string().max(500).optional().nullable(),
  status: eventStatus.optional(),
  userProperties: z.array(z.string()).optional().nullable(),
  eventProperties: z.array(z.string()).optional(),
});

export type CreateBehavioralEventInput = z.infer<typeof createBehavioralEventSchema>;
export type UpdateBehavioralEventInput = z.infer<typeof updateBehavioralEventSchema>;
