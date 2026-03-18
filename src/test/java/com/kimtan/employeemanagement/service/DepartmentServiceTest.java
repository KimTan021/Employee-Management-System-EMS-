package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.DepartmentDto;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private DepartmentService departmentService;

    private Department department;
    private DepartmentDto dto;

    @BeforeEach
    void setUp() {
        department = new Department();
        department.setId(1);
        department.setName("IT");

        dto = DepartmentDto.builder()
                .id(1)
                .name("IT")
                .build();
    }

    @Test
    void createDepartment_success() {
        when(departmentRepository.findByName("IT")).thenReturn(Optional.empty());
        when(departmentRepository.save(any(Department.class))).thenReturn(department);

        DepartmentDto result = departmentService.createDepartment(dto);

        assertThat(result.getName()).isEqualTo("IT");
        verify(departmentRepository).save(any(Department.class));
    }

    @Test
    void createDepartment_duplicateName_throwsException() {
        when(departmentRepository.findByName("IT")).thenReturn(Optional.of(department));

        assertThatThrownBy(() -> departmentService.createDepartment(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Department with name 'IT' already exists");
    }

    @Test
    void deleteDepartment_success() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(employeeRepository.existsByDepartmentId(1)).thenReturn(false);

        departmentService.deleteDepartment(1);

        verify(departmentRepository).delete(department);
    }

    @Test
    void deleteDepartment_hasActiveEmployees_throwsException() {
        when(departmentRepository.findById(1)).thenReturn(Optional.of(department));
        when(employeeRepository.existsByDepartmentId(1)).thenReturn(true);
        when(employeeRepository.existsByDepartmentIdAndActiveTrue(1)).thenReturn(true);

        assertThatThrownBy(() -> departmentService.deleteDepartment(1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("it has active employees assigned to it");
    }
}
