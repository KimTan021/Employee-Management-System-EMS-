package com.kimtan.employeemanagement.model.dto;

import lombok.Data;

@Data
public class LeaveBalanceDto {
    private Integer annualEntitled;
    private Integer sickEntitled;
    private Integer personalEntitled;

    private Integer annualUsed;
    private Integer sickUsed;
    private Integer personalUsed;

    private Integer annualRemaining;
    private Integer sickRemaining;
    private Integer personalRemaining;
}
