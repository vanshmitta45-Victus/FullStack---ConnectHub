package com.vansh.connecthub.controller;

import com.vansh.connecthub.constant.AppConstants;
import com.vansh.connecthub.model.MessageAttachment;
import com.vansh.connecthub.model.User;
import com.vansh.connecthub.repository.MessageAttachmentRepository;
import com.vansh.connecthub.repository.UserRepository;
import com.vansh.connecthub.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/chat/files")
@CrossOrigin(origins = "http://localhost:5173")
public class FileUploadController {

    @Autowired
    private FileUploadService fileUploadService;

    @Autowired
    private MessageAttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadChatAttachment(@RequestParam("file") MultipartFile file, Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", AppConstants.FILE_NOT_FOUND_MSG));
            }

            Map<String, Object> uploadResult = fileUploadService.uploadFile(file);
            String fileUrl = uploadResult.get("secure_url").toString();
            String fileType = uploadResult.get("resource_type").toString();

            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            MessageAttachment attachment = new MessageAttachment();
            attachment.setFileUrl(fileUrl);
            attachment.setFileType(fileType);
            attachment.setFileName(file.getOriginalFilename());
            attachment.setFileSize(file.getSize());
            attachment.setUploadedBy(user);

            attachmentRepository.save(attachment);

            return ResponseEntity.ok(Map.of(
                    "message", AppConstants.UPLOAD_SUCCESS_MSG,
                    "url", fileUrl,
                    "type", fileType,
                    "attachmentId", attachment.getId()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
}