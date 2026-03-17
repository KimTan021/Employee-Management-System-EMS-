package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.model.dto.CreateUserRequest;
import com.kimtan.employeemanagement.model.dto.UserDto;
import com.kimtan.employeemanagement.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> createUser(@Valid @RequestBody CreateUserRequest request, org.springframework.security.core.Authentication auth) {
        // Admin can create ADMIN, HR_MANAGER, or EMPLOYEE
        if (!Arrays.asList("ADMIN", "HR_MANAGER", "EMPLOYEE").contains(request.getRole())) {
            throw new IllegalArgumentException("Allowed roles are ADMIN, HR_MANAGER, or EMPLOYEE");
        }
        return new ResponseEntity<>(userManagementService.createUser(request), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public ResponseEntity<List<UserDto>> getAllUsers(org.springframework.security.core.Authentication auth) {
        String currentUserRole = auth.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .findFirst().orElse("");

        if (currentUserRole.equals("ADMIN")) {
            // Admin manages Admin and HR accounts, and can also see employees
            return ResponseEntity.ok(userManagementService.getAllUsers());
        } else {
            // HR can only see employee accounts (read-only)
            return ResponseEntity.ok(userManagementService.getUsersByRoles(Arrays.asList("EMPLOYEE")));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, org.springframework.security.core.Authentication auth) {
        UserDto targetUser = userManagementService.getAllUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new com.kimtan.employeemanagement.exception.ResourceNotFoundException("User not found"));

        if ("ADMIN".equals(targetUser.getRole())) {
            throw new IllegalArgumentException("Admins cannot delete other ADMIN accounts");
        }

        userManagementService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> body, org.springframework.security.core.Authentication auth) {
        String currentUsername = auth.getName();
        UserDto targetUser = userManagementService.getAllUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new com.kimtan.employeemanagement.exception.ResourceNotFoundException("User not found"));

        // Protect other admins, but allow self-reset
        if ("ADMIN".equals(targetUser.getRole()) && !targetUser.getUsername().equals(currentUsername)) {
            throw new IllegalArgumentException("Admins cannot reset passwords for other ADMIN accounts");
        }

        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }
        userManagementService.resetPassword(id, newPassword);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
