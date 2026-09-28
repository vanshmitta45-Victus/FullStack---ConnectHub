package com.vansh.connecthub.service;

import com.vansh.connecthub.enums.TaskStatus;
import com.vansh.connecthub.model.Task;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task createTask(Task task) {
        return taskRepository.save(task);
    }

    public Task updateTaskStatus(Long taskId, TaskStatus newStatus, User user) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found!"));

        // FIX: Compare roles as Strings
        boolean isAdmin = "ADMIN".equals(user.getRole()) || "PROJECT_MANAGER".equals(user.getRole());
        boolean isAssignee = task.getAssignedUser() != null && task.getAssignedUser().getId().equals(user.getId());

        if (isAdmin || isAssignee) {
            task.setStatus(newStatus);
            return taskRepository.save(task);
        } else {
            throw new RuntimeException("Access Denied: You are not authorized to update this task!");
        }
    }

    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }
}