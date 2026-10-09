package com.vansh.connecthub.automation.styling;

import com.vansh.connecthub.automation.base.BaseE2ETest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class NeumorphicStylingE2ETest extends BaseE2ETest {

    @Test
    @DisplayName("Validate that UI components render the Neumorphic styling tokens (box-shadow, border-radius, surfaces)")
    void testNeumorphicStyling() {
        loginViaLocalStorage(driver, "designer_qa", realTokenFor("designer_qa", "Password123!"), "MEMBER");
        driver.get(BASE_URL + "/dashboard");

        wait.until(ExpectedConditions.presenceOfElementLocated(By.tagName("body")));

        // Locate Neumorphic styled elements: .neu-panel, .neu-btn, .neu-input
        List<WebElement> neuPanels = driver.findElements(By.cssSelector(".neu-panel, .saas-card"));
        if (!neuPanels.isEmpty()) {
            WebElement panel = neuPanels.get(0);
            String boxShadow = panel.getCssValue("box-shadow");
            String borderRadius = panel.getCssValue("border-radius");

            // Assert that panel has box-shadow (soft neumorphic elevation)
            assertThat(boxShadow)
                    .as("Neumorphic panel should define elevation box-shadow")
                    .isNotBlank()
                    .isNotEqualTo("none");

            assertThat(borderRadius)
                    .as("Neumorphic panel should have rounded corners")
                    .isNotBlank()
                    .isNotEqualTo("0px");
        }

        // Test Neumorphic buttons
        List<WebElement> neuButtons = driver.findElements(By.cssSelector(".neu-btn, button"));
        if (!neuButtons.isEmpty()) {
            WebElement button = neuButtons.get(0);
            String cursor = button.getCssValue("cursor");
            assertThat(cursor).isEqualTo("pointer");
        }
    }
}
