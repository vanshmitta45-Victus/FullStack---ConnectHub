package com.sdet.framework.driver;

import com.sdet.framework.config.ConfigReader;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.RemoteWebDriver;

import java.net.URL;
import java.time.Duration;

public class DriverFactory {
    private static final ThreadLocal<WebDriver> driver = new ThreadLocal<>();

    public static WebDriver getDriver() {
        if (driver.get() == null) {
            driver.set(createDriver());
        }
        return driver.get();
    }

    private static WebDriver createDriver() {
        String browser = ConfigReader.get("browser", "chrome");
        boolean headless = Boolean.parseBoolean(ConfigReader.get("headless", "false"));
        boolean grid = Boolean.parseBoolean(ConfigReader.get("grid.enabled", "false"));
        int timeout = Integer.parseInt(ConfigReader.get("timeout.seconds", "10"));

        try {
            if (grid) {
                URL hub = new URL(ConfigReader.get("grid.url"));
                if (browser.equalsIgnoreCase("firefox")) {
                    FirefoxOptions o = new FirefoxOptions();
                    if (headless) o.addArguments("-headless");
                    o.addArguments("--width=1920", "--height=1080");
                    RemoteWebDriver rd = new RemoteWebDriver(hub, o);
                    rd.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeout));
                    setViewport(rd);
                    return rd;
                }
                ChromeOptions o = new ChromeOptions();
                if (headless) o.addArguments("--headless=new");
                o.addArguments("--no-sandbox", "--disable-dev-shm-usage");
                o.addArguments("--window-size=1920,1080");
                o.addArguments("--disable-features=AsyncDns");
                RemoteWebDriver rd = new RemoteWebDriver(hub, o);
                rd.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeout));
                setViewport(rd);
                return rd;
            }
            if (browser.equalsIgnoreCase("firefox")) {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions o = new FirefoxOptions();
                if (headless) o.addArguments("-headless");
                o.addArguments("--width=1920", "--height=1080");
                FirefoxDriver fd = new FirefoxDriver(o);
                fd.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeout));
                setViewport(fd);
                return fd;
            }
            WebDriverManager.chromedriver().setup();
            ChromeOptions o = new ChromeOptions();
            if (headless) o.addArguments("--headless=new");
            // Headless viewport defaults to ~800x600, hiding below-fold content from
            // visibility checks (ConnectHub Kanban cards render below y=439). Force desktop size.
            o.addArguments("--window-size=1920,1080");
            // Grid containers: force the system resolver so container /etc/hosts
            // (host.docker.internal) is honoured instead of Secure DNS.
            o.addArguments("--disable-features=AsyncDns");
            ChromeDriver cd = new ChromeDriver(o);
            cd.manage().timeouts().implicitlyWait(Duration.ofSeconds(timeout));
            setViewport(cd);
            return cd;
        } catch (Exception e) {
            throw new RuntimeException("Driver creation failed", e);
        }
    }

    public static void quitDriver() {
        if (driver.get() != null) {
            driver.get().quit();
            driver.remove();
        }
    }

    private static void setViewport(WebDriver d) {
        try {
            d.manage().window().setSize(new org.openqa.selenium.Dimension(1920, 1080));
        } catch (Exception ignored) {
            try { d.manage().window().maximize(); } catch (Exception ignored2) {}
        }
    }
}
