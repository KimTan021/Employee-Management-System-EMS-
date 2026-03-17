package com.kimtan.employeemanagement.model.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProfileChangeRequestDto {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String phone;
    private String address;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
