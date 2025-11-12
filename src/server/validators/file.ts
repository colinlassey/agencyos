import { z } from 'zod'

export const fileSignRequestSchema = z.object({
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  filename: z.string().min(1),
  mime: z.string().min(3),
  size: z.number().int().positive(),
})

export const fileQuerySchema = z.object({
  clientId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
})

export type FileSignRequestInput = z.infer<typeof fileSignRequestSchema>
export type FileQueryInput = z.infer<typeof fileQuerySchema>
