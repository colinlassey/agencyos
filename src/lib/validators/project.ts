import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  dueDate: z.string().datetime(),
  stage: z.enum(['DISCOVERY', 'DESIGN', 'BUILD', 'QA', 'LAUNCH', 'MAINTENANCE']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  clientId: z.string().cuid(),
  assigneeIds: z.array(z.string().cuid()).default([]),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

export const updateProjectSchema = createProjectSchema.partial()
