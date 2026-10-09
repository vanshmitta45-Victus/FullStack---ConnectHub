package com.sdet.framework.listeners;

import com.sdet.framework.driver.DriverFactory;
import com.sdet.framework.utils.WaitUtils;
import io.qameta.allure.Allure;
import org.testng.ITestListener;
import org.testng.ITestResult;

import java.io.ByteArrayInputStream;

public class TestListener implements ITestListener {
    @Override
    public void onTestFailure(ITestResult result) {
        try {
            byte[] shot = WaitUtils.screenshot(DriverFactory.getDriver());
            if (shot.length > 0) {
                Allure.addAttachment("Failure screenshot", new ByteArrayInputStream(shot));
            }
        } catch (Exception ignored) {}
    }
}
