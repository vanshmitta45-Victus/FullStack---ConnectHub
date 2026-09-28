package com.vansh.connecthub.utils;

public interface AppConstants {
    // Roles
    String ROLE_ADMIN = "ADMIN";
    String ROLE_MANAGER = "MANAGER";
    String ROLE_TEAM_LEADER = "TEAM_LEADER";
    String ROLE_EMPLOYEE = "EMPLOYEE";

    // File Uploads
    long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
    String UPLOAD_SUCCESS_MSG = "File uploaded successfully.";
    String UPLOAD_ERROR_MSG = "Failed to upload file.";

    // Pagination & Defaults
    String DEFAULT_PAGE_NUMBER = "0";
    String DEFAULT_PAGE_SIZE = "10";
    String DEFAULT_SORT_BY = "id";
    String DEFAULT_SORT_DIRECTION = "asc";

    // Group Limits
    int MAX_GROUP_MEMBERS = 250;
}