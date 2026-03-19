package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.model.dto.AuditLogDto;
import com.kimtan.employeemanagement.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuditControllerWebMvcTest {

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private MessageSource messageSource;

    private AuditController auditController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        auditController = new AuditController(auditLogService); // Initialize manually
        mockMvc = MockMvcBuilders.standaloneSetup(auditController)
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .build();
    }

    @Test
    void getAllAuditLogs_returnsList() throws Exception {
        AuditLogDto log = AuditLogDto.builder()
                .id(1L)
                .entityType("EMPLOYEE")
                .action("CREATE")
                .changedBy("admin")
                .changedAt(LocalDateTime.now())
                .build();

        when(auditLogService.getAllAuditLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/admin/audit"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("CREATE"));
    }

    @Test
    void getEntityAuditLogs_returnsList() throws Exception {
        AuditLogDto log = AuditLogDto.builder()
                .id(1L)
                .entityType("EMPLOYEE")
                .entityId(10L)
                .action("UPDATE")
                .build();

        when(auditLogService.getAuditLogsForEntity("EMPLOYEE", 10L)).thenReturn(List.of(log));

        mockMvc.perform(get("/api/admin/audit/EMPLOYEE/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("UPDATE"));
    }
}
