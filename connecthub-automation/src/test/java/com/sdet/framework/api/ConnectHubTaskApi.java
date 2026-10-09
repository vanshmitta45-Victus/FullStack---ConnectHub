package com.sdet.framework.api;

import com.sdet.framework.config.ConfigReader;
import io.restassured.RestAssured;
import io.restassured.response.Response;

import java.util.HashMap;
import java.util.Map;

import static io.restassured.RestAssured.given;

/**
 * ConnectHub Task + User APIs (JWT required).
 * Maps to TaskController (/api/tasks) and UserController (/api/users).
 */
public class ConnectHubTaskApi {
    private final String baseUrl;

    public ConnectHubTaskApi() {
        this.baseUrl = ConfigReader.get("api.base.url", "http://localhost:8080/api");
        RestAssured.baseURI = baseUrl;
    }

    private Map<String, String> auth(String token) {
        Map<String, String> h = new HashMap<>();
        h.put("Authorization", "Bearer " + token);
        return h;
    }

    public Response createTask(String token, String title, String description) {
        Map<String, Object> body = new HashMap<>();
        body.put("title", title);
        body.put("description", description);
        body.put("status", "TODO");
        body.put("priority", "MEDIUM");
        body.put("project", "ConnectHub Core");
        body.put("storyPoints", 2);
        return given().contentType("application/json").headers(auth(token)).body(body)
                .when().post("/tasks/create").then().extract().response();
    }

    public Response listTasks(String token) {
        return given().headers(auth(token)).when().get("/tasks/all").then().extract().response();
    }

    public Response updateStatus(String token, long taskId, String status) {
        Map<String, String> body = Map.of("status", status);
        return given().contentType("application/json").headers(auth(token)).body(body)
                .when().put("/tasks/" + taskId + "/status").then().extract().response();
    }

    public Response deleteTask(String token, long taskId) {
        return given().headers(auth(token)).when().delete("/tasks/" + taskId).then().extract().response();
    }

    public Response userDirectory(String token) {
        return given().headers(auth(token)).when().get("/users/directory").then().extract().response();
    }
}
