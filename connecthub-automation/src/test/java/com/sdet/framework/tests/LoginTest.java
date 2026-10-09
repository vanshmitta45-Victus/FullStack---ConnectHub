package com.sdet.framework.tests;

import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.pages.InventoryPage;
import com.sdet.framework.pages.LoginPage;
import io.qameta.allure.*;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

@Epic("UI")
@Feature("Login")
public class LoginTest extends BaseTest {

    @DataProvider(name = "loginData")
    public Object[][] loginData() {
        return new Object[][]{
                {"standard_user", "secret_sauce", true},
                {"locked_user", "secret_sauce", false},
                {"standard_user", "wrong_pass", false},
        };
    }

    @Test(dataProvider = "loginData", description = "Data-driven login")
    @Severity(SeverityLevel.CRITICAL)
    public void testLogin(String user, String pass, boolean shouldSucceed) {
        LoginPage login = new LoginPage(driver);
        login.open(ConfigReader.get("base.url"));

        Allure.step("Login as " + user);
        login.login(user, pass);

        if (shouldSucceed) {
            Assert.assertTrue(new InventoryPage(driver).isLoaded(), "Inventory should load");
        } else {
            Assert.assertTrue(login.isErrorShown(), "Error should be shown for " + user);
        }
    }

    @Test(description = "Standard user sees products")
    public void testInventoryCount() {
        LoginPage login = new LoginPage(driver);
        login.open(ConfigReader.get("base.url"));
        login.login("standard_user", "secret_sauce");
        Assert.assertTrue(new InventoryPage(driver).itemCount() > 0);
    }
}
