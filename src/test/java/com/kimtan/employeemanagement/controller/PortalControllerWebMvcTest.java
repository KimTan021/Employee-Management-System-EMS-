package com.kimtan.employeemanagement.controller;

import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.dto.LeaveBalanceDto;
import com.kimtan.employeemanagement.model.dto.LeaveRequestDto;
import com.kimtan.employeemanagement.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PortalControllerWebMvcTest {

    @Mock private EmployeeService employeeService;
    @Mock private MessageSource messageSource;
    @Mock private LeaveRequestService leaveRequestService;
    @Mock private UserManagementService userManagementService;
    @Mock private DocumentService documentService;
    @Mock private AuditLogService auditLogService;
    @Mock private ProfileChangeRequestService profileChangeRequestService;

    @InjectMocks
    private PortalController portalController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
    private EmployeeResponse me;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new PortalController(employeeService, leaveRequestService, userManagementService, documentService, auditLogService, profileChangeRequestService))
                .setControllerAdvice(new GlobalExceptionHandler(messageSource))
                .build();

        me = new EmployeeResponse();
        me.setId(10L);
        me.setFirstName("John");
        me.setLastName("Doe");
        me.setEmpId("EMP001");
    }

    @Test
    void getMyProfile_returnsEmployee() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("john.doe");
        when(employeeService.getEmployeeByUsername("john.doe")).thenReturn(me);

        mockMvc.perform(get("/api/portal/me")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("John"));
    }

    @Test
    void getMyLeaves_returnsList() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("john.doe");
        when(employeeService.getEmployeeByUsername("john.doe")).thenReturn(me);
        
        LeaveRequestDto leave = new LeaveRequestDto();
        leave.setId(1L);
        when(leaveRequestService.getLeaveRequestsByEmployee(10L)).thenReturn(List.of(leave));

        mockMvc.perform(get("/api/portal/leaves")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void submitLeaveRequest_returnsCreated() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("john.doe");
        when(employeeService.getEmployeeByUsername("john.doe")).thenReturn(me);

        LeaveRequestDto request = new LeaveRequestDto();
        request.setType("SICK");
        request.setStartDate(java.time.LocalDate.now());
        request.setEndDate(java.time.LocalDate.now().plusDays(1));
        
        when(leaveRequestService.createLeaveRequest(any())).thenReturn(request);

        mockMvc.perform(post("/api/portal/leaves")
                        .principal(auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void getMyLeaveBalance_returnsBalance() throws Exception {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn("john.doe");
        when(employeeService.getEmployeeByUsername("john.doe")).thenReturn(me);

        LeaveBalanceDto balance = new LeaveBalanceDto();
        balance.setAnnualRemaining(10);
        when(leaveRequestService.getLeaveBalanceForEmployee(10L)).thenReturn(balance);

        mockMvc.perform(get("/api/portal/leave-balance")
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.annualRemaining").value(10));
    }
}
