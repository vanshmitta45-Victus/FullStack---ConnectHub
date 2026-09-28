package com.vansh.connecthub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class FileUploadService {

    @Autowired
    private Cloudinary cloudinary;

    public Map<String, Object> uploadFile(MultipartFile file) throws IOException {
        // We set "auto" so Cloudinary automatically handles images, videos, or raw files (like PDFs)
        return cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "resource_type", "auto",
                "folder", "nexus_chat_uploads"
        ));
    }
}