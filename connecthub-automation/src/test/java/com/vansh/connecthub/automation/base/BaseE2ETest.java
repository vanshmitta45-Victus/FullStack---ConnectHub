package com.vansh.connecthub.automation.base;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public abstract class BaseE2ETest {

    protected WebDriver driver;
    protected WebDriverWait wait;
    protected final List<WebDriver> activeDrivers = new ArrayList<>();

    protected static final String BASE_URL = System.getProperty("app.url", "http://localhost:5173");

    @BeforeAll
    public static void setupWebDriverBinary() {
        try {
            WebDriverManager.chromedriver().setup();
        } catch (Exception e) {
            System.out.println("WebDriverManager initialization: " + e.getMessage());
        }
    }

    @BeforeEach
    public void initDriver() {
        driver = createNewDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    public WebDriver createNewDriver() {
        ChromeOptions options = new ChromeOptions();
        boolean headless = Boolean.parseBoolean(System.getProperty("headless", "true"));
        if (headless) {
            options.addArguments("--headless=new");
        }
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--remote-allow-origins=*");
        options.addArguments("--window-size=1920,1080");
        // TEMP-DEBUG: browser console capture
        options.setCapability("goog:loggingPrefs", java.util.Map.of("browser", "ALL"));

        WebDriver newDriver = new ChromeDriver(options);
        newDriver.manage().timeouts().implicitlyWait(Duration.ofSeconds(5));
        activeDrivers.add(newDriver);
        return newDriver;
    }

    @AfterEach
    public void tearDown() {
        for (WebDriver d : activeDrivers) {
            try {
                if (d != null) {
                    d.quit();
                }
            } catch (Exception ignored) {
            }
        }
        activeDrivers.clear();
    }

    protected void loginViaLocalStorage(WebDriver targetDriver, String username, String token, String role) {
        // Write credentials on the target origin, then verify readback before navigating on.
        // (Guards against any page script racing to overwrite localStorage.)
        targetDriver.get(BASE_URL + "/login");
        JavascriptExecutor js = (JavascriptExecutor) targetDriver;
        js.executeScript("localStorage.setItem('token', arguments[0]);", token);
        js.executeScript("localStorage.setItem('username', arguments[0]);", username);
        js.executeScript("localStorage.setItem('role', arguments[0]);", role);
        Object checkUser = js.executeScript("return localStorage.getItem('username');");
        Object checkToken = js.executeScript("return (localStorage.getItem('token')||'').length;");
        System.out.println("LOGIN-HELPER url=" + targetDriver.getCurrentUrl()
                + " wrote=" + username + " readback=" + checkUser + " tokenLen=" + checkToken);
        if (!username.equals(checkUser)) {
            throw new IllegalStateException("localStorage write lost: expected " + username + " got " + checkUser);
        }
        targetDriver.navigate().refresh();
    }

    private static final String API_URL = System.getProperty("api.base.url", "http://localhost:8080/api");

    /** Real JWT via login API (falls back to signup-then-login on a fresh DB). */
    protected String realTokenFor(String username, String password) {
        try {
            java.net.http.HttpClient http = java.net.http.HttpClient.newHttpClient();
            String body = "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}";
            java.net.http.HttpRequest req = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(API_URL + "/auth/login"))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body)).build();
            String res = http.send(req, java.net.http.HttpResponse.BodyHandlers.ofString()).body();
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(res);
            if (m.find()) return m.group(1);
            java.net.http.HttpRequest signup = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(API_URL + "/auth/signup"))
                    .header("Content-Type", "application/json")
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(body)).build();
            http.send(signup, java.net.http.HttpResponse.BodyHandlers.discarding());
            String retry = http.send(req, java.net.http.HttpResponse.BodyHandlers.ofString()).body();
            java.util.regex.Matcher m2 = java.util.regex.Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"").matcher(retry);
            if (m2.find()) return m2.group(1);
            throw new RuntimeException("No token in login response: " + res);
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Login API failed for " + username, e);
        }
    }

    protected WebElement waitAndFind(WebDriver targetDriver, By locator, int timeoutSeconds) {
        WebDriverWait customWait = new WebDriverWait(targetDriver, Duration.ofSeconds(timeoutSeconds));
        return customWait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }
}
