package com.vansh.connecthub.service;

import com.vansh.connecthub.enums.TaskPriority;
import com.vansh.connecthub.enums.TaskStatus;
import com.vansh.connecthub.model.Task;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    private User assignee;
    private User admin;
    private User projectManager;
    private User unauthorizedMember;
    private Task sampleTask;

    @BeforeEach
    void setUp() {
        assignee = User.builder().id(10L).username("developer").role("MEMBER").build();
        admin = User.builder().id(1L).username("admin").role("ADMIN").build();
        projectManager = User.builder().id(2L).username("pm").role("PROJECT_MANAGER").build();
        unauthorizedMember = User.builder().id(99L).username("intruder").role("MEMBER").build();

        sampleTask = new Task();
        sampleTask.setId(100L);
        sampleTask.setTitle("Implement WebSocket Authorization");
        sampleTask.setDescription("Secure STOMP channels");
        sampleTask.setStatus(TaskStatus.TODO);
        sampleTask.setPriority(TaskPriority.HIGH);
        sampleTask.setAssignedUser(assignee);
    }

    @Test
    @DisplayName("Should return all tasks")
    void testGetAllTasks() {
        when(taskRepository.findAll()).thenReturn(Arrays.asList(sampleTask));

        List<Task> tasks = taskService.getAllTasks();

        assertNotNull(tasks);
        assertEquals(1, tasks.size());
        assertEquals("Implement WebSocket Authorization", tasks.get(0).getTitle());
        verify(taskRepository, times(1)).findAll();
    }

    @Test
    @DisplayName("Should create and save a new task")
    void testCreateTask() {
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        Task created = taskService.createTask(sampleTask);

        assertNotNull(created);
        assertEquals(sampleTask.getId(), created.getId());
        verify(taskRepository, times(1)).save(sampleTask);
    }

    @Test
    @DisplayName("Assignee should successfully update task status")
    void testUpdateTaskStatus_ByAssignee_Success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Task updated = taskService.updateTaskStatus(100L, TaskStatus.IN_PROGRESS, assignee);

        assertNotNull(updated);
        assertEquals(TaskStatus.IN_PROGRESS, updated.getStatus());
        verify(taskRepository, times(1)).save(sampleTask);
    }

    @Test
    @DisplayName("Admin should successfully update any task status")
    void testUpdateTaskStatus_ByAdmin_Success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Task updated = taskService.updateTaskStatus(100L, TaskStatus.DONE, admin);

        assertNotNull(updated);
        assertEquals(TaskStatus.DONE, updated.getStatus());
        verify(taskRepository, times(1)).save(sampleTask);
    }

    @Test
    @DisplayName("Project Manager should successfully update any task status")
    void testUpdateTaskStatus_ByProjectManager_Success() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Task updated = taskService.updateTaskStatus(100L, TaskStatus.IN_REVIEW, projectManager);

        assertNotNull(updated);
        assertEquals(TaskStatus.IN_REVIEW, updated.getStatus());
        verify(taskRepository, times(1)).save(sampleTask);
    }

    @Test
    @DisplayName("Unauthorized member attempting to update another's task should be denied")
    void testUpdateTaskStatus_ByUnauthorizedUser_ThrowsAccessDenied() {
        when(taskRepository.findById(100L)).thenReturn(Optional.of(sampleTask));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.updateTaskStatus(100L, TaskStatus.DONE, unauthorizedMember)
        );

        assertTrue(exception.getMessage().contains("Access Denied"));
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Updating a non-existent task should throw Task Not Found")
    void testUpdateTaskStatus_TaskNotFound() {
        when(taskRepository.findById(999L)).thenReturn(Optional.empty());

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                taskService.updateTaskStatus(999L, TaskStatus.DONE, admin)
        );

        assertEquals("Task not found!", exception.getMessage());
        verify(taskRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should delete task by ID")
    void testDeleteTask() {
        doNothing().when(taskRepository).deleteById(100L);

        taskService.deleteTask(100L);

        verify(taskRepository, times(1)).deleteById(100L);
    }
}
