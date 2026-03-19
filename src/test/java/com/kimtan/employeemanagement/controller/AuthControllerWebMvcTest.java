package com.kimtan.employeemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.model.dto.AuthRequest;
import com.kimtan.employeemanagement.model.dto.AuthResponse;
import com.kimtan.employeemanagement.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerWebMvcTest {

    @Mock
    private AuthService authService;

    @Mock
    private MessageSource messageSource;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .build();
    }

    @Test
    void login_returnsAuthResponse() throws Exception {
        AuthRequest request = AuthRequest.builder()
                .username("admin")
                .password("p4ssw0rd")
                .build();

        AuthResponse response = AuthResponse.builder()
                .token("jwt-token")
                .username("admin")
                .role("ADMIN")
                .build();

        when(authService.authenticate(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt-token"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void login_authFailure_returnsServerError() throws Exception {
        AuthRequest request = AuthRequest.builder()
                .username("admin")
                .password("wrong")
                .build();

        when(authService.authenticate(any(AuthRequest.class)))
                .thenThrow(new UsernameNotFoundException("Invalid user request."));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Internal Server Error"));
    }
}
