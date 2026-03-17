package com.kimtan.employeemanagement.repository;

import com.kimtan.employeemanagement.model.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByEmployeeIdOrderByUploadedAtDesc(Long employeeId);
}
