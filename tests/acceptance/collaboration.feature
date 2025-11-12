Feature: Collaboration and visibility
  Scenario: Log time on a task and see weekly totals
    Given a developer assigned to "Homepage wireframe"
    When they log 4 hours against the task
    Then the weekly total shows 4 hours for that developer

  Scenario: Chat in general and project channels
    Given team members in General chat
    When they send a new message
    Then all participants receive it in real time

  Scenario: View workload heatmap
    Given tasks with estimates per user
    When viewing the team heatmap
    Then over-allocated weeks are highlighted in red

  Scenario: Upload and browse project files
    Given a project with S3 storage
    When a user uploads a design file
    Then it appears in the file explorer under that project

  Scenario: View calendar and push to Google
    Given project due dates stored in calendar events
    When the push command runs
    Then new events are created in the connected Google Calendar

  Scenario: Receive notifications
    Given an admin assigned a review
    When the review status changes
    Then the admin sees a new unread notification
