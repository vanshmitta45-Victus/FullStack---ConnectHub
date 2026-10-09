package com.sdet.framework.api;

import com.sdet.framework.config.ConfigReader;
import io.restassured.RestAssured;
import io.restassured.response.Response;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;

public class UserApiClient {
    private final String baseUrl;

    public UserApiClient() {
        this.baseUrl = ConfigReader.get("api.base.url", "https://reqres.in/api");
        RestAssured.baseURI = baseUrl;
    }

    public Response listUsers(int page) {
        return given().when().get("/users?page=" + page).then().extract().response();
    }

    public Response createUser(String name, String job) {
        Map<String, String> body = new HashMap<>();
        body.put("name", name);
        body.put("job", job);
        return given().contentType("application/json").body(body)
                .when().post("/users").then().extract().response();
    }

    public Response getUser(int id) {
        return given().when().get("/users/" + id).then().extract().response();
    }
}
