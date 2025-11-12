import { z } from 'zod'

export const createChannelSchema = z.object({
  type: z.enum(['GENERAL', 'DM', 'PROJECT']),
  name: z.string().min(1).optional(),
  memberIds: z.array(z.string().cuid()).min(1),
  projectId: z.string().cuid().optional(),
})

export const channelMessageSchema = z.object({
  content: z.string().min(1).max(5000),
})

export type CreateChannelInput = z.infer<typeof createChannelSchema>
export type ChannelMessageInput = z.infer<typeof channelMessageSchema>
