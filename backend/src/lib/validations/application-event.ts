import { z } from "zod";

const applicationEventType = z.enum(["API_TRIGGERED", "OFFLINE_PROCESS"]);
const eventStatus = z.enum(["DRAFT", "READY", "APPROVED"]);

export const createApplicationEventSchema = z.object({
  eventName: z.string().min(1).max(200),
  eventType: applicationEventType,
  description: z.string().max(500).optional(),
  handshakeContext: z.record(z.unknown()).default({}),
  businessRationale: z.record(z.unknown()).optional(),
  producerMetadata: z.record(z.unknown()).optional(),
});

export const updateApplicationEventSchema = z.object({
  eventName: z.string().min(1).max(200).optional(),
  eventType: applicationEventType.optional(),
  description: z.string().max(500).optional().nullable(),
  status: eventStatus.optional(),
  handshakeContext: z.record(z.unknown()).optional(),
  businessRationale: z.record(z.unknown()).optional().nullable(),
  producerMetadata: z.record(z.unknown()).optional().nullable(),
});

export type CreateApplicationEventInput = z.infer<typeof createApplicationEventSchema>;
export type UpdateApplicationEventInput = z.infer<typeof updateApplicationEventSchema>;
