Feature: ConnectHub login
  As a workspace member I want to sign in so I can reach my dashboard

  Scenario: Valid credentials land on the dashboard
    Given I open the ConnectHub login page
    When I log in as "nexus_sdet" with password "Test@1234"
    Then I land on the dashboard

  Scenario: Wrong password shows an error
    Given I open the ConnectHub login page
    When I log in as "nexus_sdet" with password "wrong-password!"
    Then I see a login error
