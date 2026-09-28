package com.vansh.connecthub.automation.chat;

import com.vansh.connecthub.automation.base.BaseE2ETest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

public class MultiSessionRealtimeChatE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Verify real-time messages appear across two different active browser sessions without refresh")
    void testRealtimeChatMultiSession() {
        // Session 1: User A (Alice)
        WebDriver driverAlice = driver;
        loginViaLocalStorage(driverAlice, "alice_qa", "token_alice", "MEMBER");
        driverAlice.get(BASE_URL + "/chat");

        // Session 2: User B (Bob) in completely separate browser instance
        WebDriver driverBob = createNewDriver();
        WebDriverWait waitBob = new WebDriverWait(driverBob, Duration.ofSeconds(10));
        loginViaLocalStorage(driverBob, "bob_qa", "token_bob", "MEMBER");
        driverBob.get(BASE_URL + "/chat");

        // Generate unique message identifier
        String uniqueMessage = "Realtime-Sync-Verify-" + UUID.randomUUID().toString().substring(0, 8);

        // User A locates chat input box, types message, and sends
        WebElement chatInputAlice = wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("textarea, input[placeholder*='message' i], input[type='text']")
        ));

        chatInputAlice.sendKeys(uniqueMessage);
        chatInputAlice.sendKeys(Keys.ENTER);

        // User B's browser session should observe the message in DOM via WebSocket STOMP
        boolean messageReceivedByBob = waitBob.until(d -> {
            return d.getPageSource().contains(uniqueMessage) ||
                    !d.findElements(By.xpath("//*[contains(text(), '" + uniqueMessage + "')]")).isEmpty();
        });

        assertThat(messageReceivedByBob)
                .as("Message sent by Alice should be rendered in Bob's browser in real-time")
                .isTrue();
    }
}
