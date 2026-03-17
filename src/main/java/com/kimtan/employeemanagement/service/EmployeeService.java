package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.EmployeeMapper;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findByActiveTrue().stream()
                .map(employeeMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeById(Long id) {
        Employee employee = getEmployeeEntity(id);
        return employeeMapper.toDto(employee);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByUsername(String username) {
        Employee employee = employeeRepository.findByUserUsernameAndActiveTrue(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found for user: " + username));
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
        if (employee.getActive() == null) {
            employee.setActive(true);
        }
        if (employee.getAnnualLeaveBalance() == null) {
            employee.setAnnualLeaveBalance(12);
        }
        if (employee.getSickLeaveBalance() == null) {
            employee.setSickLeaveBalance(10);
        }
        if (employee.getPersonalLeaveBalance() == null) {
            employee.setPersonalLeaveBalance(5);
        }
        
        Employee savedEmployee = employeeRepository.save(employee);

        try {
            String newValue = objectMapper.writeValueAsString(employeeMapper.toDto(savedEmployee));
            auditLogService.logAction("EMPLOYEE", savedEmployee.getId(), "CREATE", null, newValue, getCurrentUsername());
        } catch (Exception e) {
            // Log silently
        }

        return employeeMapper.toDto(savedEmployee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employee = getEmployeeEntity(id);
        
        String oldValue = null;
        try { oldValue = objectMapper.writeValueAsString(employeeMapper.toDto(employee)); } catch (Exception e) {}

        Department department = getDepartmentByName(request.getDepartmentName());

        employeeMapper.updateEntityFromDto(request, employee);
        employee.setDepartment(department);

        Employee updatedEmployee = employeeRepository.save(employee);

        try {
            String newValue = objectMapper.writeValueAsString(employeeMapper.toDto(updatedEmployee));
            auditLogService.logAction("EMPLOYEE", updatedEmployee.getId(), "UPDATE", oldValue, newValue, getCurrentUsername());
        } catch (Exception e) {}

        return employeeMapper.toDto(updatedEmployee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employee = getEmployeeEntity(id);
        String oldValue = null;
        try { oldValue = objectMapper.writeValueAsString(employeeMapper.toDto(employee)); } catch (Exception e) {}
        employee.setActive(false);
        employeeRepository.save(employee);

        try {
            String newValue = objectMapper.writeValueAsString(employeeMapper.toDto(employee));
            auditLogService.logAction("EMPLOYEE", id, "DEACTIVATE", oldValue, newValue, getCurrentUsername());
        } catch (Exception e) {}
    }

    // --- Capstone Specific Requirements (Processing via Java Collections) ---
    
    @Override
    @Transactional(readOnly = true)
    public BigDecimal calculateAverageSalary() {
        // Utilizing ArrayList explicitly to satisfy capstone requirements.
        ArrayList<Employee> employees = new ArrayList<>(employeeRepository.findAll());
        employees.removeIf(e -> Boolean.FALSE.equals(e.getActive()));
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
        employees.removeIf(e -> Boolean.FALSE.equals(e.getActive()));
        if (employees.isEmpty()) return 0.0;
        
        LocalDate today = LocalDate.now();
        double sumAges = employees.stream()
                .mapToInt(e -> Period.between(e.getDateOfBirth(), today).getYears())
                .sum();
                
        return sumAges / employees.size();
    }
    
    // --- Helper Methods ---

    private String getCurrentUsername() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return "SYSTEM";
    }

    private Employee getEmployeeEntity(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    private Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with name: " + name));
    }
}
