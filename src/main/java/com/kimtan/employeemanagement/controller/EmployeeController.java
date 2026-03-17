package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<List<EmployeeResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        return new ResponseEntity<>(employeeService.createEmployee(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<EmployeeResponse> updateEmployee(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistics/average-salary")
    public ResponseEntity<BigDecimal> getAverageSalary() {
        return ResponseEntity.ok(employeeService.calculateAverageSalary());
    }

    @GetMapping("/statistics/average-age")
    public ResponseEntity<Double> getAverageAge() {
        return ResponseEntity.ok(employeeService.calculateAverageAge());
    }

    // --- Admin Leave Management ---
    
    @GetMapping("/leaves")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<com.kimtan.employeemanagement.model.dto.LeaveRequestDto>> getAllLeaves() {
        return ResponseEntity.ok(com.kimtan.employeemanagement.context.ApplicationContextProvider.getContext()
                .getBean(com.kimtan.employeemanagement.service.LeaveRequestService.class)
                .getAllLeaveRequests());
    }

    @PutMapping("/leaves/{id}/status")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ResponseEntity<com.kimtan.employeemanagement.model.dto.LeaveRequestDto> updateLeaveStatus(
            @PathVariable Long id, 
            @RequestParam String status) {
        return ResponseEntity.ok(com.kimtan.employeemanagement.context.ApplicationContextProvider.getContext()
                .getBean(com.kimtan.employeemanagement.service.LeaveRequestService.class)
                .updateLeaveStatus(id, status));
    }
}
