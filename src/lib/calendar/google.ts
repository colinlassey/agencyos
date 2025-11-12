import { google } from 'googleapis'

const featureFlag = process.env.GOOGLE_CALENDAR_PUSH === 'true'

export type CalendarPushPayload = {
  projectId: string
  dueDate: Date
  title: string
}

export async function pushToGoogleCalendar(payload: CalendarPushPayload) {
  if (!featureFlag) {
    return { pushed: false, reason: 'feature-flag-disabled' }
  }

  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, '\n'),
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Missing Google service account credentials')
  }

  const jwtClient = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })

  const calendar = google.calendar({ version: 'v3', auth: jwtClient })

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID ?? 'primary',
    requestBody: {
      summary: payload.title,
      start: { dateTime: payload.dueDate.toISOString() },
      end: { dateTime: payload.dueDate.toISOString() },
      extendedProperties: {
        private: {
          projectId: payload.projectId,
        },
      },
    },
  })

  return { pushed: true, eventId: response.data.id }
}
