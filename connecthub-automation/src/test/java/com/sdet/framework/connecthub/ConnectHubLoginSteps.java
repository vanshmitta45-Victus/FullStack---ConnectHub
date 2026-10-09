package com.sdet.framework.connecthub;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.driver.DriverFactory;
import com.sdet.framework.pages.ConnectHubLoginPage;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.*;
import org.openqa.selenium.WebDriver;
import org.testng.Assert;

public class ConnectHubLoginSteps {
    private WebDriver driver;
    private ConnectHubLoginPage login;
    private String baseUrl;

    @Before
    public void before() {
        driver = DriverFactory.getDriver();
        login = new ConnectHubLoginPage(driver);
        baseUrl = ConfigReader.get("base.url");
    }

    @After
    public void after() { DriverFactory.quitDriver(); }

    @Given("I open the ConnectHub login page")
    public void openLogin() { login.open(baseUrl); }

    @When("I log in as {string} with password {string}")
    public void doLogin(String user, String pass) {
        // Self-seeding: create the user on first run so the scenario is repeatable
        try { new ConnectHubAuthApi().ensureUserToken(user, "Test@1234"); } catch (Exception ignored) {}
        login.login(user, pass);
    }

    @Then("I land on the dashboard")
    public void checkDashboard() {
        Assert.assertTrue(login.isLoggedIn(), "Should land on /dashboard with a token");
    }

    @Then("I see a login error")
    public void checkError() {
        Assert.assertTrue(login.isErrorShown(), "Invalid credentials should show an error");
    }
}
