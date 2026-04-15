import { z } from "zod";

export const createFlowSchema = z.object({
  name: z.string().min(1).max(200),
  flowType: z.enum(["HAPPY_FLOW", "UNHAPPY_FLOW"]),
  fileUrl: z.string().optional().nullable(),
  figmaLink: z.string().max(500).optional().nullable(),
});

export const updateFlowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  flowType: z.enum(["HAPPY_FLOW", "UNHAPPY_FLOW"]).optional(),
});

export type CreateFlowInput = z.infer<typeof createFlowSchema>;
export type UpdateFlowInput = z.infer<typeof updateFlowSchema>;
