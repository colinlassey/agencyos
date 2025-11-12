import { Role } from '@prisma/client'

export type Permission =
  | 'client:read'
  | 'client:write'
  | 'project:read'
  | 'project:write'
  | 'task:read'
  | 'task:write'
  | 'feedback:write'
  | 'review:write'
  | 'timelog:read'
  | 'timelog:write'
  | 'file:read'
  | 'file:write'
  | 'chat:read'
  | 'chat:write'
  | 'notification:read'
  | 'calendar:write'

export type AuthContext = {
  userId: string
  role: Role
}

const rolePermissions: Record<Role, Set<Permission>> = {
  [Role.ADMIN]: new Set([
    'client:read',
    'client:write',
    'project:read',
    'project:write',
    'task:read',
    'task:write',
    'feedback:write',
    'review:write',
    'timelog:read',
    'timelog:write',
    'file:read',
    'file:write',
    'chat:read',
    'chat:write',
    'notification:read',
    'calendar:write',
  ]),
  [Role.DEVELOPER]: new Set([
    'client:read',
    'project:read',
    'project:write',
    'task:read',
    'task:write',
    'feedback:write',
    'review:write',
    'timelog:read',
    'timelog:write',
    'file:read',
    'file:write',
    'chat:read',
    'chat:write',
    'notification:read',
  ]),
  [Role.CLIENT]: new Set([
    'client:read',
    'project:read',
    'task:read',
    'feedback:write',
    'chat:read',
    'chat:write',
    'notification:read',
  ]),
}

export function assertPermission(ctx: AuthContext, permission: Permission) {
  if (!rolePermissions[ctx.role]?.has(permission)) {
    const error = new Error('Forbidden')
    ;(error as any).status = 403
    throw error
  }
}

export function isPrivileged(ctx: AuthContext) {
  return ctx.role === Role.ADMIN || ctx.role === Role.DEVELOPER
}

export function canAccessClient(ctx: AuthContext, memberIds: string[]) {
  if (isPrivileged(ctx)) return true
  return ctx.role === Role.CLIENT && memberIds.includes(ctx.userId)
}

export function canAccessProject(ctx: AuthContext, memberIds: string[], clientContactIds: string[]) {
  if (isPrivileged(ctx)) return true
  if (ctx.role === Role.CLIENT) {
    return clientContactIds.includes(ctx.userId)
  }
  return memberIds.includes(ctx.userId)
}

export function canAccessTask(ctx: AuthContext, assigneeIds: string[], projectMemberIds: string[], clientContactIds: string[]) {
  if (isPrivileged(ctx)) return true
  if (ctx.role === Role.CLIENT) {
    return clientContactIds.includes(ctx.userId)
  }
  return assigneeIds.includes(ctx.userId) || projectMemberIds.includes(ctx.userId)
}
