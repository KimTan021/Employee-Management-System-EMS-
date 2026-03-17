package com.kimtan.employeemanagement.repository;

import com.kimtan.employeemanagement.model.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityTypeAndEntityIdOrderByChangedAtDesc(String entityType, Long entityId);
    List<AuditLog> findAllByOrderByChangedAtDesc();
}
