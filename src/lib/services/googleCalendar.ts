import { google } from 'googleapis'
import { prisma } from '../../lib/prisma'

export type CalendarPushResult = {
  projectId: string
  pushed: boolean
  error?: string
}

export const googleCalendarClient = () => {
  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  })
  return google.calendar({ version: 'v3', auth })
}

export const pushProjectDueDates = async (userId: string): Promise<CalendarPushResult[]> => {
  const integration = await prisma.integrationAccount.findFirst({
    where: { provider: 'google-calendar', userId },
  })
  if (!integration) {
    return []
  }

  const events = await prisma.calendarEvent.findMany({
    where: { pushedToGoogle: false },
    include: { project: true },
  })

  const calendar = googleCalendarClient()
  const results: CalendarPushResult[] = []

  for (const event of events) {
    try {
      await calendar.events.insert({
        calendarId: integration.scope ?? 'primary',
        requestBody: {
          summary: event.title,
          start: { dateTime: event.scheduledFor.toISOString() },
          end: { dateTime: new Date(event.scheduledFor.getTime() + 60 * 60 * 1000).toISOString() },
        },
        auth: new google.auth.OAuth2({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
      })
      await prisma.calendarEvent.update({
        where: { id: event.id },
        data: { pushedToGoogle: true },
      })
      results.push({ projectId: event.projectId, pushed: true })
    } catch (error) {
      results.push({ projectId: event.projectId, pushed: false, error: (error as Error).message })
    }
  }

  return results
}
