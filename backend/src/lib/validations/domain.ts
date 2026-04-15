import { z } from "zod";

export const createDomainSchema = z.object({
  name: z.string().min(1, "Domain name is required").max(100),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).optional(),
});

export const updateDomainSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  eventsManuallyConfirmed: z.boolean().optional(),
  selectedServiceId: z.string().nullable().optional(),
  generationContext: z.any().optional(),
});

export type CreateDomainInput = z.infer<typeof createDomainSchema>;
export type UpdateDomainInput = z.infer<typeof updateDomainSchema>;
