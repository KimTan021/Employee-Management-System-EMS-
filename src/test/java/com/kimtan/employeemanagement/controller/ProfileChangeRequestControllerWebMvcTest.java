package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.model.dto.ProfileChangeRequestDto;
import com.kimtan.employeemanagement.service.ProfileChangeRequestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProfileChangeRequestControllerWebMvcTest {

    @Mock
    private ProfileChangeRequestService profileChangeRequestService;

    @InjectMocks
    private ProfileChangeRequestController profileChangeRequestController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(profileChangeRequestController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getAllRequests_returnsList() throws Exception {
        ProfileChangeRequestDto dto = new ProfileChangeRequestDto();
        dto.setId(1L);
        dto.setEmployeeName("John Doe");
        dto.setStatus("PENDING");

        when(profileChangeRequestService.getAllRequests()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/profile-changes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeName").value("John Doe"));
    }

    @Test
    void updateStatus_returnsUpdated() throws Exception {
        ProfileChangeRequestDto updated = new ProfileChangeRequestDto();
        updated.setId(1L);
        updated.setStatus("APPROVED");

        when(profileChangeRequestService.updateStatus(1L, "APPROVED")).thenReturn(updated);

        mockMvc.perform(put("/api/profile-changes/1/status")
                        .param("status", "APPROVED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
