package com.sdet.framework.tests;

import com.sdet.framework.api.ConnectHubAuthApi;
import com.sdet.framework.config.ConfigReader;
import com.sdet.framework.pages.ConnectHubLoginPage;
import com.sdet.framework.utils.WaitUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.testng.annotations.Test;

import java.nio.file.Files;
import java.nio.file.Path;

public class DmShotTest extends BaseTest {
    @Test
    public void captureDm() throws Exception {
        String base = ConfigReader.get("base.url");
        String token = new ConnectHubAuthApi().ensureUserToken("vansh", "Password123!");
        new ConnectHubLoginPage(driver).loginWithToken(base, "vansh", token, "MEMBER");
        driver.get(base + "/chat");
        Thread.sleep(3000);
        byte[] a = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
        Files.write(Path.of("dm-list.png"), a);
        System.out.println("SHOT dm-list.png");
        WaitUtils.visible(driver, By.xpath("//button[@title='New direct message']"), 10).click();
        WaitUtils.visible(driver, By.xpath("//input[contains(@placeholder,'Type a name')]"), 10).sendKeys("demo");
        Thread.sleep(1000);
        byte[] b = ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES);
        Files.write(Path.of("dm-modal.png"), b);
        System.out.println("SHOT dm-modal.png");
    }
}
