package com.kimtan.employeemanagement.model.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeResponse {
    private Long id;
    private String empId;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String departmentName;
    private BigDecimal salary;
}
