package com.kimtan.employeemanagement.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.ProfileChangeRequestDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.ProfileChangeRequest;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.ProfileChangeRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileChangeRequestService {

    private final ProfileChangeRequestRepository repository;
    private final EmployeeRepository employeeRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public ProfileChangeRequestDto submitRequest(Long employeeId, ProfileChangeRequestDto dto) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        ProfileChangeRequest request = ProfileChangeRequest.builder()
                .employee(employee)
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactPhone(dto.getEmergencyContactPhone())
                .status("PENDING")
                .build();

        ProfileChangeRequest saved = repository.save(request);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ProfileChangeRequestDto> getRequestsForEmployee(Long employeeId) {
        return repository.findByEmployeeIdOrderByCreatedAtDesc(employeeId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProfileChangeRequestDto> getAllRequests() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProfileChangeRequestDto updateStatus(Long requestId, String status) {
        ProfileChangeRequest request = repository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile change request not found with id: " + requestId));

        request.setStatus(status);
        ProfileChangeRequest updated = repository.save(request);

        if ("APPROVED".equals(status)) {
            Employee employee = request.getEmployee();
            String oldValue = null;
            try {
                oldValue = objectMapper.writeValueAsString(Map.of(
                        "phone", employee.getPhone(),
                        "address", employee.getAddress(),
                        "emergencyContactName", employee.getEmergencyContactName(),
                        "emergencyContactPhone", employee.getEmergencyContactPhone()
                ));
            } catch (Exception e) {}

            employee.setPhone(request.getPhone());
            employee.setAddress(request.getAddress());
            employee.setEmergencyContactName(request.getEmergencyContactName());
            employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
            employeeRepository.save(employee);

            try {
                String newValue = objectMapper.writeValueAsString(Map.of(
                        "phone", employee.getPhone(),
                        "address", employee.getAddress(),
                        "emergencyContactName", employee.getEmergencyContactName(),
                        "emergencyContactPhone", employee.getEmergencyContactPhone()
                ));
                auditLogService.logAction("EMPLOYEE_PROFILE", employee.getId(), "UPDATE", oldValue, newValue, getCurrentUsername());
            } catch (Exception e) {}
        }

        return toDto(updated);
    }

    private ProfileChangeRequestDto toDto(ProfileChangeRequest request) {
        ProfileChangeRequestDto dto = new ProfileChangeRequestDto();
        dto.setId(request.getId());
        dto.setEmployeeId(request.getEmployee().getId());
        dto.setEmployeeName(request.getEmployee().getFirstName() + " " + request.getEmployee().getLastName());
        dto.setPhone(request.getPhone());
        dto.setAddress(request.getAddress());
        dto.setEmergencyContactName(request.getEmergencyContactName());
        dto.setEmergencyContactPhone(request.getEmergencyContactPhone());
        dto.setStatus(request.getStatus());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setUpdatedAt(request.getUpdatedAt());
        return dto;
    }

    private String getCurrentUsername() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return "SYSTEM";
    }
}
