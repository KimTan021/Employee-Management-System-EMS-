package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.ChangePasswordRequest;
import com.kimtan.employeemanagement.model.dto.CreateUserRequest;
import com.kimtan.employeemanagement.model.dto.UserDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.User;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserManagementServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserManagementService userManagementService;

    private CreateUserRequest createUserRequest;
    private User user;
    private Employee employee;

    @BeforeEach
    void setUp() {
        createUserRequest = new CreateUserRequest();
        createUserRequest.setUsername("testuser");
        createUserRequest.setPassword("password123");
        createUserRequest.setRole("EMPLOYEE");
        createUserRequest.setEmployeeId(1L);

        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPasswordHash("hashedPassword");
        user.setRole("EMPLOYEE");

        employee = new Employee();
        employee.setId(1L);
        employee.setFirstName("John");
        employee.setLastName("Doe");
    }

    @Test
    void createUser_success_returnsUserDto() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(employeeRepository.findByUserUsername("testuser")).thenReturn(Optional.of(employee));

        UserDto result = userManagementService.createUser(createUserRequest);

        assertThat(result.getUsername()).isEqualTo("testuser");
        assertThat(result.getEmployeeId()).isEqualTo(1L);
        verify(userRepository).save(any(User.class));
        verify(employeeRepository).save(employee);
    }

    @Test
    void createUser_duplicateUsername_throwsException() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userManagementService.createUser(createUserRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username 'testuser' already exists");
    }

    @Test
    void deleteUser_success_unlinksEmployee() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(employeeRepository.findByUserUsername("testuser")).thenReturn(Optional.of(employee));

        userManagementService.deleteUser(1L);

        assertThat(employee.getUser()).isNull();
        verify(employeeRepository).save(employee);
        verify(userRepository).delete(user);
    }

    @Test
    void resetPassword_success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("newPass")).thenReturn("newHashed");

        userManagementService.resetPassword(1L, "newPass");

        assertThat(user.getPasswordHash()).isEqualTo("newHashed");
        verify(userRepository).save(user);
    }

    @Test
    void changeOwnPassword_success() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "hashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("newHashed");

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("oldPass");
        request.setNewPassword("newPass");

        userManagementService.changeOwnPassword("testuser", request);

        assertThat(user.getPasswordHash()).isEqualTo("newHashed");
        verify(userRepository).save(user);
    }

    @Test
    void changeOwnPassword_wrongOldPassword_throwsException() {
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPass", "hashedPassword")).thenReturn(false);

        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrongPass");
        request.setNewPassword("newPass");

        assertThatThrownBy(() -> userManagementService.changeOwnPassword("testuser", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current password is incorrect");
    }
}
