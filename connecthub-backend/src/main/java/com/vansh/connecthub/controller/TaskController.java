package com.vansh.connecthub.controller;

import com.vansh.connecthub.model.AuditLog;
import com.vansh.connecthub.model.Task;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.enums.TaskStatus;
import com.vansh.connecthub.repository.AuditLogRepository;
import com.vansh.connecthub.repository.TaskRepository;
import com.vansh.connecthub.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    // Helper method to record audit log
    private void recordAudit(String log) {
        recordAudit(log, "System", "SYSTEM", "TASK", null, null, null);
    }

    private void recordAudit(String log, String actor, String actionType, String entityType, String entityId, String prev, String next) {
        try {
            AuditLog audit = AuditLog.builder()
                    .actionLog(log)
                    .actor(actor)
                    .actionType(actionType)
                    .entityType(entityType)
                    .entityId(entityId)
                    .previousValue(prev)
                    .newValue(next)
                    .createdAt(java.time.LocalDateTime.now())
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    private String safeJson(String val) {
        if (val == null) return "";
        return val.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }

    private String getActor(Authentication authentication) {
        return (authentication != null && authentication.getName() != null) ? authentication.getName() : "System";
    }

    @GetMapping({"", "/", "/all"})
    public ResponseEntity<List<Task>> getAllTasks(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String project
    ) {
        List<Task> tasks = taskRepository.findAll();

        if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
            tasks = tasks.stream()
                    .filter(t -> t.getStatus() != null && t.getStatus().name().equalsIgnoreCase(status))
                    .toList();
        }

        if (assignee != null && !assignee.isEmpty()) {
            tasks = tasks.stream()
                    .filter(t -> t.getAssignedUser() != null && assignee.equalsIgnoreCase(t.getAssignedUser().getUsername()))
                    .toList();
        }

        if (priority != null && !priority.isEmpty() && !"ALL".equalsIgnoreCase(priority)) {
            tasks = tasks.stream()
                    .filter(t -> t.getPriority() != null && t.getPriority().name().equalsIgnoreCase(priority))
                    .toList();
        }

        if (project != null && !project.isEmpty() && !"ALL".equalsIgnoreCase(project)) {
            tasks = tasks.stream()
                    .filter(t -> t.getProject() != null && t.getProject().equalsIgnoreCase(project))
                    .toList();
        }

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getTasksPaged(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String assignee,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String project,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        List<Task> allFiltered = getAllTasks(status, assignee, priority, project).getBody();
        if (allFiltered == null) allFiltered = Collections.emptyList();

        int start = Math.min(page * size, allFiltered.size());
        int end = Math.min(start + size, allFiltered.size());
        List<Task> pageContent = allFiltered.subList(start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("tasks", pageContent);
        response.put("currentPage", page);
        response.put("totalElements", allFiltered.size());
        response.put("totalPages", (int) Math.ceil((double) allFiltered.size() / size));
        response.put("hasMore", end < allFiltered.size());

        return ResponseEntity.ok(response);
    }

    @PostMapping({"", "/", "/create"})
    public ResponseEntity<?> createTask(@RequestBody Map<String, Object> payload, Authentication authentication) {
        try {
            Task task = new Task();
            task.setTitle((String) payload.get("title"));
            task.setDescription((String) payload.get("description"));

            if (payload.get("status") != null) {
                task.setStatus(TaskStatus.valueOf(((String) payload.get("status")).toUpperCase()));
            } else {
                task.setStatus(TaskStatus.TODO);
            }

            if (payload.get("priority") != null) {
                task.setPriority(com.vansh.connecthub.enums.TaskPriority.valueOf(((String) payload.get("priority")).toUpperCase()));
            }

            if (payload.get("storyPoints") != null) {
                task.setStoryPoints(((Number) payload.get("storyPoints")).intValue());
            }

            if (payload.get("dueDate") != null) {
                task.setDueDate((String) payload.get("dueDate"));
            }

            if (payload.get("labels") != null) {
                task.setLabels((String) payload.get("labels"));
            }

            if (payload.get("project") != null) {
                task.setProject((String) payload.get("project"));
            }

            if (payload.get("linkedChannel") != null) {
                task.setLinkedChannel((String) payload.get("linkedChannel"));
            }

            if (payload.get("subtasks") != null) {
                task.setSubtasks(payload.get("subtasks").toString());
            }

            if (payload.get("comments") != null) {
                task.setComments(payload.get("comments").toString());
            }

            // Map Assigned User
            if (payload.get("assignedUserId") != null) {
                Long uid = ((Number) payload.get("assignedUserId")).longValue();
                userRepository.findById(uid).ifPresent(task::setAssignedUser);
            } else if (payload.get("assignedUsername") != null) {
                String uName = (String) payload.get("assignedUsername");
                userRepository.findByUsername(uName).ifPresent(task::setAssignedUser);
            }

            Task created = taskRepository.save(task);

            String actor = getActor(authentication);
            String actionType = (created.getLinkedChannel() != null && !created.getLinkedChannel().isEmpty()) ? "TASK_FROM_CHAT" : "TASK_CREATED";
            recordAudit("User @" + actor + " created issue TSK-" + created.getId() + " '" + created.getTitle() + "' in " + created.getStatus(),
                    actor, actionType, "TASK", "TSK-" + created.getId(),
                    null,
                    "{\"id\":" + created.getId() + ",\"title\":\"" + safeJson(created.getTitle()) + "\",\"status\":\"" + created.getStatus() + "\",\"priority\":\"" + created.getPriority() + "\",\"project\":\"" + (created.getProject() != null ? created.getProject() : "Core") + "\"}");

            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateTaskStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        try {
            Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
            TaskStatus oldStatus = task.getStatus();
            TaskStatus newStatus = TaskStatus.valueOf(payload.get("status").toUpperCase());
            task.setStatus(newStatus);

            if (newStatus == TaskStatus.BLOCKED) {
                task.setBlocked(true);
                if (payload.get("blockedReason") != null) {
                    task.setBlockedReason(payload.get("blockedReason"));
                }
            } else if (oldStatus == TaskStatus.BLOCKED) {
                task.setBlocked(false);
                task.setBlockedReason(null);
            }

            taskRepository.save(task);

            String actor = getActor(authentication);
            recordAudit("User @" + actor + " moved task TSK-" + task.getId() + " from " + oldStatus + " to " + newStatus,
                    actor, "TASK_STATUS_CHANGED", "TASK", "TSK-" + task.getId(),
                    "{\"status\":\"" + oldStatus + "\"}",
                    "{\"status\":\"" + newStatus + "\"}");

            return ResponseEntity.ok(Map.of("message", "Status updated successfully", "task", task));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTask(
            @PathVariable Long id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication
    ) {
        try {
            Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));

            if (payload.get("title") != null) task.setTitle((String) payload.get("title"));
            if (payload.get("description") != null) task.setDescription((String) payload.get("description"));

            if (payload.get("status") != null) {
                task.setStatus(TaskStatus.valueOf(((String) payload.get("status")).toUpperCase()));
            }

            if (payload.get("priority") != null) {
                task.setPriority(com.vansh.connecthub.enums.TaskPriority.valueOf(((String) payload.get("priority")).toUpperCase()));
            }

            if (payload.get("storyPoints") != null) {
                task.setStoryPoints(((Number) payload.get("storyPoints")).intValue());
            }

            if (payload.get("dueDate") != null) {
                task.setDueDate((String) payload.get("dueDate"));
            }

            if (payload.get("labels") != null) {
                task.setLabels((String) payload.get("labels"));
            }

            if (payload.get("project") != null) {
                task.setProject((String) payload.get("project"));
            }

            if (payload.get("linkedChannel") != null) {
                task.setLinkedChannel((String) payload.get("linkedChannel"));
            }

            if (payload.containsKey("subtasks")) {
                task.setSubtasks(payload.get("subtasks") != null ? payload.get("subtasks").toString() : null);
            }

            if (payload.containsKey("comments")) {
                task.setComments(payload.get("comments") != null ? payload.get("comments").toString() : null);
            }

            if (payload.containsKey("isBlocked")) {
                task.setBlocked(Boolean.TRUE.equals(payload.get("isBlocked")));
            }

            if (payload.containsKey("blockedReason")) {
                task.setBlockedReason((String) payload.get("blockedReason"));
            }

            if (payload.containsKey("assignedUserId")) {
                if (payload.get("assignedUserId") != null) {
                    Long uid = ((Number) payload.get("assignedUserId")).longValue();
                    userRepository.findById(uid).ifPresent(task::setAssignedUser);
                } else {
                    task.setAssignedUser(null);
                }
            } else if (payload.containsKey("assignedUsername")) {
                String uName = (String) payload.get("assignedUsername");
                if (uName != null && !uName.isEmpty()) {
                    userRepository.findByUsername(uName).ifPresent(task::setAssignedUser);
                } else {
                    task.setAssignedUser(null);
                }
            }

            Task saved = taskRepository.save(task);

            String actor = getActor(authentication);
            recordAudit("User @" + actor + " updated details for issue TSK-" + task.getId(),
                    actor, "TASK_UPDATED", "TASK", "TSK-" + task.getId(),
                    null,
                    "{\"id\":" + saved.getId() + ",\"title\":\"" + safeJson(saved.getTitle()) + "\",\"priority\":\"" + saved.getPriority() + "\",\"status\":\"" + saved.getStatus() + "\"}");

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, Authentication authentication) {
        try {
            Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
            
            String actor = getActor(authentication);
            Optional<User> actorUser = userRepository.findByUsername(actor);
            if (actorUser.isPresent()) {
                String role = actorUser.get().getRole();
                if ("VIEWER".equalsIgnoreCase(role)) {
                    return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Access Denied: Viewers cannot delete tasks."));
                }
            }

            taskRepository.deleteById(id);

            recordAudit("User @" + actor + " deleted task TSK-" + id + " '" + task.getTitle() + "'",
                    actor, "TASK_DELETED", "TASK", "TSK-" + id,
                    "{\"id\":" + id + ",\"title\":\"" + safeJson(task.getTitle()) + "\",\"status\":\"" + task.getStatus() + "\"}",
                    "{\"deleted\":true}");

            return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/bulk-delete")
    public ResponseEntity<?> deleteMultipleTasks(@RequestBody List<Long> taskIds, Authentication authentication) {
        try {
            taskRepository.deleteAllById(taskIds);
            String actor = getActor(authentication);
            recordAudit("User @" + actor + " bulk-deleted " + taskIds.size() + " tasks");
            return ResponseEntity.ok(Map.of("message", "Tasks deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}