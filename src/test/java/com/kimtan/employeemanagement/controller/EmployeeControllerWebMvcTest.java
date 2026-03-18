package com.kimtan.employeemanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kimtan.employeemanagement.exception.GlobalExceptionHandler;
import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.service.EmployeeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EmployeeControllerWebMvcTest {

    @Mock
    private EmployeeService employeeService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        mockMvc = MockMvcBuilders.standaloneSetup(new EmployeeController(employeeService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void getAllEmployees_returnsList() throws Exception {
        EmployeeResponse response = new EmployeeResponse();
        response.setId(1L);
        response.setEmpId("EMP-001");
        response.setFirstName("Ada");
        response.setLastName("Lovelace");
        response.setDepartmentName("Engineering");
        response.setDateOfBirth(LocalDate.now().minusYears(30));
        response.setSalary(new BigDecimal("5000.00"));

        when(employeeService.getAllEmployees(any())).thenReturn(List.of(response));

        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].empId").value("EMP-001"));
    }

    @Test
    void getEmployeeById_returnsEmployee() throws Exception {
        EmployeeResponse response = new EmployeeResponse();
        response.setId(10L);
        response.setEmpId("EMP-010");
        response.setFirstName("Grace");
        response.setLastName("Hopper");
        response.setDepartmentName("Engineering");
        response.setDateOfBirth(LocalDate.now().minusYears(35));
        response.setSalary(new BigDecimal("7000.00"));

        when(employeeService.getEmployeeById(10L)).thenReturn(response);

        mockMvc.perform(get("/api/employees/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.empId").value("EMP-010"));
    }

    @Test
    void getEmployeeById_missing_returnsNotFound() throws Exception {
        when(employeeService.getEmployeeById(99L))
                .thenThrow(new ResourceNotFoundException("Employee not found with id: 99"));

        mockMvc.perform(get("/api/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Resource Not Found"))
                .andExpect(jsonPath("$.details[0]").value("Employee not found with id: 99"));
    }

    @Test
    void createEmployee_valid_returnsCreated() throws Exception {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmpId("EMP-001");
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setDateOfBirth(LocalDate.now().minusYears(30));
        request.setDepartmentName("Engineering");
        request.setSalary(new BigDecimal("5000.00"));

        EmployeeResponse response = new EmployeeResponse();
        response.setId(1L);
        response.setEmpId("EMP-001");
        response.setFirstName("Ada");
        response.setLastName("Lovelace");
        response.setDepartmentName("Engineering");
        response.setDateOfBirth(request.getDateOfBirth());
        response.setSalary(request.getSalary());

        when(employeeService.createEmployee(any(EmployeeRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.empId").value("EMP-001"));
    }

    @Test
    void createEmployee_validationError_returnsBadRequest() throws Exception {
        EmployeeRequest request = new EmployeeRequest();

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.details", hasItem(containsString("empId"))));
    }

    @Test
    void updateEmployee_returnsOk() throws Exception {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmpId("EMP-001");
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setDateOfBirth(LocalDate.now().minusYears(30));
        request.setDepartmentName("Engineering");
        request.setSalary(new BigDecimal("5500.00"));

        EmployeeResponse response = new EmployeeResponse();
        response.setId(1L);
        response.setEmpId("EMP-001");
        response.setFirstName("Ada");
        response.setLastName("Lovelace");
        response.setDepartmentName("Engineering");
        response.setDateOfBirth(request.getDateOfBirth());
        response.setSalary(request.getSalary());

        when(employeeService.updateEmployee(eq(1L), any(EmployeeRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/employees/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.salary").value(5500.00));
    }

    @Test
    void deleteEmployee_returnsNoContent() throws Exception {
        doNothing().when(employeeService).deleteEmployee(1L);

        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void getAverageSalary_returnsValue() throws Exception {
        when(employeeService.calculateAverageSalary()).thenReturn(new BigDecimal("2500.50"));

        mockMvc.perform(get("/api/employees/statistics/average-salary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(2500.50));
    }

    @Test
    void getAverageAge_returnsValue() throws Exception {
        when(employeeService.calculateAverageAge()).thenReturn(33.5);

        mockMvc.perform(get("/api/employees/statistics/average-age"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(33.5));
    }
}
