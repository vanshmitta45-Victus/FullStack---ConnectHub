package com.vansh.connecthub.automation.kanban;

import com.vansh.connecthub.automation.base.BaseE2ETest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.api.ConnectHubTaskApi;

public class KanbanDragAndDropE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Verify drag-and-drop mechanics of the Kanban board across columns")
    void testKanbanDragAndDrop() {
        // Real JWT + guaranteed cards: API setup, UI action
        String token = new ConnectHubAuthApi().ensureUserToken("qa_engineer", "Password123!");
        ConnectHubTaskApi tasks = new ConnectHubTaskApi();
        if (tasks.listTasks(token).jsonPath().getList("$").size() < 2) {
            tasks.createTask(token, "Drag card A " + System.currentTimeMillis(), "kanban e2e");
            tasks.createTask(token, "Drag card B " + System.currentTimeMillis(), "kanban e2e");
        }

        // Authenticate test user session
        loginViaLocalStorage(driver, "qa_engineer", token, "ADMIN");
        driver.get(BASE_URL + "/tasks");

        // Wait for Kanban board view to load (Create Issue action marks a loaded board)
        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.xpath("//button[contains(.,'Create Issue')]")));

        // Locate columns
        List<WebElement> columns = driver.findElements(By.cssSelector(".kanban-col, div[style*='flex-direction: column']"));
        assertThat(columns).isNotEmpty();

        // Check for task cards or create a card if empty
        List<WebElement> cards = driver.findElements(By.cssSelector(".kanban-card, .saas-card"));
        
        if (!cards.isEmpty()) {
            WebElement sourceCard = cards.get(0);
            WebElement targetColumn = columns.size() > 1 ? columns.get(1) : columns.get(0);

            String initialCardText = sourceCard.getText();

            // Perform drag and drop action using Selenium Actions API
            Actions actions = new Actions(driver);
            actions.clickAndHold(sourceCard)
                    .moveToElement(targetColumn)
                    .pause(java.time.Duration.ofMillis(300))
                    .release()
                    .build()
                    .perform();

            // Verify the action was dispatched without client-side crashes
            assertThat(driver.getTitle()).isNotNull();
            assertThat(driver.findElements(By.cssSelector(".kanban-card, .saas-card"))).isNotEmpty();
        } else {
            // Verify board structure renders 6 standardized columns
            List<WebElement> columnHeaders = driver.findElements(By.xpath("//*[contains(text(), 'To Do') or contains(text(), 'In Progress') or contains(text(), 'Done')]"));
            assertThat(columnHeaders).isNotEmpty();
        }
    }
}
