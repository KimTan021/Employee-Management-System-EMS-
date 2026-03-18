package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.DocumentMapper;
import com.kimtan.employeemanagement.model.dto.DocumentDto;
import com.kimtan.employeemanagement.model.entity.Document;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.repository.DocumentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DocumentMapper documentMapper;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private DocumentService documentService;

    @TempDir
    Path tempDir;

    private Employee employee;
    private Document document;
    private DocumentDto documentDto;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(documentService, "uploadDirectory", tempDir.toString());

        employee = new Employee();
        employee.setId(1L);

        document = Document.builder()
                .id(1L)
                .employee(employee)
                .fileName("test.txt")
                .filePath("unique_test.txt")
                .uploadedBy("admin")
                .build();

        documentDto = DocumentDto.builder()
                .id(1L)
                .fileName("test.txt")
                .build();
    }

    @Test
    void uploadFile_success() throws IOException {
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());
        
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(documentRepository.save(any(Document.class))).thenReturn(document);
        when(documentMapper.toDto(any(Document.class))).thenReturn(documentDto);

        DocumentDto result = documentService.uploadFile(1L, file, "admin");

        assertThat(result).isNotNull();
        assertThat(result.getFileName()).isEqualTo("test.txt");
        verify(documentRepository).save(any(Document.class));
        verify(auditLogService).logAction(eq("DOCUMENT"), any(), eq("CREATE"), any(), any(), eq("admin"));
        
        // Verify file exists in temp dir
        long count = Files.list(tempDir).count();
        assertThat(count).isEqualTo(1);
    }

    @Test
    void uploadFile_emptyFile_throwsException() {
        MockMultipartFile file = new MockMultipartFile("file", "", "text/plain", new byte[0]);
        
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> documentService.uploadFile(1L, file, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot upload an empty file");
    }

    @Test
    void deleteDocument_asAdmin_success() throws IOException {
        Path filePath = tempDir.resolve("unique_test.txt");
        Files.createFile(filePath);
        
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(auth).getAuthorities();
        when(auth.getName()).thenReturn("admin");

        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

        documentService.deleteDocument(1L, auth);

        verify(documentRepository).delete(document);
        assertThat(Files.exists(filePath)).isFalse();
    }

    @Test
    void deleteDocument_unauthorized_throwsException() {
        Authentication auth = mock(Authentication.class);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"))).when(auth).getAuthorities();
        when(auth.getName()).thenReturn("other_user");

        when(documentRepository.findById(1L)).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> documentService.deleteDocument(1L, auth))
                .isInstanceOf(AccessDeniedException.class);
    }
}
