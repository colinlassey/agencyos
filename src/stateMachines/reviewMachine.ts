export type ReviewState = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'CHANGES_REQUESTED'
export type ReviewEvent = 'SUBMIT' | 'APPROVE' | 'REQUEST_CHANGES' | 'RESUBMIT'

export const reviewStateMachine: Record<ReviewState, Partial<Record<ReviewEvent, ReviewState>>> = {
  DRAFT: {
    SUBMIT: 'SUBMITTED',
  },
  SUBMITTED: {
    APPROVE: 'APPROVED',
    REQUEST_CHANGES: 'CHANGES_REQUESTED',
  },
  APPROVED: {},
  CHANGES_REQUESTED: {
    RESUBMIT: 'SUBMITTED',
  },
}

export function transitionReviewState(current: ReviewState, event: ReviewEvent): ReviewState {
  const next = reviewStateMachine[current]?.[event]
  if (!next) {
    throw new Error(`Invalid review transition from ${current} via ${event}`)
  }
  return next
}
