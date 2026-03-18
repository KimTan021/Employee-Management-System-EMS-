package com.kimtan.employeemanagement.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalEmployees;
    private long departmentCount;
    private BigDecimal averageSalary;
    private double averageAge;
}
