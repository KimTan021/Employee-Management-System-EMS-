package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.DocumentMapper;
import com.kimtan.employeemanagement.model.dto.DocumentDto;
import com.kimtan.employeemanagement.model.entity.Document;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.repository.DocumentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final EmployeeRepository employeeRepository;
    private final DocumentMapper documentMapper;
    private final AuditLogService auditLogService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @Value("${upload.directory:uploads}")
    private String uploadDirectory;

    @Transactional
    public DocumentDto uploadFile(Long employeeId, MultipartFile file, String uploadedBy) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown.file");
        String uniqueFilename = UUID.randomUUID().toString() + "_" + originalFilename;
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "application/octet-stream";
        }

        try {
            Path uploadPath = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            Path targetLocation = uploadPath.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Document document = Document.builder()
                    .employee(employee)
                    .fileName(originalFilename)
                    .fileType(contentType)
                    .filePath(uniqueFilename)
                    .uploadedBy(uploadedBy)
                    .build();

            Document savedDocument = documentRepository.save(document);
            
            try {
                String newValue = objectMapper.writeValueAsString(originalFilename);
                auditLogService.logAction("DOCUMENT", savedDocument.getId(), "CREATE", null, newValue, uploadedBy);
            } catch (Exception e) {
                // Log silently as per other services
            }

            return documentMapper.toDto(savedDocument);

        } catch (IOException e) {
            throw new RuntimeException("Could not store file " + originalFilename + ". Please try again!", e);
        }
    }

    @Transactional(readOnly = true)
    public List<DocumentDto> getDocumentsByEmployee(Long employeeId) {
        return documentMapper.toDtoList(documentRepository.findByEmployeeIdOrderByUploadedAtDesc(employeeId));
    }

    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long documentId) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        try {
            Path fileStorageLocation = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Path filePath = fileStorageLocation.resolve(document.getFilePath()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("File not found: " + document.getFileName());
            }
        } catch (MalformedURLException ex) {
            throw new ResourceNotFoundException("File not found: " + document.getFileName());
        }
    }

    @Transactional
    public void deleteDocument(Long documentId, org.springframework.security.core.Authentication authentication) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        try {
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            String username = authentication.getName();

            if (!isAdmin && !document.getUploadedBy().equals(username)) {
                throw new org.springframework.security.access.AccessDeniedException("You do not have permission to delete this document");
            }

            Path fileStorageLocation = Paths.get(uploadDirectory).toAbsolutePath().normalize();
            Path filePath = fileStorageLocation.resolve(document.getFilePath()).normalize();
            Files.deleteIfExists(filePath);
            
            try {
                String oldValue = objectMapper.writeValueAsString(document.getFileName());
                auditLogService.logAction("DOCUMENT", document.getId(), "DELETE", oldValue, null, username);
            } catch (Exception e) {
                // Log silently
            }

            documentRepository.delete(document);
        } catch (IOException ex) {
            throw new RuntimeException("Could not delete file " + document.getFileName() + ". Please try again!", ex);
        }
    }
}
