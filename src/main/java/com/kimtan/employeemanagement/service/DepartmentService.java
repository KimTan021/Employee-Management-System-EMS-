package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.DepartmentDto;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDto> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDto createDepartment(DepartmentDto dto) {
        if (departmentRepository.findByName(dto.getName()).isPresent()) {
            throw new IllegalArgumentException("Department with name '" + dto.getName() + "' already exists.");
        }

        Department department = new Department();
        department.setName(dto.getName());
        Department saved = departmentRepository.save(department);
        return toDto(saved);
    }

    @Transactional
    public void deleteDepartment(Integer id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        // Validation: Cannot delete if any employees (active or inactive) are assigned
        if (employeeRepository.existsByDepartmentId(id)) {
            boolean hasActive = employeeRepository.existsByDepartmentIdAndActiveTrue(id);
            if (hasActive) {
                throw new IllegalStateException("Cannot delete department '" + department.getName() + "' because it has active employees assigned to it.");
            } else {
                throw new IllegalStateException("Cannot delete department '" + department.getName() + "' because it still has inactive (deactivated) employee records assigned to it. These must be reassigned or resolved before deletion.");
            }
        }
        
        departmentRepository.delete(department);
    }

    private DepartmentDto toDto(Department department) {
        return DepartmentDto.builder()
                .id(department.getId())
                .name(department.getName())
                .employeeCount(employeeRepository.countByDepartmentIdAndActiveTrue(department.getId()))
                .build();
    }
}
