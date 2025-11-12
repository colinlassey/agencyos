# AgencyOS MVP Architecture

## Stack Overview
- **Frontend**: Next.js 13 (Pages Router) with React, TypeScript, Tailwind CSS, Headless UI for accessible components, React Query for data fetching, Zustand for lightweight client-side state, and Socket.IO client for realtime messaging/notifications.
- **Backend**: Next.js API routes running on Node.js, Prisma ORM on PostgreSQL, NextAuth with Auth0 provider, Socket.IO server bootstrap within Next.js API handler, AWS SDK v3 for S3 signed uploads.
- **Infrastructure**: PostgreSQL (managed), AWS S3 bucket, Vercel (frontend + API), Fly.io/Render for long-lived Socket.IO worker if required, Cron-based background worker for calendar pushes.
- **Testing**: Vitest + Supertest for API integration, Playwright component tests (future), Cucumber.js for Gherkin acceptance specs.

## Folder Layout
```
agencyos/
├── docs/
│   └── architecture.md
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── scripts/
│   └── push-calendar.ts
├── src/
│   ├── components/
│   │   ├── calendar/
│   │   ├── chat/
│   │   ├── files/
│   │   ├── heatmap/
│   │   ├── layout/
│   │   └── tasks/
│   ├── layouts/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   ├── rbac.ts
│   │   ├── socket.ts
│   │   ├── validators/
│   │   └── services/
│   │       └── googleCalendar.ts
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth].ts
│   │   │   ├── clients/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── chat/
│   │   │   ├── files/
│   │   │   ├── time-logs/
│   │   │   └── notifications/
│   │   ├── calendar/index.tsx
│   │   ├── chat/index.tsx
│   │   ├── clients/index.tsx
│   │   ├── files/index.tsx
│   │   ├── index.tsx
│   │   ├── projects/[projectId].tsx
│   │   ├── projects/index.tsx
│   │   └── team/index.tsx
│   └── stateMachines/
│       ├── reviewMachine.ts
│       └── taskMachine.ts
└── tests/
    ├── acceptance/
    └── api/
```

## Entity Relationships
- **User** (role: Admin, Developer, Client) owns time logs, messages, feedback, reviews, files, notifications. Users may belong to multiple projects via `ProjectMembership` and tasks via `TaskAssignment`.
- **Client** has many Projects, Files, Feedback (scoped), and can be soft-deleted (`deletedAt`). Enforces unique name per org.
- **Project** belongs to a Client and creator, has Tasks, Feedback, Files, TimeLogs, ChatThread (type `PROJECT`). Supports submission for review that spawns `ReviewRequest` records referencing a target (project/task). Projects track stage, priority, due date, and submission status.
- **Task** belongs to a Project, has assignments, estimate hours, due date, priority, and statuses derived from task state machine. Tasks have feedback, timelogs, and review requests for submit/approval.
- **Feedback** polymorphically attaches to Projects or Tasks via targetType + targetId, with visibility flag for clients.
- **ReviewRequest** stores review workflow with transitions defined in `reviewMachine.ts`.
- **ChatThread** (General, Project, Direct) contains ChatMessages and participants. `General` thread auto-created; Direct threads keyed by pair of users.
- **TimeLog** references project & optional task, along with minutes logged and week boundaries for reporting.
- **FileObject** references S3 metadata, associated client/project, and a soft delete flag.
- **Notification** references user and optionally entity metadata; stores read status; generated on create/update events.
- **CalendarEvent** stores internal calendar items and optional Google sync status per project milestone/due date.
- **IntegrationAccount** stores OAuth token data for Google Calendar pushes per user.

## Realtime & Notifications
- Socket.IO namespace `/notifications` handling chat, notifications, review events. Auth via NextAuth session token handshake.
- Server emits events on message creation, review status changes, assignment updates. Client components subscribe via React Query invalidation + websockets.

## Access Control
- RBAC via `rolePermissions` map. Admin can CRUD everything, Developer limited to assigned clients/projects, Client read-only except feedback visibility and review approvals. Middleware `requireRole` ensures enforcement inside API routes and UI gating.

## Accessibility & UX
- Tailwind theme with high-contrast palette, focus-visible outlines, skip links in layout. Keyboard navigable board/table via roving tabindex. Screen reader announcements for realtime events.

## Data Hygiene
- Soft deletes via `deletedAt` timestamp, filtered by default queries.
- Unique indexes for clients (name+owner), guard in API validator.
- Required fields enforced with Prisma + Zod.

## Background Jobs
- `scripts/push-calendar.ts` CLI uses stubbed Google service to push due dates to linked calendars. Cron triggered externally until background worker introduced.

