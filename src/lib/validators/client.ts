import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(2),
  stage: z.enum(['LEAD', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'ARCHIVED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  primaryContact: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

export const updateClientSchema = createClientSchema.partial()
