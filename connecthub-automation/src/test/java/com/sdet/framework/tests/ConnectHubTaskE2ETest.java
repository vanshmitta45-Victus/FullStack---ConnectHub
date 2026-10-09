package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.api.ConnectHubTaskApi;
import com.sdet.framework.utils.DBUtils;
import io.qameta.allure.*;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.*;

import java.util.UUID;

/**
 * Unified E2E without browser: API creates task -> DB row asserted -> API status move -> cleanup.
 * Proves UI+API+DB skill; browser variant (ConnectHubTaskUiTest) covers the UI layer when frontend runs.
 */
@Epic("ConnectHub")
@Feature("E2E API+DB")
public class ConnectHubTaskE2ETest {
    private String token;
    private long taskId;
    private String title;

    @BeforeClass
    public void setup() {
        String u = "e2e_" + UUID.randomUUID().toString().substring(0, 8);
        token = new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");
    }

    @Test(description = "API create -> DB row exists -> status move -> delete")
    @Severity(SeverityLevel.CRITICAL)
    public void testApiDbFlow() {
        ConnectHubTaskApi api = new ConnectHubTaskApi();
        title = "E2E " + UUID.randomUUID().toString().substring(0, 6);

        Allure.step("Create via API");
        Response c = api.createTask(token, title, "e2e flow");
        Assert.assertEquals(c.statusCode(), 200, c.asString());
        taskId = c.jsonPath().getLong("id");

        Allure.step("Assert DB row");
        int n = DBUtils.count("select count(*) from tasks where id=" + taskId);
        Assert.assertEquals(n, 1, "task row missing in postgres");

        Allure.step("Move to DONE via API");
        Assert.assertEquals(api.updateStatus(token, taskId, "DONE").statusCode(), 200);

        Allure.step("Assert DB status");
        int done = DBUtils.count("select count(*) from tasks where id=" + taskId + " and status='DONE'");
        Assert.assertEquals(done, 1);
    }

    @AfterClass
    public void cleanup() {
        if (taskId > 0) new ConnectHubTaskApi().deleteTask(token, taskId);
    }
}
