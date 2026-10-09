package com.sdet.framework.stepdefs;

import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.driver.DriverFactory;
import com.sdet.framework.pages.InventoryPage;
import com.sdet.framework.pages.LoginPage;
import io.cucumber.java.After;
import io.cucumber.java.Before;
import io.cucumber.java.en.*;
import org.openqa.selenium.WebDriver;
import org.testng.Assert;

public class LoginSteps {
    private WebDriver driver;
    private LoginPage login;

    @Before
    public void before() {
        driver = DriverFactory.getDriver();
        login = new LoginPage(driver);
    }

    @After
    public void after() { DriverFactory.quitDriver(); }

    @Given("I open the login page")
    public void openLogin() { login.open(ConfigReader.get("base.url")); }

    @When("I login with username {string} and password {string}")
    public void doLogin(String u, String p) { login.login(u, p); }

    @Then("I should see result {string}")
    public void check(String result) {
        if (result.equals("success")) {
            Assert.assertTrue(new InventoryPage(driver).isLoaded());
        } else {
            Assert.assertTrue(login.isErrorShown(), "Expected error for: " + result);
        }
    }
}
