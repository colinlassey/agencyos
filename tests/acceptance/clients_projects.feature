Feature: Manage clients and projects
  As an admin
  I want to create clients and projects with required fields
  So that work can be organized by account

  Scenario: Create client with unique name
    Given an authenticated admin
    When they submit the client form with name "Acme" stage "ACTIVE" priority "HIGH"
    Then the client is stored with a due date and stage

  Scenario: Create project with due date and assignees
    Given an authenticated admin with client "Acme"
    When they submit the project form with due date and developer assignee
    Then the project is created with due date, stage, priority, and membership records
