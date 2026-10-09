package com.sdet.framework.tests;

import com.sdet.framework.driver.DriverFactory;
import org.openqa.selenium.WebDriver;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

public class BaseTest {
    protected WebDriver driver;

    @BeforeMethod
    public void setUp() { driver = DriverFactory.getDriver(); }

    @AfterMethod
    public void tearDown() { DriverFactory.quitDriver(); }
}
