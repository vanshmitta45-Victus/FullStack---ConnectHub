package com.sdet.framework.pages;

import com.sdet.framework.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class LoginPage {
    private final WebDriver driver;
    private final By username = By.id("user-name");
    private final By password = By.id("password");
    private final By loginBtn = By.id("login-button");
    private final By error = By.cssSelector("[data-test='error']");

    public LoginPage(WebDriver driver) { this.driver = driver; }

    public void open(String baseUrl) { driver.get(baseUrl); }

    public void login(String user, String pass) {
        WaitUtils.visible(driver, username, 10).sendKeys(user);
        driver.findElement(password).sendKeys(pass);
        driver.findElement(loginBtn).click();
    }

    public boolean isErrorShown() {
        try { return WaitUtils.visible(driver, error, 3).isDisplayed(); }
        catch (Exception e) { return false; }
    }

    public String errorText() {
        try { return driver.findElement(error).getText(); }
        catch (Exception e) { return ""; }
    }
}
