package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.api.ConnectHubTaskApi;
import io.qameta.allure.*;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.*;

import java.util.UUID;

@Epic("ConnectHub")
@Feature("Tasks API")
public class ConnectHubTaskApiTest {
    private ConnectHubTaskApi tasks;
    private String token;
    private long createdId;

    @BeforeClass
    public void login() {
        ConnectHubAuthApi auth = new ConnectHubAuthApi();
        String u = "tasks_" + UUID.randomUUID().toString().substring(0, 8);
        token = auth.ensureUserToken(u, "Test@1234");
        tasks = new ConnectHubTaskApi();
        Assert.assertNotNull(token);
    }

    @Test(description = "Create task returns 200 with id")
    @Severity(SeverityLevel.CRITICAL)
    public void testCreateTask() {
        String title = "SDET task " + UUID.randomUUID().toString().substring(0, 6);
        Response r = tasks.createTask(token, title, "created by automation");
        Assert.assertEquals(r.statusCode(), 200, r.asString());
        createdId = r.jsonPath().getLong("id");
        Assert.assertTrue(createdId > 0);
    }

    @Test(description = "List tasks contains created task", dependsOnMethods = "testCreateTask")
    public void testListContainsCreated() {
        Response r = tasks.listTasks(token);
        Assert.assertEquals(r.statusCode(), 200);
        Assert.assertTrue(r.asString().contains(String.valueOf(createdId)));
    }

    @Test(description = "Move task TODO -> IN_PROGRESS -> DONE", dependsOnMethods = "testListContainsCreated")
    public void testMoveStatus() {
        Assert.assertEquals(tasks.updateStatus(token, createdId, "IN_PROGRESS").statusCode(), 200);
        Response done = tasks.updateStatus(token, createdId, "DONE");
        Assert.assertEquals(done.statusCode(), 200, done.asString());
    }

    @Test(description = "RBAC: unauthenticated list is 401/403")
    public void testUnauthBlocked() {
        io.restassured.response.Response r = io.restassured.RestAssured
                .given().when().get("/tasks/all").then().extract().response();
        Assert.assertTrue(r.statusCode() == 401 || r.statusCode() == 403, "got " + r.statusCode());
    }

    @AfterClass
    public void cleanup() {
        if (createdId > 0) tasks.deleteTask(token, createdId);
    }
}
