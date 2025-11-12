export type TaskState = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'COMPLETE' | 'ARCHIVED'
export type TaskEvent = 'START' | 'REQUEST_REVIEW' | 'BLOCK' | 'UNBLOCK' | 'COMPLETE' | 'ARCHIVE'

export const taskStateMachine: Record<TaskState, Partial<Record<TaskEvent, TaskState>>> = {
  BACKLOG: {
    START: 'IN_PROGRESS',
    ARCHIVE: 'ARCHIVED',
  },
  IN_PROGRESS: {
    REQUEST_REVIEW: 'REVIEW',
    BLOCK: 'BLOCKED',
    COMPLETE: 'COMPLETE',
    ARCHIVE: 'ARCHIVED',
  },
  REVIEW: {
    COMPLETE: 'COMPLETE',
    BLOCK: 'BLOCKED',
    ARCHIVE: 'ARCHIVED',
  },
  BLOCKED: {
    UNBLOCK: 'IN_PROGRESS',
    ARCHIVE: 'ARCHIVED',
  },
  COMPLETE: {
    ARCHIVE: 'ARCHIVED',
  },
  ARCHIVED: {},
}

export function transitionTaskState(current: TaskState, event: TaskEvent): TaskState {
  const next = taskStateMachine[current]?.[event]
  if (!next) {
    throw new Error(`Invalid transition from ${current} via ${event}`)
  }
  return next
}
