package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.model.dto.ProfileChangeRequestDto;
import com.kimtan.employeemanagement.service.ProfileChangeRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile-changes")
@RequiredArgsConstructor
public class ProfileChangeRequestController {

    private final ProfileChangeRequestService profileChangeRequestService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<ProfileChangeRequestDto>> getAllRequests() {
        return ResponseEntity.ok(profileChangeRequestService.getAllRequests());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<ProfileChangeRequestDto> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(profileChangeRequestService.updateStatus(id, status));
    }
}
