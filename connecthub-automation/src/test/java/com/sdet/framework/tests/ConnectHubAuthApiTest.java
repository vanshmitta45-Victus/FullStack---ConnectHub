package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import io.qameta.allure.*;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.util.UUID;

@Epic("ConnectHub")
@Feature("Auth API")
public class ConnectHubAuthApiTest {
    private ConnectHubAuthApi auth;
    private String user;
    private final String pass = "Test@1234";

    @BeforeClass
    public void init() {
        auth = new ConnectHubAuthApi();
        user = "sdet_" + UUID.randomUUID().toString().substring(0, 8);
    }

    @Test(description = "Signup new user returns 200")
    @Severity(SeverityLevel.CRITICAL)
    public void testSignup() {
        Response r = auth.signup(user, pass);
        Assert.assertEquals(r.statusCode(), 200, r.asString());
    }

    @Test(description = "Login returns JWT + username", dependsOnMethods = "testSignup")
    public void testLogin() {
        Response r = auth.login(user, pass);
        Assert.assertEquals(r.statusCode(), 200, r.asString());
        Assert.assertNotNull(r.jsonPath().getString("token"));
        Assert.assertEquals(r.jsonPath().getString("username"), user);
    }

    @Test(description = "Wrong password returns 401")
    public void testLoginNegative() {
        Response r = auth.login(user, "wrong_" + pass);
        Assert.assertEquals(r.statusCode(), 401, r.asString());
    }
}
