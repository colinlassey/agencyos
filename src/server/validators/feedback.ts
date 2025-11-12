import { z } from 'zod'

export const createFeedbackSchema = z.object({
  targetType: z.enum(['CLIENT', 'PROJECT', 'TASK']),
  targetId: z.string().cuid(),
  content: z.string().min(1).max(5000),
  isClientVisible: z.boolean().default(false),
})

export const feedbackSearchSchema = z.object({
  targetType: z.enum(['CLIENT', 'PROJECT', 'TASK']),
  targetId: z.string(),
  includeHidden: z.boolean().optional(),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>
export type FeedbackSearchInput = z.infer<typeof feedbackSearchSchema>
