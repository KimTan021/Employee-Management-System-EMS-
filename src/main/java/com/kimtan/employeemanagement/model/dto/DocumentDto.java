package com.kimtan.employeemanagement.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private Long id;
    private Long employeeId;
    private String fileName;
    private String fileType;
    private String uploadedBy;
    private LocalDateTime uploadedAt;
}
