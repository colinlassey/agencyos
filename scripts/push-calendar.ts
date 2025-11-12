#!/usr/bin/env ts-node
import 'dotenv/config'
import { pushProjectDueDates } from '../src/lib/services/googleCalendar'

const userId = process.argv[2]

if (!userId) {
  console.error('Usage: ts-node scripts/push-calendar.ts <userId>')
  process.exit(1)
}

pushProjectDueDates(userId)
  .then((results) => {
    console.log('Push results:', results)
  })
  .catch((error) => {
    console.error('Failed to push calendar events', error)
    process.exit(1)
  })
