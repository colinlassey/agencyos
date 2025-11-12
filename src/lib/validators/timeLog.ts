import { z } from 'zod'

export const createTimeLogSchema = z.object({
  projectId: z.string().cuid(),
  taskId: z.string().cuid().optional(),
  minutes: z.number().min(15),
  entryDate: z.string().datetime(),
})

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>
