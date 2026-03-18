package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.mapper.AuditLogMapper;
import com.kimtan.employeemanagement.model.dto.AuditLogDto;
import com.kimtan.employeemanagement.model.entity.AuditLog;
import com.kimtan.employeemanagement.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogMapper auditLogMapper;

    @InjectMocks
    private AuditLogService auditLogService;

    private AuditLog auditLog;
    private AuditLogDto auditLogDto;

    @BeforeEach
    void setUp() {
        auditLog = AuditLog.builder()
                .id(1L)
                .entityType("EMPLOYEE")
                .entityId(10L)
                .action("UPDATE")
                .changedBy("admin")
                .build();

        auditLogDto = AuditLogDto.builder()
                .id(1L)
                .entityType("EMPLOYEE")
                .action("UPDATE")
                .build();
    }

    @Test
    void logAction_savesAuditLog() {
        auditLogService.logAction("EMPLOYEE", 10L, "UPDATE", "old", "new", "admin");

        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void getAllAuditLogs_returnsList() {
        when(auditLogRepository.findAllByOrderByChangedAtDesc()).thenReturn(List.of(auditLog));
        when(auditLogMapper.toDtoList(anyList())).thenReturn(List.of(auditLogDto));

        List<AuditLogDto> result = auditLogService.getAllAuditLogs();

        assertThat(result).hasSize(1);
        verify(auditLogRepository).findAllByOrderByChangedAtDesc();
    }
}
