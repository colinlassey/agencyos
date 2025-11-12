import { z } from 'zod'

export const createTimeLogSchema = z.object({
  targetType: z.enum(['PROJECT', 'TASK']),
  targetId: z.string().min(1),
  projectId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  hours: z.number().positive(),
  date: z.coerce.date(),
})

export const timeLogQuerySchema = z.object({
  projectId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  start: z.coerce.date().optional(),
  end: z.coerce.date().optional(),
})

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>
export type TimeLogQueryInput = z.infer<typeof timeLogQuerySchema>
