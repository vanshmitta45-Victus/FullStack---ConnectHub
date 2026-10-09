Feature: Login
  As a user I want to log in so I can access the app

  Scenario Outline: Valid and invalid login
    Given I open the login page
    When I login with username "<username>" and password "<password>"
    Then I should see result "<result>"

    Examples:
      | username      | password     | result  |
      | standard_user | secret_sauce | success |
      | locked_user   | secret_sauce | locked  |
      | standard_user | wrong_pass   | error   |
