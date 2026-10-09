package com.sdet.framework.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final Properties props = new Properties();

    static {
        try (InputStream is = ConfigReader.class.getClassLoader().getResourceAsStream("config.properties")) {
            if (is == null) throw new RuntimeException("config.properties not found");
            props.load(is);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load config", e);
        }
    }

    public static String get(String key) {
        // -Dkey=value (CI) wins over config.properties (local dev)
        String sys = System.getProperty(key);
        if (sys != null && !sys.isEmpty()) return sys;
        return props.getProperty(key);
    }

    public static String get(String key, String def) {
        String sys = System.getProperty(key);
        if (sys != null && !sys.isEmpty()) return sys;
        return props.getProperty(key, def);
    }
}
