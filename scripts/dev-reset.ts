import { execSync } from 'child_process'

const commands = [
  'npx prisma migrate reset --force --skip-seed',
  'npx prisma db push',
  'npx prisma db seed',
]

for (const command of commands) {
  console.log(`\n→ ${command}`)
  execSync(command, { stdio: 'inherit' })
}
