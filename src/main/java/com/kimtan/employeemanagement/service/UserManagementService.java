package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.ChangePasswordRequest;
import com.kimtan.employeemanagement.model.dto.CreateUserRequest;
import com.kimtan.employeemanagement.model.dto.UserDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.User;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserDto createUser(CreateUserRequest request) {
        // Validate username uniqueness
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("error.user.username_exists");
        }

        String role = request.getRole() != null ? request.getRole() : "EMPLOYEE";

        // Create user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);

        User savedUser = userRepository.save(user);

        // If employeeId is provided, link the user to the employee
        if (request.getEmployeeId() != null) {
            Employee employee = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("error.employee.not_found"));

            if (employee.getUser() != null) {
                throw new IllegalArgumentException("error.employee.already_linked");
            }

            employee.setUser(savedUser);
            employeeRepository.save(employee);
        }

        return toDto(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsersByRoles(List<String> roles) {
        return userRepository.findAll().stream()
                .filter(user -> roles.contains(user.getRole()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not_found"));

        // Unlink from employee if linked
        employeeRepository.findByUserUsername(user.getUsername())
                .ifPresent(employee -> {
                    employee.setUser(null);
                    employeeRepository.save(employee);
                });

        userRepository.delete(user);
    }

    @Transactional
    public void resetPassword(Long userId, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not_found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void changeOwnPassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("error.user.not_found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("error.user.incorrect_password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private UserDto toDto(User user) {
        // Find linked employee if any
        var employeeOpt = employeeRepository.findByUserUsername(user.getUsername());

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .role(user.getRole())
                .employeeId(employeeOpt.map(Employee::getId).orElse(null))
                .employeeName(employeeOpt.map(e -> e.getFirstName() + " " + e.getLastName()).orElse(null))
                .build();
    }
}
