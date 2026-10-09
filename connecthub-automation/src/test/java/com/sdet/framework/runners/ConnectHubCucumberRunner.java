package com.sdet.framework.runners;

import io.cucumber.testng.AbstractTestNGCucumberTests;
import io.cucumber.testng.CucumberOptions;
import org.testng.annotations.DataProvider;

@CucumberOptions(
        features = "src/test/resources/features/connecthub",
        glue = "com.sdet.framework.connecthub",
        plugin = {"pretty", "html:target/cucumber-connecthub.html", "io.qameta.allure.cucumber7jvm.AllureCucumber7Jvm"}
)
public class ConnectHubCucumberRunner extends AbstractTestNGCucumberTests {
    @Override
    @DataProvider(parallel = false)
    public Object[][] scenarios() { return super.scenarios(); }
}
