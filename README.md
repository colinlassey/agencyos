# AgencyOS

Internal platform for managing agency clients, projects, tasks, and collaboration.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local` (see below).
3. Apply database schema and seed local data:

   ```bash
   npx prisma migrate dev
   npm run prisma:seed
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

## Environment variables

The application requires the following variables:

| Key | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth JWT/session encryption |
| `AUTH0_CLIENT_ID` | Auth0 client identifier |
| `AUTH0_CLIENT_SECRET` | Auth0 client secret |
| `AUTH0_ISSUER` | Auth0 issuer domain |
| `STORAGE_BUCKET` | S3 bucket for file uploads |
| `STORAGE_REGION` | Region for the storage bucket |
| `STORAGE_ENDPOINT` | Optional custom S3 endpoint |
| `STORAGE_ACCESS_KEY` | Access key for storage provider |
| `STORAGE_SECRET_KEY` | Secret key for storage provider |
| `STORAGE_PUBLIC_URL` | Optional public base URL for files |
| `GOOGLE_CALENDAR_PUSH` | `true` to enable Google Calendar sync |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service account email for Google Calendar |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account private key (escaped) |
| `GOOGLE_CALENDAR_ID` | Target Google Calendar identifier |

## State machines

### Task status

```
TODO → DOING → REVIEW → (DONE | BLOCKED)
BLOCKED → DOING
```

### Review submission status

```
PENDING → (APPROVED | CHANGES_REQUESTED)
```

## RBAC matrix

| Permission | Admin | Developer | Client |
| --- | --- | --- | --- |
| Manage clients | ✅ | ❌ | ❌ |
| View clients | ✅ | ✅ | ✅ (own only) |
| Manage projects | ✅ | ✅ | ❌ |
| View projects | ✅ | ✅ | ✅ (own only) |
| Manage tasks | ✅ | ✅ | ❌ |
| View tasks | ✅ | ✅ | ✅ (own only) |
| Submit/decide reviews | ✅ | ✅ | ✅ (view only) |
| Log time | ✅ | ✅ | ❌ |
| View time reports | ✅ | ✅ | ❌ |
| Upload files | ✅ | ✅ | ❌ |
| View files | ✅ | ✅ | ✅ (own only) |
| Chat | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ |
| Push calendar events | ✅ | ❌ | ❌ |

## Seeding & reset scripts

The repository ships with:

- `npm run prisma:seed` &mdash; populate the database with sample data.
- `ts-node scripts/dev-reset.ts` &mdash; drop, migrate, and reseed the local database.

## Testing

Run the Vitest suite:

```bash
npm test
```
