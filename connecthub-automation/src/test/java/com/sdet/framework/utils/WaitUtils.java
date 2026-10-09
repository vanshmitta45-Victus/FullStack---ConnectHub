package com.sdet.framework.utils;

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class WaitUtils {
    public static WebElement visible(WebDriver d, By loc, int secs) {
        return new WebDriverWait(d, Duration.ofSeconds(secs))
                .until(ExpectedConditions.visibilityOfElementLocated(loc));
    }

    public static void click(WebDriver d, By loc, int secs) {
        visible(d, loc, secs).click();
    }

    public static byte[] screenshot(WebDriver d) {
        try {
            return ((TakesScreenshot) d).getScreenshotAs(OutputType.BYTES);
        } catch (Exception e) {
            return new byte[0];
        }
    }
}
