package com.sdet.framework.api;

import com.sdet.framework.config.ConfigReader;
import io.restassured.RestAssured;
import io.restassured.response.Response;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * ConnectHub Auth API: POST /api/auth/signup, POST /api/auth/login
 * Backend: connecthub-backend AuthController.
 */
public class ConnectHubAuthApi {
    private final String baseUrl;

    public ConnectHubAuthApi() {
        this.baseUrl = ConfigReader.get("api.base.url", "http://localhost:8080/api");
        RestAssured.baseURI = baseUrl;
    }

    public Response signup(String username, String password) {
        Map<String, String> body = new HashMap<>();
        body.put("username", username);
        body.put("password", password);
        return given().contentType("application/json").body(body)
                .when().post("/auth/signup").then().extract().response();
    }

    public Response login(String username, String password) {
        Map<String, String> body = new HashMap<>();
        body.put("username", username);
        body.put("password", password);
        return given().contentType("application/json").body(body)
                .when().post("/auth/login").then().extract().response();
    }

    public String loginAndGetToken(String username, String password) {
        Response r = login(username, password);
        if (r.statusCode() != 200) {
            throw new RuntimeException("Login failed for " + username + ": " + r.asString());
        }
        return r.jsonPath().getString("token");
    }

    /** Login, or signup-then-login if user does not exist. Returns JWT. */
    public String ensureUserToken(String username, String password) {
        Response login = login(username, password);
        if (login.statusCode() == 200) return login.jsonPath().getString("token");
        Response signup = signup(username, password);
        if (signup.statusCode() != 200 && signup.statusCode() != 201) {
            // user may already exist -> try login once more for error message
            Response retry = login(username, password);
            if (retry.statusCode() == 200) return retry.jsonPath().getString("token");
            throw new RuntimeException("Signup failed for " + username + ": " + signup.asString());
        }
        return loginAndGetToken(username, password);
    }
}
