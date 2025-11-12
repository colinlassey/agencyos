Feature: Manage clients and projects
  As an admin
  I want to create clients and projects with required fields
  So that work can be organized by account

  Scenario: Create client with normalized unique name
    Given an authenticated admin
    When they submit the client form with name "Acme" and domain "acme.test"
    Then the client is stored with a normalized name and contact access for the submitter

  Scenario: Create project with due date and membership
    Given an authenticated admin with client "Acme"
    When they submit the project form with stage "DESIGN" priority "HIGH" and a due date next week
    Then the project is created with due date, stage, priority, and membership records
