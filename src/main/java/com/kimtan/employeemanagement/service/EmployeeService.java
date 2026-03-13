package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.EmployeeMapper;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmployeeService implements EmployeeProcessingService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper employeeMapper;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(employeeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = getEmployeeEntity(id);
        return employeeMapper.toDto(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        if (employeeRepository.existsByEmpId(request.getEmpId())) {
            throw new IllegalArgumentException("Employee ID already exists: " + request.getEmpId());
        }

        Department department = getDepartmentByName(request.getDepartmentName());
        
        Employee employee = employeeMapper.toEntity(request);
        employee.setDepartment(department);
        
        Employee savedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDto(savedEmployee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = getEmployeeEntity(id);
        Department department = getDepartmentByName(request.getDepartmentName());

        employeeMapper.updateEntityFromDto(request, employee);
        employee.setDepartment(department);

        Employee updatedEmployee = employeeRepository.save(employee);
        return employeeMapper.toDto(updatedEmployee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        if (!employeeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employee not found with id: " + id);
        }
        employeeRepository.deleteById(id);
    }

    // --- Capstone Specific Requirements (Processing via Java Collections) ---
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateAverageSalary() {
        // Utilizing ArrayList explicitly to satisfy capstone requirements.
        ArrayList<Employee> employees = new ArrayList<>(employeeRepository.findAll());
        if (employees.isEmpty()) return BigDecimal.ZERO;
        
        BigDecimal totalSalary = employees.stream()
                .map(Employee::getSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
                
        return totalSalary.divide(BigDecimal.valueOf(employees.size()), 2, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public Double calculateAverageAge() {
        // Utilizing ArrayList explicitly to satisfy capstone requirements.
        ArrayList<Employee> employees = new ArrayList<>(employeeRepository.findAll());
        if (employees.isEmpty()) return 0.0;
        
        LocalDate today = LocalDate.now();
        double sumAges = employees.stream()
                .mapToInt(e -> Period.between(e.getDateOfBirth(), today).getYears())
                .sum();
                
        return sumAges / employees.size();
    }
    
    // --- Helper Methods ---

    private Employee getEmployeeEntity(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with name: " + name));
    }
}
