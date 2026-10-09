package com.sdet.framework.utils;

import com.sdet.framework.config.ConfigReader;
import java.sql.*;

public class DBUtils {
    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(
                ConfigReader.get("db.url"),
                ConfigReader.get("db.user"),
                ConfigReader.get("db.password"));
    }

    public static int count(String sql) {
        try (Connection c = getConnection();
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            rs.next();
            return rs.getInt(1);
        } catch (SQLException e) {
            throw new RuntimeException("DB query failed: " + sql, e);
        }
    }
}
