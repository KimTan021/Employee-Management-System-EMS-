package com.kimtan.employeemanagement.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDto {
    private Long id;
    private Long employeeId;
    
    @NotNull(message = "Start date is mandatory")
    private LocalDate startDate;
    
    @NotNull(message = "End date is mandatory")
    private LocalDate endDate;
    
    @NotBlank(message = "Type is mandatory")
    private String type;
    
    private String status;
    private String reason;
}
