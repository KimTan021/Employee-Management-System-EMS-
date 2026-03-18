package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.EmployeeMapper;
import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.Department;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.repository.DepartmentRepository;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private EmployeeMapper employeeMapper;

    @InjectMocks
    private EmployeeService employeeService;

    private EmployeeRequest request;
    private Department department;
    private Employee employee;
    private EmployeeResponse response;

    @BeforeEach
    void setUp() {
        request = new EmployeeRequest();
        request.setEmpId("EMP-001");
        request.setFirstName("Ada");
        request.setLastName("Lovelace");
        request.setDateOfBirth(LocalDate.now().minusYears(30));
        request.setDepartmentName("Engineering");
        request.setSalary(new BigDecimal("5000.00"));

        department = new Department(1, "Engineering");

        employee = new Employee();
        employee.setId(10L);
        employee.setEmpId("EMP-001");
        employee.setFirstName("Ada");
        employee.setLastName("Lovelace");
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setDepartment(department);
        employee.setSalary(new BigDecimal("5000.00"));

        response = new EmployeeResponse();
        response.setId(10L);
        response.setEmpId("EMP-001");
        response.setFirstName("Ada");
        response.setLastName("Lovelace");
        response.setDateOfBirth(request.getDateOfBirth());
        response.setDepartmentName("Engineering");
        response.setSalary(new BigDecimal("5000.00"));
    }

    @Test
    void getAllEmployees_returnsMappedDtos() {
        when(employeeRepository.findByActive(true)).thenReturn(List.of(employee));
        when(employeeMapper.toDto(employee)).thenReturn(response);

        List<EmployeeResponse> results = employeeService.getAllEmployees(true);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getEmpId()).isEqualTo("EMP-001");
        verify(employeeRepository).findByActive(true);
        verify(employeeMapper).toDto(employee);
    }

    @Test
    void getEmployeeById_returnsEmployee() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(employeeMapper.toDto(employee)).thenReturn(response);

        EmployeeResponse result = employeeService.getEmployeeById(10L);

        assertThat(result.getId()).isEqualTo(10L);
        verify(employeeRepository).findById(10L);
        verify(employeeMapper).toDto(employee);
    }

    @Test
    void getEmployeeById_missing_throwsNotFound() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.getEmployeeById(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Employee not found with id: 10");
    }

    @Test
    void createEmployee_duplicateEmpId_throwsIllegalArgument() {
        when(employeeRepository.existsByEmpId("EMP-001")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.createEmployee(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Employee ID already exists: EMP-001");
    }

    @Test
    void createEmployee_departmentMissing_throwsNotFound() {
        when(employeeRepository.existsByEmpId("EMP-001")).thenReturn(false);
        when(departmentRepository.findByName("Engineering")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.createEmployee(request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Department not found with name: Engineering");
    }

    @Test
    void createEmployee_success_savesAndReturnsDto() {
        when(employeeRepository.existsByEmpId("EMP-001")).thenReturn(false);
        when(departmentRepository.findByName("Engineering")).thenReturn(Optional.of(department));
        when(employeeMapper.toEntity(request)).thenReturn(employee);
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);
        when(employeeMapper.toDto(employee)).thenReturn(response);

        EmployeeResponse result = employeeService.createEmployee(request);

        assertThat(result.getEmpId()).isEqualTo("EMP-001");
        ArgumentCaptor<Employee> captor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(captor.capture());
        assertThat(captor.getValue().getDepartment()).isEqualTo(department);
    }

    @Test
    void updateEmployee_missingEmployee_throwsNotFound() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.updateEmployee(10L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Employee not found with id: 10");
    }

    @Test
    void updateEmployee_missingDepartment_throwsNotFound() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(departmentRepository.findByName("Engineering")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.updateEmployee(10L, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Department not found with name: Engineering");
    }

    @Test
    void updateEmployee_success_updatesAndReturnsDto() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(departmentRepository.findByName("Engineering")).thenReturn(Optional.of(department));
        when(employeeRepository.save(employee)).thenReturn(employee);
        when(employeeMapper.toDto(employee)).thenReturn(response);

        EmployeeResponse result = employeeService.updateEmployee(10L, request);

        assertThat(result.getId()).isEqualTo(10L);
        verify(employeeMapper).updateEntityFromDto(eq(request), eq(employee));
        verify(employeeRepository).save(employee);
        assertThat(employee.getDepartment()).isEqualTo(department);
    }

    @Test
    void deleteEmployee_missingEmployee_throwsNotFound() {
        when(employeeRepository.existsById(10L)).thenReturn(false);

        assertThatThrownBy(() -> employeeService.deleteEmployee(10L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Employee not found with id: 10");
    }

    @Test
    void deleteEmployee_success_deactivates() {
        when(employeeRepository.findById(10L)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(employee)).thenReturn(employee);

        employeeService.deleteEmployee(10L);

        assertThat(employee.getActive()).isFalse();
        verify(employeeRepository).save(employee);
    }

    @Test
    void calculateAverageSalary_empty_returnsZero() {
        when(employeeRepository.findAll()).thenReturn(List.of());

        BigDecimal result = employeeService.calculateAverageSalary();

        assertThat(result).isEqualByComparingTo("0");
    }

    @Test
    void calculateAverageSalary_nonEmpty_returnsAverage() {
        Employee e1 = new Employee();
        e1.setSalary(new BigDecimal("1000.00"));
        Employee e2 = new Employee();
        e2.setSalary(new BigDecimal("3000.00"));
        when(employeeRepository.findAll()).thenReturn(List.of(e1, e2));

        BigDecimal result = employeeService.calculateAverageSalary();

        assertThat(result).isEqualByComparingTo("2000.00");
    }

    @Test
    void calculateAverageAge_empty_returnsZero() {
        when(employeeRepository.findAll()).thenReturn(List.of());

        Double result = employeeService.calculateAverageAge();

        assertThat(result).isEqualTo(0.0);
    }

    @Test
    void calculateAverageAge_nonEmpty_returnsAverage() {
        LocalDate today = LocalDate.now();
        Employee e1 = new Employee();
        e1.setDateOfBirth(today.minusYears(30));
        Employee e2 = new Employee();
        e2.setDateOfBirth(today.minusYears(40));
        when(employeeRepository.findAll()).thenReturn(List.of(e1, e2));

        Double result = employeeService.calculateAverageAge();

        assertThat(result).isEqualTo(35.0);
    }
}
