package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.LeaveRequestMapper;
import com.kimtan.employeemanagement.model.dto.LeaveBalanceDto;
import com.kimtan.employeemanagement.model.dto.LeaveRequestDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.LeaveRequest;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveRequestServiceTest {

    @Mock
    private LeaveRequestRepository leaveRequestRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private LeaveRequestMapper leaveRequestMapper;

    @InjectMocks
    private LeaveRequestService leaveRequestService;

    private Employee employee;
    private LeaveRequest leaveRequest;
    private LeaveRequestDto leaveRequestDto;

    @BeforeEach
    void setUp() {
        employee = new Employee();
        employee.setId(1L);
        employee.setAnnualLeaveBalance(20);
        employee.setSickLeaveBalance(10);
        employee.setPersonalLeaveBalance(5);

        leaveRequest = LeaveRequest.builder()
                .id(1L)
                .employee(employee)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .type("Vacation")
                .status("PENDING")
                .build();

        leaveRequestDto = LeaveRequestDto.builder()
                .employeeId(1L)
                .startDate(LocalDate.now().plusDays(1))
                .endDate(LocalDate.now().plusDays(3))
                .type("Vacation")
                .build();
    }

    @Test
    void createLeaveRequest_success() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRequestMapper.toEntity(any(LeaveRequestDto.class))).thenReturn(leaveRequest);
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leaveRequest);
        when(leaveRequestMapper.toDto(any(LeaveRequest.class))).thenReturn(leaveRequestDto);

        LeaveRequestDto result = leaveRequestService.createLeaveRequest(leaveRequestDto);

        assertThat(result).isNotNull();
        verify(leaveRequestRepository).save(any(LeaveRequest.class));
    }

    @Test
    void createLeaveRequest_pastStartDate_throwsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        leaveRequestDto.setStartDate(LocalDate.now().minusDays(1));

        assertThatThrownBy(() -> leaveRequestService.createLeaveRequest(leaveRequestDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Leave start date cannot be in the past");
    }

    @Test
    void createLeaveRequest_endDateBeforeStartDate_throwsException() {
        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        leaveRequestDto.setStartDate(LocalDate.now().plusDays(5));
        leaveRequestDto.setEndDate(LocalDate.now().plusDays(3));

        assertThatThrownBy(() -> leaveRequestService.createLeaveRequest(leaveRequestDto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Leave end date must be on or after the start date");
    }

    @Test
    void getAllLeaveRequests_returnsSortedList() {
        when(leaveRequestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(leaveRequest));
        when(leaveRequestMapper.toDto(any(LeaveRequest.class))).thenReturn(leaveRequestDto);

        List<LeaveRequestDto> result = leaveRequestService.getAllLeaveRequests();

        assertThat(result).hasSize(1);
        verify(leaveRequestRepository).findAllByOrderByCreatedAtDesc();
    }

    @Test
    void updateLeaveStatus_success() {
        when(leaveRequestRepository.findById(1L)).thenReturn(Optional.of(leaveRequest));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenReturn(leaveRequest);
        when(leaveRequestMapper.toDto(any(LeaveRequest.class))).thenReturn(leaveRequestDto);

        LeaveRequestDto result = leaveRequestService.updateLeaveStatus(1L, "APPROVED");

        assertThat(result).isNotNull();
        assertThat(leaveRequest.getStatus()).isEqualTo("APPROVED");
    }

    @Test
    void getLeaveBalanceForEmployee_calculatesCorrectly() {
        LeaveRequest approvedVacation = LeaveRequest.builder()
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(1)) // 2 days
                .type("Vacation")
                .status("APPROVED")
                .build();

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.findByEmployeeIdAndStatusOrderByCreatedAtDesc(1L, "APPROVED"))
                .thenReturn(List.of(approvedVacation));

        LeaveBalanceDto balance = leaveRequestService.getLeaveBalanceForEmployee(1L);

        assertThat(balance.getAnnualUsed()).isEqualTo(2);
        assertThat(balance.getAnnualRemaining()).isEqualTo(18);
        assertThat(balance.getSickRemaining()).isEqualTo(10);
    }
}
