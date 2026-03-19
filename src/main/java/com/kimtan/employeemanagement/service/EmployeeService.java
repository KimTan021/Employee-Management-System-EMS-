package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.EmployeeMapper;
import com.kimtan.employeemanagement.model.dto.DashboardStatsDto;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.*;
import com.kimtan.employeemanagement.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
    private final LeaveRequestRepository leaveRequestRepository;
    private final ProfileChangeRequestRepository profileChangeRequestRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final EmployeeMapper employeeMapper;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${upload.directory:uploads}")
    private String uploadDirectory;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getAllEmployees(Boolean activeOnly) {
        List<Employee> employees;
        if (activeOnly != null) {
            employees = employeeRepository.findByActive(activeOnly);
        } else {
            employees = employeeRepository.findAll();
        }
        return employees.stream()
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
                .orElseThrow(() -> new ResourceNotFoundException("error.employee.username_not_found"));
        return employeeMapper.toDto(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        validateAge(request.getDateOfBirth());
        
        // Automate ID generation
        String generatedId = generateNextEmpId();
        
        Department department = getDepartmentByName(request.getDepartmentName());
        
        Employee employee = employeeMapper.toEntity(request);
        employee.setEmpId(generatedId);
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
        validateAge(request.getDateOfBirth());
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

    @Transactional
    public void permanentlyDeleteEmployee(Long id) {
        Employee employee = getEmployeeEntity(id);
        
        if (employee.getActive()) {
            throw new IllegalStateException("error.employee.delete_active_permanent");
        }

        String oldValue = null;
        try { oldValue = objectMapper.writeValueAsString(employeeMapper.toDto(employee)); } catch (Exception e) {}

        // 1. Delete Documents (and physical files)
        List<Document> documents = documentRepository.findByEmployeeIdOrderByUploadedAtDesc(id);
        for (Document doc : documents) {
            try {
                Path fileStorageLocation = Paths.get(uploadDirectory).toAbsolutePath().normalize();
                Path filePath = fileStorageLocation.resolve(doc.getFilePath()).normalize();
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log but continue
            }
            documentRepository.delete(doc);
        }

        // 2. Delete Leave Requests
        leaveRequestRepository.deleteByEmployeeId(id);

        // 3. Delete Profile Change Requests
        profileChangeRequestRepository.deleteByEmployeeId(id);

        // 4. Delete associated User if exists
        User user = employee.getUser();
        if (user != null) {
            employee.setUser(null);
            employeeRepository.saveAndFlush(employee);
            userRepository.delete(user);
        }

        // 5. Finally delete the employee
        employeeRepository.delete(employee);

        // 6. Log
        try {
            auditLogService.logAction("EMPLOYEE", id, "PERMANENT_DELETE", oldValue, null, getCurrentUsername());
        } catch (Exception e) {}
    }

    @Transactional
    public EmployeeResponse restoreEmployee(Long id) {
        Employee employee = getEmployeeEntity(id);
        String oldValue = null;
        try { oldValue = objectMapper.writeValueAsString(employeeMapper.toDto(employee)); } catch (Exception e) {}
        
        employee.setActive(true);
        Employee savedEmployee = employeeRepository.save(employee);

        try {
            String newValue = objectMapper.writeValueAsString(employeeMapper.toDto(savedEmployee));
            auditLogService.logAction("EMPLOYEE", id, "RESTORE", oldValue, newValue, getCurrentUsername());
        } catch (Exception e) {}
        
        return employeeMapper.toDto(savedEmployee);
    }

    @Transactional(readOnly = true)
    public DashboardStatsDto getDashboardStats() {
        List<Employee> allActive = employeeRepository.findByActiveTrue();
        
        long totalEmployees = allActive.size();
        long departmentCount = allActive.stream()
                .map(Employee::getDepartment)
                .distinct()
                .count();
                
        BigDecimal avgSalary = calculateAverageSalary();
        Double avgAge = calculateAverageAge();
        
        return DashboardStatsDto.builder()
                .totalEmployees(totalEmployees)
                .departmentCount(departmentCount)
                .averageSalary(avgSalary)
                .averageAge(avgAge != null ? avgAge : 0.0)
                .build();
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
                .orElseThrow(() -> new ResourceNotFoundException("error.employee.not_found"));
    }

    private Department getDepartmentByName(String name) {
        return departmentRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with name: " + name));
    }

    private void validateAge(LocalDate dateOfBirth) {
        if (dateOfBirth == null) return;
        if (Period.between(dateOfBirth, LocalDate.now()).getYears() < 18) {
            throw new IllegalArgumentException("error.invalid_age");
        }
    }

    private String generateNextEmpId() {
        List<Employee> allEmployees = employeeRepository.findAll();
        int maxId = 100; // Starting sequence
        
        for (Employee emp : allEmployees) {
            String empId = emp.getEmpId();
            if (empId != null && empId.startsWith("EMP-")) {
                try {
                    String numericPart = empId.substring(4);
                    int idValue = Integer.parseInt(numericPart);
                    if (idValue > maxId) {
                        maxId = idValue;
                    }
                } catch (NumberFormatException e) {
                    // Ignore non-standard formats
                }
            }
        }
        
        return "EMP-" + (maxId + 1);
    }
}
