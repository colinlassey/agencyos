Feature: Task lifecycle and feedback
  Scenario: Create task with due soon badge
    Given a project "Acme Storefront Refresh"
    When a developer creates a task with due date within 72 hours
    Then the task shows a due-soon badge and priority label

  Scenario: Submit task for review and approve
    Given a task "Homepage wireframes" in review
    When an admin approves the review request
    Then the task transitions to DONE and the review is marked approved

  Scenario: Submit task for review and request changes
    Given a task "Component library tokens" in review
    When a reviewer requests changes
    Then the task returns to DOING with a pending review noted

  Scenario: Post feedback with visibility toggle
    Given a task with internal discussion
    When a developer posts feedback hidden from the client
    Then the feedback is marked as internal only
