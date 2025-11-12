import { z } from 'zod'

const stageEnum = z.enum(['DISCOVERY', 'DESIGN', 'BUILD', 'QA', 'LAUNCH', 'MAINTENANCE'])
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])

export const createProjectSchema = z.object({
  name: z.string().min(2),
  clientId: z.string().cuid(),
  stage: stageEnum,
  priority: priorityEnum,
  dueDate: z.coerce.date(),
  description: z.string().max(5000).optional(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(2).optional(),
  clientId: z.string().cuid().optional(),
  stage: stageEnum.optional(),
  priority: priorityEnum.optional(),
  dueDate: z.coerce.date().optional(),
  description: z.string().max(5000).optional(),
  isDeleted: z.boolean().optional(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
