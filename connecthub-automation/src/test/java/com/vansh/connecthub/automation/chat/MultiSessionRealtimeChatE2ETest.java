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
        loginViaLocalStorage(driverAlice, "alice_qa", realTokenFor("alice_qa", "Password123!"), "MEMBER");
        driverAlice.get(BASE_URL + "/chat");

        // Session 2: User B (Bob) in completely separate browser instance
        WebDriver driverBob = createNewDriver();
        loginViaLocalStorage(driverBob, "bob_qa", realTokenFor("bob_qa", "Password123!"), "MEMBER");
        driverBob.get(BASE_URL + "/chat");

        // Generate unique message identifier
        String uniqueMessage = "Realtime-Sync-Verify-" + UUID.randomUUID().toString().substring(0, 8);

        // Send with retry: stompClient.sendMessage() silently drops when the WS
        // handshake is still in flight, so repeat until Alice's own echo proves delivery
        WebDriverWait shortWait = new WebDriverWait(driverAlice, Duration.ofSeconds(5));
        boolean aliceEcho = false;
        for (int attempt = 0; attempt < 3 && !aliceEcho; attempt++) {
            WebElement chatInputAlice = wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.cssSelector("input[placeholder^='Message']")
            ));
            chatInputAlice.sendKeys(org.openqa.selenium.Keys.chord(org.openqa.selenium.Keys.CONTROL, "a"));
            chatInputAlice.sendKeys(org.openqa.selenium.Keys.DELETE);
            chatInputAlice.sendKeys(uniqueMessage);
            chatInputAlice.sendKeys(Keys.ENTER);
            try {
                aliceEcho = shortWait.until(d -> d.getPageSource().contains(uniqueMessage));
            } catch (org.openqa.selenium.TimeoutException ignored) {
                // WS not ready yet - retry
            }
        }
        // TEMP-DEBUG: browser console capture enabled in BaseE2ETest (goog:loggingPrefs).
        // To diagnose WS issues, dump driverAlice.manage().logs().get("browser") here.
        assertThat(aliceEcho)
                .as("Alice should see her own message echoed back via WebSocket (proves send path)")
                .isTrue();

        // User B's browser session should observe the message in DOM via WebSocket STOMP
        WebDriverWait waitBobLong = new WebDriverWait(driverBob, Duration.ofSeconds(20));
        boolean messageReceivedByBob = waitBobLong.until(d -> {
            return d.getPageSource().contains(uniqueMessage) ||
                    !d.findElements(By.xpath("//*[contains(text(), '" + uniqueMessage + "')]")).isEmpty();
        });

        assertThat(messageReceivedByBob)
                .as("Message sent by Alice should be rendered in Bob's browser in real-time")
                .isTrue();
    }
}
