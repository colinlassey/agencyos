import { z } from 'zod'

export const createMessageSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().min(1),
})

export const createThreadSchema = z.object({
  type: z.enum(['GENERAL', 'PROJECT', 'DIRECT']),
  name: z.string().optional(),
  participantIds: z.array(z.string().cuid()).optional(),
  projectId: z.string().cuid().optional(),
})
