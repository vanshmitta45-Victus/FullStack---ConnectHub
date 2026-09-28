package com.vansh.connecthub.constant;

public final class AppConstants {

    // Private constructor prevents anyone from creating an instance of this class
    private AppConstants() {}

    // --- API ENDPOINTS ---
    public static final String AUTH_API = "/api/auth";
    public static final String USER_API = "/api/users";
    public static final String CHAT_API = "/api/chat";
    public static final String TASK_API = "/api/tasks";
    public static final String WS_ENDPOINT = "/ws";

    // --- DEFAULT SETTINGS ---
    public static final String DEFAULT_ROLE = "EMPLOYEE"; // Aligned with your UserRole enum
    public static final long JWT_EXPIRATION_MS = 86400000; // 24 Hours

    // --- CHAT & FILE UPLOAD CONSTANTS ---
    public static final long MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
    public static final String UPLOAD_SUCCESS_MSG = "File saved to cloud and database successfully";
    public static final String FILE_NOT_FOUND_MSG = "No file selected or file is empty";
    public static final String GROUP_CREATE_SUCCESS = "Group created successfully";
    public static final String GROUP_EXISTS_ERROR = "A group with this name already exists.";
    public static final String UNAUTHORIZED_GROUP_ADMIN = "Unauthorized: Only the group creator can add members.";
}