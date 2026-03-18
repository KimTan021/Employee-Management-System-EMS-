package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.model.dto.DocumentDto;
import com.kimtan.employeemanagement.service.DocumentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DocumentControllerWebMvcTest {

    @Mock
    private DocumentService documentService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DocumentController(documentService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void uploadFile_returnsDocumentDto() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", MediaType.APPLICATION_PDF_VALUE, "content".getBytes());
        DocumentDto response = DocumentDto.builder()
                .id(1L)
                .fileName("test.pdf")
                .fileType(MediaType.APPLICATION_PDF_VALUE)
                .uploadedBy("admin")
                .uploadedAt(LocalDateTime.now())
                .build();

        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("admin");

        when(documentService.uploadFile(eq(10L), eq(file), eq("admin"))).thenReturn(response);

        mockMvc.perform(multipart("/api/admin/documents/10")
                        .file(file)
                        .principal(auth))
                .andExpect(status().isOk());
    }

    @Test
    void getEmployeeDocuments_returnsList() throws Exception {
        DocumentDto doc = DocumentDto.builder().id(1L).fileName("report.docx").build();
        when(documentService.getDocumentsByEmployee(10L)).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/admin/documents/employee/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fileName").value("report.docx"));
    }

    @Test
    void downloadFile_returnsResource() throws Exception {
        Resource resource = new ByteArrayResource("content".getBytes()) {
            @Override
            public String getFilename() { return "test.txt"; }
        };
        when(documentService.loadFileAsResource(1L)).thenReturn(resource);

        mockMvc.perform(get("/api/admin/documents/download/1"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"test.txt\""));
    }

    @Test
    void deleteDocument_returnsNoContent() throws Exception {
        Authentication auth = mock(Authentication.class);
        
        mockMvc.perform(delete("/api/admin/documents/1")
                        .principal(auth))
                .andExpect(status().isNoContent());
    }
}
