package com.kimtan.employeemanagement.model.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class EmployeeRequest {

    @Size(max = 20, message = "Employee ID must not exceed 20 characters")
    private String empId;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotNull(message = "Date of birth is required")
    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Department name is required")
    private String departmentName;

    @NotNull(message = "Salary is required")
    @Positive(message = "Salary must be greater than zero")
    private BigDecimal salary;

    @Size(max = 30, message = "Phone must not exceed 30 characters")
    private String phone;

    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @Size(max = 100, message = "Emergency contact name must not exceed 100 characters")
    private String emergencyContactName;

    @Size(max = 30, message = "Emergency contact phone must not exceed 30 characters")
    private String emergencyContactPhone;

    @PositiveOrZero(message = "Annual leave balance must be zero or greater")
    private Integer annualLeaveBalance;

    @PositiveOrZero(message = "Sick leave balance must be zero or greater")
    private Integer sickLeaveBalance;

    @PositiveOrZero(message = "Personal leave balance must be zero or greater")
    private Integer personalLeaveBalance;
}
