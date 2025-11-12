import { z } from 'zod'

const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i

export const createClientSchema = z.object({
  name: z.string().min(2),
  domain: z
    .string()
    .trim()
    .regex(domainRegex, 'Invalid domain')
    .optional(),
  stage: z.enum(['LEAD', 'ONBOARDING', 'ACTIVE', 'PAUSED', 'ARCHIVED']).default('LEAD'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  notes: z.string().max(5000).optional(),
})

export const updateClientSchema = createClientSchema.partial().extend({
  isDeleted: z.boolean().optional(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
