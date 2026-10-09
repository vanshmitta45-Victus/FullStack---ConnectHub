package com.sdet.framework.pages;

import com.sdet.framework.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

/**
 * ConnectHub login (Login.jsx) has no ids - locate by type/placeholder.
 * - username: input[type=text] placeholder "e.g. vansh or demo_user"
 * - password: input[type=password]
 * - submit: button[type=submit] "Sign In"
 */
public class ConnectHubLoginPage {
    private final WebDriver driver;
    private final By username = By.xpath("//input[@type='text']");
    private final By password = By.xpath("//input[@type='password']");
    private final By signIn = By.xpath("//button[@type='submit']");
    private final By error = By.xpath("//*[contains(text(),'Invalid username or password')]");

    public ConnectHubLoginPage(WebDriver driver) { this.driver = driver; }

    public void open(String baseUrl) { driver.get(baseUrl + "/login"); }

    public void login(String user, String pass) {
        // Wait for both fields - React renders the form together; fresh inputs are empty so no clear() needed
        // (clear() can desync React controlled inputs)
        WaitUtils.visible(driver, username, 15).sendKeys(user);
        WaitUtils.visible(driver, password, 15).sendKeys(pass);
        WaitUtils.visible(driver, signIn, 10).click();
    }

    public boolean isErrorShown() {
        try { return WaitUtils.visible(driver, error, 3).isDisplayed(); }
        catch (Exception e) { return false; }
    }

    public boolean isLoggedIn() {
        // Poll: remote/Grid browsers need longer than local for login round-trip
        long end = System.currentTimeMillis() + 10000;
        while (System.currentTimeMillis() < end) {
            try {
                String url = driver.getCurrentUrl();
                Object token = ((JavascriptExecutor) driver).executeScript("return localStorage.getItem('token');");
                if (url.contains("/dashboard") && token != null && !token.toString().isEmpty()) return true;
                Thread.sleep(500);
            } catch (Exception ignored) {}
        }
        return false;
    }

    /** Fast path used by E2E: skip form, inject JWT from API. */
    public void loginWithToken(String baseUrl, String username, String token, String role) {
        driver.get(baseUrl + "/login");
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript("localStorage.setItem('token', arguments[0]);", token);
        js.executeScript("localStorage.setItem('username', arguments[0]);", username);
        js.executeScript("localStorage.setItem('role', arguments[0]);", role);
        driver.get(baseUrl + "/tasks");
    }
}
