package com.kimtan.employeemanagement.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EmployeeIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private DepartmentRepository departmentRepository;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper().findAndRegisterModules();
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createAndFetchEmployee_endToEnd() throws Exception {
        departmentRepository.save(new Department(null, "Engineering"));

        EmployeeRequest request = new EmployeeRequest();
        request.setEmpId("EMP-100");
        request.setFirstName("Linus");
        request.setLastName("Torvalds");
        request.setDateOfBirth(LocalDate.now().minusYears(40));
        request.setDepartmentName("Engineering");
        request.setSalary(new BigDecimal("9000.00"));

        String createResponse = mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.empId").value("EMP-101"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        EmployeeResponse created = objectMapper.readValue(createResponse, EmployeeResponse.class);

        mockMvc.perform(get("/api/employees/" + created.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.empId").value("EMP-101"))
                .andExpect(jsonPath("$.departmentName").value("Engineering"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void createEmployee_withNonAdminRole_forbidden() throws Exception {
        EmployeeRequest request = new EmployeeRequest();
        request.setEmpId("EMP-101");
        request.setFirstName("Grace");
        request.setLastName("Hopper");
        request.setDateOfBirth(LocalDate.now().minusYears(35));
        request.setDepartmentName("Engineering");
        request.setSalary(new BigDecimal("8000.00"));

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
