import { z } from 'zod'

export const createTaskSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  status: z.enum(['BACKLOG', 'IN_PROGRESS', 'REVIEW', 'BLOCKED', 'COMPLETE', 'ARCHIVED']).default('BACKLOG'),
  reviewStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED']).default('DRAFT'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  estimateHours: z.number().min(0.25),
  dueDate: z.string().datetime(),
  projectId: z.string().cuid(),
  assigneeIds: z.array(z.string().cuid()).default([]),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = createTaskSchema.partial()

export const submitForReviewSchema = z.object({
  reviewerId: z.string().cuid().optional(),
  notes: z.string().optional(),
})

export const reviewActionSchema = z.object({
  action: z.enum(['APPROVE', 'REQUEST_CHANGES']),
  notes: z.string().optional(),
})
