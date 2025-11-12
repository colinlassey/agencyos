import { execSync } from 'child_process'

try {
  execSync('npx prisma db seed', { stdio: 'inherit' })
} catch (error) {
  console.error('Failed to seed database', error)
  process.exit(1)
}
