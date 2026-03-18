package com.kimtan.employeemanagement.repository;

import com.kimtan.employeemanagement.model.entity.ProfileChangeRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileChangeRequestRepository extends JpaRepository<ProfileChangeRequest, Long> {
    List<ProfileChangeRequest> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);
    List<ProfileChangeRequest> findAllByOrderByCreatedAtDesc();
}
