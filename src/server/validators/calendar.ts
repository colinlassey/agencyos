import { z } from 'zod'

export const calendarPushSchema = z.object({
  projectId: z.string().cuid(),
  dueDate: z.coerce.date(),
  title: z.string().min(1),
})

export type CalendarPushInput = z.infer<typeof calendarPushSchema>
