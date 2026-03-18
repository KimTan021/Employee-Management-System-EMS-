package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.ProfileChangeRequestDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.ProfileChangeRequest;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.ProfileChangeRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileChangeRequestServiceTest {

    @Mock
    private ProfileChangeRequestRepository repository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private ProfileChangeRequestService profileChangeRequestService;

    private Employee employee;
    private ProfileChangeRequest request;
    private ProfileChangeRequestDto dto;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(1L);
        employee.setFirstName("John");
        employee.setLastName("Doe");
        employee.setPhone("12345678");
        employee.setAddress("Old Address");

        request = ProfileChangeRequest.builder()
                .id(1L)
                .employee(employee)
                .phone("87654321")
                .address("New Address")
                .emergencyContactName("Jane")
                .emergencyContactPhone("99999999")
                .status("PENDING")
                .build();

        dto = new ProfileChangeRequestDto();
        dto.setPhone("87654321");
        dto.setAddress("New Address");
        dto.setEmergencyContactName("Jane");
        dto.setEmergencyContactPhone("99999999");
    }

    @Test
    void submitRequest_success() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(repository.save(any(ProfileChangeRequest.class))).thenReturn(request);

        ProfileChangeRequestDto result = profileChangeRequestService.submitRequest(1L, dto);

        assertThat(result.getStatus()).isEqualTo("PENDING");
        assertThat(result.getPhone()).isEqualTo("87654321");
        verify(repository).save(any(ProfileChangeRequest.class));
    }

    @Test
    void updateStatus_approved_updatesEmployeeAndLogs() {
        when(repository.findById(1L)).thenReturn(Optional.of(request));
        when(repository.save(any(ProfileChangeRequest.class))).thenReturn(request);

        profileChangeRequestService.updateStatus(1L, "APPROVED");

        assertThat(employee.getPhone()).isEqualTo("87654321");
        assertThat(employee.getAddress()).isEqualTo("New Address");
        assertThat(request.getStatus()).isEqualTo("APPROVED");
        verify(employeeRepository).save(employee);
        verify(auditLogService).logAction(eq("EMPLOYEE_PROFILE"), eq(1L), eq("UPDATE"), any(), any(), any());
    }
}
