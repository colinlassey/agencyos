import { z } from 'zod'

const statusEnum = z.enum(['TODO', 'DOING', 'REVIEW', 'DONE', 'BLOCKED'])
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const createTaskSchema = z.object({
  title: z.string().min(2),
  projectId: z.string().cuid(),
  status: statusEnum.default('TODO'),
  priority: priorityEnum.default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  estimateHrs: z.number().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  description: z.string().max(10000).optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
})

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.coerce.date().optional(),
  estimateHrs: z.number().min(0).optional(),
  orderIndex: z.number().int().min(0).optional(),
  description: z.string().max(10000).optional(),
  assigneeIds: z.array(z.string().cuid()).optional(),
  isDeleted: z.boolean().optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const submitForReviewSchema = z.object({
  taskId: z.string().min(1),
  reviewerId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
})

export const reviewDecisionSchema = z.object({
  status: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
  notes: z.string().max(2000).optional(),
})
