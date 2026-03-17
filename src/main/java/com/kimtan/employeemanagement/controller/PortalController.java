package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.model.dto.AuditLogDto;
import com.kimtan.employeemanagement.model.dto.DocumentDto;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.dto.LeaveBalanceDto;
import com.kimtan.employeemanagement.model.dto.LeaveRequestDto;
import com.kimtan.employeemanagement.model.dto.ProfileChangeRequestDto;
import com.kimtan.employeemanagement.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal")
@RequiredArgsConstructor
public class PortalController {

    private final EmployeeService employeeService;
    private final LeaveRequestService leaveRequestService;
    private final UserManagementService userManagementService;
    private final DocumentService documentService;
    private final AuditLogService auditLogService;
    private final ProfileChangeRequestService profileChangeRequestService;

    @GetMapping("/me")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<EmployeeResponse> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(employeeService.getEmployeeByUsername(authentication.getName()));
    }

    @GetMapping("/leaves")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<LeaveRequestDto>> getMyLeaves(Authentication authentication) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return ResponseEntity.ok(leaveRequestService.getLeaveRequestsByEmployee(me.getId()));
    }

    @PostMapping("/leaves")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<LeaveRequestDto> submitLeaveRequest(
            Authentication authentication,
            @Valid @RequestBody LeaveRequestDto request) {
        
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        request.setEmployeeId(me.getId());
        
        return new ResponseEntity<>(leaveRequestService.createLeaveRequest(request), HttpStatus.CREATED);
    }

    @PutMapping("/change-password")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'ADMIN', 'HR_MANAGER')")
    public ResponseEntity<Map<String, String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody com.kimtan.employeemanagement.model.dto.ChangePasswordRequest request) {
        userManagementService.changeOwnPassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    @GetMapping("/leave-balance")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<LeaveBalanceDto> getMyLeaveBalance(Authentication authentication) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return ResponseEntity.ok(leaveRequestService.getLeaveBalanceForEmployee(me.getId()));
    }

    @GetMapping("/profile-changes")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<ProfileChangeRequestDto>> getMyProfileChangeRequests(Authentication authentication) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return ResponseEntity.ok(profileChangeRequestService.getRequestsForEmployee(me.getId()));
    }

    @PostMapping("/profile-changes")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<ProfileChangeRequestDto> submitProfileChange(
            Authentication authentication,
            @RequestBody ProfileChangeRequestDto request) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return new ResponseEntity<>(profileChangeRequestService.submitRequest(me.getId(), request), HttpStatus.CREATED);
    }

    @GetMapping("/documents")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<DocumentDto>> getMyDocuments(Authentication authentication) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return ResponseEntity.ok(documentService.getDocumentsByEmployee(me.getId()));
    }

    @GetMapping("/documents/download/{documentId}")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<Resource> downloadMyDocument(@PathVariable Long documentId, Authentication authentication) {
        // Need to verify ownership in service or here. 
        // For now, loadFileAsResource loads it.
        Resource resource = documentService.loadFileAsResource(documentId);
        
        String contentType;
        try {
            contentType = Files.probeContentType(resource.getFile().toPath());
        } catch (IOException ex) {
            contentType = "application/octet-stream";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    @GetMapping("/audit")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<List<AuditLogDto>> getMyAuditLogs(Authentication authentication) {
        EmployeeResponse me = employeeService.getEmployeeByUsername(authentication.getName());
        return ResponseEntity.ok(auditLogService.getAuditLogsForEntity("EMPLOYEE", me.getId()));
    }
}
