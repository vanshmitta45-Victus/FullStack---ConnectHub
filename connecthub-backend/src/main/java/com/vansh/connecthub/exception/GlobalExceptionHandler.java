package com.vansh.connecthub.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.context.request.WebRequest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    // Catch File Size Limit Exceeded
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxSizeException(MaxUploadSizeExceededException exc, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.PAYLOAD_TOO_LARGE.value());
        response.put("error", "Payload Too Large");
        response.put("message", "File size exceeds the configured maximum limit (50MB).");
        response.put("path", request.getDescription(false).replace("uri=", ""));

        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
    }

    // Catch General Application Crashes (The Fallback)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(Exception exc, WebRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now());
        response.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        response.put("error", "Internal Server Error");
        response.put("message", exc.getMessage());
        response.put("path", request.getDescription(false).replace("uri=", ""));

        // Log the actual exception trace to your console/logs here for debugging
        exc.printStackTrace();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}