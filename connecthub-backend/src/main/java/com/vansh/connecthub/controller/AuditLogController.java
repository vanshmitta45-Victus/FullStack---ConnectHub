package com.vansh.connecthub.controller;

import com.vansh.connecthub.model.AuditLog;
import com.vansh.connecthub.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/audit", "/api/audit-logs"})
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost", "http://localhost:80"})
public class AuditLogController {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @GetMapping({"", "/", "/all"})
    public ResponseEntity<List<AuditLog>> getLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String timeRange,
            @RequestParam(required = false) String search
    ) {
        List<AuditLog> logs = auditLogRepository.findAll();

        if (entityType != null && !entityType.isEmpty() && !"ALL".equalsIgnoreCase(entityType)) {
            logs = logs.stream()
                    .filter(l -> l.getEntityType() != null && l.getEntityType().equalsIgnoreCase(entityType))
                    .toList();
        }

        if (actionType != null && !actionType.isEmpty() && !"ALL".equalsIgnoreCase(actionType)) {
            logs = logs.stream()
                    .filter(l -> l.getActionType() != null && l.getActionType().equalsIgnoreCase(actionType))
                    .toList();
        }

        if (actor != null && !actor.isEmpty() && !"ALL".equalsIgnoreCase(actor)) {
            logs = logs.stream()
                    .filter(l -> l.getActor() != null && l.getActor().equalsIgnoreCase(actor))
                    .toList();
        }

        if (timeRange != null && !timeRange.isEmpty() && !"ALL".equalsIgnoreCase(timeRange)) {
            LocalDateTime now = LocalDateTime.now();
            if ("TODAY".equalsIgnoreCase(timeRange)) {
                LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
                logs = logs.stream()
                        .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(startOfDay))
                        .toList();
            } else if ("WEEK".equalsIgnoreCase(timeRange) || "LAST_7_DAYS".equalsIgnoreCase(timeRange)) {
                LocalDateTime sevenDaysAgo = now.minusDays(7);
                logs = logs.stream()
                        .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(sevenDaysAgo))
                        .toList();
            } else if ("MONTH".equalsIgnoreCase(timeRange) || "LAST_30_DAYS".equalsIgnoreCase(timeRange)) {
                LocalDateTime thirtyDaysAgo = now.minusDays(30);
                logs = logs.stream()
                        .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isAfter(thirtyDaysAgo))
                        .toList();
            }
        }

        if (search != null && !search.trim().isEmpty()) {
            String query = search.trim().toLowerCase();
            logs = logs.stream()
                    .filter(l -> (l.getActionLog() != null && l.getActionLog().toLowerCase().contains(query)) ||
                                 (l.getActor() != null && l.getActor().toLowerCase().contains(query)) ||
                                 (l.getEntityId() != null && l.getEntityId().toLowerCase().contains(query)) ||
                                 (l.getActionType() != null && l.getActionType().toLowerCase().contains(query)))
                    .toList();
        }

        return ResponseEntity.ok(logs);
    }

    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getLogsPaged(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String actionType,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String timeRange,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        List<AuditLog> allFiltered = getLogs(entityType, actionType, actor, timeRange, search).getBody();
        if (allFiltered == null) allFiltered = java.util.Collections.emptyList();

        int start = Math.min(page * size, allFiltered.size());
        int end = Math.min(start + size, allFiltered.size());
        List<AuditLog> pageContent = allFiltered.subList(start, end);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("logs", pageContent);
        response.put("currentPage", page);
        response.put("totalElements", allFiltered.size());
        response.put("totalPages", (int) Math.ceil((double) allFiltered.size() / size));
        response.put("hasMore", end < allFiltered.size());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/record")
    public ResponseEntity<?> recordLog(@RequestBody Map<String, Object> payload, Authentication authentication) {
        String actor = (authentication != null && authentication.getName() != null) ? authentication.getName() : "System";
        if (payload.containsKey("actor") && payload.get("actor") != null) {
            actor = (String) payload.get("actor");
        }

        AuditLog log = AuditLog.builder()
                .actionLog((String) payload.getOrDefault("actionLog", "System event recorded"))
                .actor(actor)
                .actionType((String) payload.getOrDefault("actionType", "SYSTEM"))
                .entityType((String) payload.getOrDefault("entityType", "GENERAL"))
                .entityId((String) payload.get("entityId"))
                .previousValue((String) payload.get("previousValue"))
                .newValue((String) payload.get("newValue"))
                .createdAt(LocalDateTime.now())
                .build();

        AuditLog saved = auditLogRepository.save(log);
        return ResponseEntity.ok(saved);
    }

    @PostMapping("/create")
    public ResponseEntity<?> createLog(@RequestBody Map<String, String> payload) {
        AuditLog log = new AuditLog();
        log.setActionLog(payload.get("log"));
        auditLogRepository.save(log);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/bulk-delete")
    public ResponseEntity<?> deleteLogs(@RequestBody List<Long> ids) {
        auditLogRepository.deleteAllById(ids);
        return ResponseEntity.ok().build();
    }
}