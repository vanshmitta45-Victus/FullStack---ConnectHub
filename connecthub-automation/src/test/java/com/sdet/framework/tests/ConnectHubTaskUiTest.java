package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.pages.ConnectHubLoginPage;
import com.sdet.framework.pages.ConnectHubTaskBoardPage;
import io.qameta.allure.*;
import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.UUID;

/**
 * Browser tests - require frontend at base.url (npm run dev -> http://localhost:5173).
 * Skipped automatically if frontend is down (fail with clear message, not hang).
 */
@Epic("ConnectHub")
@Feature("UI")
public class ConnectHubTaskUiTest extends BaseTest {

    @Test(description = "Login form works with API-created user")
    @Severity(SeverityLevel.CRITICAL)
    public void testLoginForm() {
        String base = ConfigReader.get("base.url");
        String u = "ui_" + UUID.randomUUID().toString().substring(0, 8);
        new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");

        ConnectHubLoginPage login = new ConnectHubLoginPage(driver);
        login.open(base);
        login.login(u, "Test@1234");
        Assert.assertTrue(login.isLoggedIn(), "Login should land on /dashboard with token");
    }

    @Test(description = "API task appears on Kanban after token-inject login")
    public void testTaskVisibleOnBoard() {
        String base = ConfigReader.get("base.url");
        String u = "board_" + UUID.randomUUID().toString().substring(0, 8);
        String token = new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");
        String title = "BOARD " + UUID.randomUUID().toString().substring(0, 6);
        com.sdet.framework.api.ConnectHubTaskApi api = new com.sdet.framework.api.ConnectHubTaskApi();
        io.restassured.response.Response created = api.createTask(token, title, "board verify");
        Assert.assertEquals(created.statusCode(), 200, "setup: create task " + created.asString());
        long id = created.jsonPath().getLong("id");

        try {
            new ConnectHubLoginPage(driver).loginWithToken(base, u, token, "MEMBER");
            ConnectHubTaskBoardPage board = new ConnectHubTaskBoardPage(driver);
            Assert.assertTrue(board.isLoaded(), "Kanban board should load");
            // Verify card directly (search box is an extra filter - covered separately)
            boolean found = board.hasCard(title);
            if (!found) {
                try {
                    java.nio.file.Files.writeString(java.nio.file.Path.of("target/board-dump.html"),
                            driver.getPageSource());
                } catch (Exception ignored) {}
            }
            Assert.assertTrue(found, "Created task should render as kanban-card (dump: target/board-dump.html)");
        } finally {
            api.deleteTask(token, id);
        }
    }

    @Test(description = "User directory shows ACTION column with max 10 rows per page")
    public void testUserDirectoryPagination() {
        String base = ConfigReader.get("base.url");
        String u = "dir_" + UUID.randomUUID().toString().substring(0, 8);
        String token = new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");

        new ConnectHubLoginPage(driver).loginWithToken(base, u, token, "MEMBER");
        driver.get(base + "/users");
        com.sdet.framework.utils.WaitUtils.visible(driver,
                org.openqa.selenium.By.xpath("//th[contains(.,'ACTION')]"), 10);
        int rows = driver.findElements(
                org.openqa.selenium.By.xpath("//tbody/tr")).size();
        Assert.assertTrue(rows >= 1 && rows <= 10, "expected 1-10 rows, got " + rows);
        String footer = driver.findElement(
                org.openqa.selenium.By.xpath("//span[contains(text(),'Showing')]")).getText();
        Assert.assertTrue(footer.matches("Showing \\d+–\\d+ of \\d+ users"), "bad footer: " + footer);
    }

    @Test(description = "New-DM modal: search member, select, chat opens")
    public void testNewDmModal() {
        String base = ConfigReader.get("base.url");
        String u = "modal_" + UUID.randomUUID().toString().substring(0, 8);
        String token = new ConnectHubAuthApi().ensureUserToken(u, "Test@1234");

        new ConnectHubLoginPage(driver).loginWithToken(base, u, token, "MEMBER");
        driver.get(base + "/chat");

        // open the modal via the + button in the DIRECT MESSAGES header
        com.sdet.framework.utils.WaitUtils.visible(driver,
                org.openqa.selenium.By.xpath("//button[@title='New direct message']"), 10).click();
        com.sdet.framework.utils.WaitUtils.visible(driver,
                org.openqa.selenium.By.xpath("//input[contains(@placeholder,'Type a name')]"), 10)
                .sendKeys("demo_user");
        // select the member -> DM view opens on that user
        com.sdet.framework.utils.WaitUtils.visible(driver,
                org.openqa.selenium.By.xpath("//div[contains(@class,'neu-nav-item') and contains(.,'demo_user')]"), 10)
                .click();
        org.openqa.selenium.WebElement header = com.sdet.framework.utils.WaitUtils.visible(driver,
                org.openqa.selenium.By.xpath("//h2[contains(.,'demo_user')]"), 10);
        Assert.assertTrue(header.isDisplayed());
    }
}
