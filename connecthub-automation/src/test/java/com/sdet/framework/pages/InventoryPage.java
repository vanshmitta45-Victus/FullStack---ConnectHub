package com.sdet.framework.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class InventoryPage {
    private final WebDriver driver;
    private final By title = By.className("title");
    private final By items = By.className("inventory_item");

    public InventoryPage(WebDriver driver) { this.driver = driver; }

    public boolean isLoaded() {
        try { return driver.findElement(title).getText().contains("Products"); }
        catch (Exception e) { return false; }
    }

    public int itemCount() { return driver.findElements(items).size(); }
}
