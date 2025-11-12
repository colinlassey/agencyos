import { z } from 'zod'

export const feedbackSchema = z.object({
  targetType: z.enum(['PROJECT', 'TASK']),
  targetId: z.string().cuid(),
  content: z.string().min(2),
  visibleToClient: z.boolean().default(false),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>
