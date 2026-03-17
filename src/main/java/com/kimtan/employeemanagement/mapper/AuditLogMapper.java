package com.kimtan.employeemanagement.mapper;

import com.kimtan.employeemanagement.model.dto.AuditLogDto;
import com.kimtan.employeemanagement.model.entity.AuditLog;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AuditLogMapper {
    AuditLogDto toDto(AuditLog auditLog);
    List<AuditLogDto> toDtoList(List<AuditLog> auditLogs);
}
