package com.sdet.framework.tests;

import com.sdet.framework.api.UserApiClient;
import io.qameta.allure.*;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

@Epic("API")
@Feature("Users API")
public class UserApiTest {
    private UserApiClient api;

    @BeforeClass
    public void init() { api = new UserApiClient(); }

    @Test(description = "GET list users returns 200 with data")
    @Severity(SeverityLevel.CRITICAL)
    public void testListUsers() {
        Response r = api.listUsers(2);
        Assert.assertEquals(r.statusCode(), 200);
        Assert.assertTrue(r.jsonPath().getList("data").size() > 0);
        Assert.assertNotNull(r.jsonPath().getString("data[0].email"));
    }

    @Test(description = "POST create user returns 201 with id")
    public void testCreateUser() {
        Response r = api.createUser("Vansh", "SDET");
        Assert.assertEquals(r.statusCode(), 201);
        Assert.assertNotNull(r.jsonPath().getString("id"));
        Assert.assertEquals(r.jsonPath().getString("name"), "Vansh");
    }

    @Test(description = "GET single user - positive and negative")
    public void testGetUser() {
        Assert.assertEquals(api.getUser(2).statusCode(), 200);
        // reqres returns 404 for unknown user
        Assert.assertEquals(api.getUser(999999).statusCode(), 404);
    }
}
