package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.mapper.AuditLogMapper;
import com.kimtan.employeemanagement.model.dto.AuditLogDto;
import com.kimtan.employeemanagement.model.entity.AuditLog;
import com.kimtan.employeemanagement.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final AuditLogMapper auditLogMapper;

    @Transactional
    public void logAction(String entityType, Long entityId, String action, String oldValue, String newValue, String changedBy) {
        AuditLog auditLog = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .oldValue(oldValue)
                .newValue(newValue)
                .changedBy(changedBy)
                .build();
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogsForEntity(String entityType, Long entityId) {
        return auditLogMapper.toDtoList(auditLogRepository.findByEntityTypeAndEntityIdOrderByChangedAtDesc(entityType, entityId));
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAllAuditLogs() {
        return auditLogMapper.toDtoList(auditLogRepository.findAllByOrderByChangedAtDesc());
    }
}
