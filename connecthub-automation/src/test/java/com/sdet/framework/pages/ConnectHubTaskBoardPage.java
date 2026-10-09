package com.sdet.framework.pages;

import com.sdet.framework.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

/** Kanban board (/tasks) - TaskBoard.jsx markers. */
public class ConnectHubTaskBoardPage {
    private final WebDriver driver;
    private final By header = By.xpath("//button[contains(.,'Create Issue')]");
    private final By createBtn = By.xpath("//button[contains(.,'Create Issue')]");
    private final By titleInput = By.xpath("//input[contains(@placeholder,'Implement')]");
    private final By search = By.xpath("//input[contains(@placeholder,'Search issues')]");

    public ConnectHubTaskBoardPage(WebDriver driver) { this.driver = driver; }

    public void open(String baseUrl) { driver.get(baseUrl + "/tasks"); }

    public boolean isLoaded() {
        try { return WaitUtils.visible(driver, header, 20).isDisplayed(); }
        catch (Exception e) { return false; }
    }

    public By cardFor(String title) {
        return By.xpath("//*[contains(@class,'kanban-card') and contains(.,\"" + title + "\")]");
    }

    public boolean hasCard(String title) {
        try { return WaitUtils.visible(driver, cardFor(title), 30).isDisplayed(); }
        catch (Exception e) { return false; }
    }

    public void search(String q) {
        try {
            WaitUtils.visible(driver, search, 10).clear();
            driver.findElement(search).sendKeys(q);
        } catch (Exception ignored) {}
    }

    public void createIssue(String title, String description) {
        WaitUtils.visible(driver, createBtn, 10).click();
        WaitUtils.visible(driver, titleInput, 10).sendKeys(title);
        // description textarea + submit inside the modal form
        driver.findElement(By.xpath("//textarea")).sendKeys(description);
        driver.findElement(By.xpath("//form//button[@type='submit' and contains(.,'Create Issue')]")).click();
    }
}
