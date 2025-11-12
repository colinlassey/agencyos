import { Role } from '@prisma/client'

type Permission =
  | 'client:read'
  | 'client:write'
  | 'project:read'
  | 'project:write'
  | 'task:read'
  | 'task:write'
  | 'review:action'
  | 'feedback:write'
  | 'timelog:write'
  | 'chat:write'
  | 'file:write'
  | 'notification:read'

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    'client:read',
    'client:write',
    'project:read',
    'project:write',
    'task:read',
    'task:write',
    'review:action',
    'feedback:write',
    'timelog:write',
    'chat:write',
    'file:write',
    'notification:read',
  ],
  [Role.DEVELOPER]: [
    'client:read',
    'project:read',
    'project:write',
    'task:read',
    'task:write',
    'review:action',
    'feedback:write',
    'timelog:write',
    'chat:write',
    'file:write',
    'notification:read',
  ],
  [Role.CLIENT]: [
    'client:read',
    'project:read',
    'task:read',
    'review:action',
    'feedback:write',
    'chat:write',
    'notification:read',
  ],
}

export const requirePermission = (role: Role, permission: Permission) => {
  if (!rolePermissions[role]?.includes(permission)) {
    throw new Error('FORBIDDEN')
  }
}
