package com.sdet.framework.tests;

import com.sdet.framework.api.UserApiClient;
import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.pages.LoginPage;
import io.qameta.allure.*;
import org.testng.Assert;
import org.testng.annotations.Test;

/**
 * Demonstrates unified testing: API setup + UI verification.
 * In real ConnectHub use: create task via API, verify on Kanban UI + DB row.
 * Here uses public demo apps so CI runs without your backend.
 */
@Epic("E2E")
@Feature("UI+API unified")
public class TaskE2ETest extends BaseTest {

    @Test(description = "API creates data, UI reflects it")
    @Severity(SeverityLevel.CRITICAL)
    public void testApiSetup_UiVerify() {
        // 1. API setup
        UserApiClient api = new UserApiClient();
        Allure.step("Create precondition via API");
        Assert.assertEquals(api.createUser("e2e_user", "qa").statusCode(), 201);

        // 2. UI verification (SauceDemo login flow)
        Allure.step("Verify UI login still works after API setup");
        LoginPage login = new LoginPage(driver);
        login.open(ConfigReader.get("base.url"));
        login.login("standard_user", "secret_sauce");
        Assert.assertFalse(login.isErrorShown(), "No error expected: " + login.errorText());

        // 3. TODO when pointed at ConnectHub: assert DB row via DBUtils.count("select count(*) from tasks where title='...'")
    }
}
