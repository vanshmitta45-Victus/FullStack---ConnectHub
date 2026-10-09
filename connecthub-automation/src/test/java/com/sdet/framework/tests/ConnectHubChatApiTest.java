package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.config.ConfigReader;
import io.qameta.allure.*;
import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;

@Epic("ConnectHub")
@Feature("DM conversations API")
public class ConnectHubChatApiTest {
    private String base;
    private String token;

    @BeforeClass
    public void login() {
        base = ConfigReader.get("api.base.url", "http://localhost:8080/api");
        RestAssured.baseURI = base;
        String u = "dm_" + UUID.randomUUID().toString().substring(0, 8);
        token = new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");
    }

    @Test(description = "Fresh user has empty conversation list")
    @Severity(SeverityLevel.CRITICAL)
    public void testEmptyConversations() {
        Response r = given().header("Authorization", "Bearer " + token)
                .when().get("/chat/conversations").then().extract().response();
        Assert.assertEquals(r.statusCode(), 200, r.asString());
        Assert.assertEquals(r.jsonPath().getList("$").size(), 0);
    }

    @Test(description = "Unauthenticated conversations request is rejected")
    public void testConversationsUnauth() {
        Response r = given().when().get("/chat/conversations").then().extract().response();
        Assert.assertTrue(r.statusCode() == 401 || r.statusCode() == 403, "got " + r.statusCode());
    }
}
