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
        targetDriver.get(BASE_URL + "/login");
        JavascriptExecutor js = (JavascriptExecutor) targetDriver;
        js.executeScript("localStorage.setItem('token', arguments[0]);", token);
        js.executeScript("localStorage.setItem('username', arguments[1]);", username);
        js.executeScript("localStorage.setItem('role', arguments[2]);", role);
        targetDriver.navigate().refresh();
    }

    protected WebElement waitAndFind(WebDriver targetDriver, By locator, int timeoutSeconds) {
        WebDriverWait customWait = new WebDriverWait(targetDriver, Duration.ofSeconds(timeoutSeconds));
        return customWait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }
}
