package com.kimtan.employeemanagement.service;

import com.kimtan.employeemanagement.exception.ResourceNotFoundException;
import com.kimtan.employeemanagement.mapper.LeaveRequestMapper;
import com.kimtan.employeemanagement.model.dto.LeaveRequestDto;
import com.kimtan.employeemanagement.model.dto.LeaveBalanceDto;
import com.kimtan.employeemanagement.model.entity.Employee;
import com.kimtan.employeemanagement.model.entity.LeaveRequest;
import com.kimtan.employeemanagement.repository.EmployeeRepository;
import com.kimtan.employeemanagement.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestMapper leaveRequestMapper;

    public LeaveRequestDto createLeaveRequest(LeaveRequestDto requestDto) {
        Employee employee = employeeRepository.findById(requestDto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + requestDto.getEmployeeId()));

        LeaveRequest leaveRequest = leaveRequestMapper.toEntity(requestDto);
        leaveRequest.setEmployee(employee);
        leaveRequest.setStatus("PENDING");
        
        LeaveRequest savedRequest = leaveRequestRepository.save(leaveRequest);
        return leaveRequestMapper.toDto(savedRequest);
    }

    public List<LeaveRequestDto> getAllLeaveRequests() {
        return leaveRequestRepository.findAll().stream()
                .map(leaveRequestMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<LeaveRequestDto> getLeaveRequestsByEmployee(Long employeeId) {
        return leaveRequestRepository.findByEmployeeId(employeeId).stream()
                .map(leaveRequestMapper::toDto)
                .collect(Collectors.toList());
    }

    public LeaveRequestDto updateLeaveStatus(Long id, String status) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found with id: " + id));
        
        leaveRequest.setStatus(status);
        LeaveRequest updatedRequest = leaveRequestRepository.save(leaveRequest);
        return leaveRequestMapper.toDto(updatedRequest);
    }

    public LeaveBalanceDto getLeaveBalanceForEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));

        List<LeaveRequest> approved = leaveRequestRepository.findByEmployeeIdAndStatus(employeeId, "APPROVED");

        int annualUsed = 0;
        int sickUsed = 0;
        int personalUsed = 0;

        for (LeaveRequest lr : approved) {
            int days = (int) ChronoUnit.DAYS.between(lr.getStartDate(), lr.getEndDate()) + 1;
            switch (lr.getType()) {
                case "Vacation":
                    annualUsed += days;
                    break;
                case "Sick":
                    sickUsed += days;
                    break;
                case "Personal":
                    personalUsed += days;
                    break;
                default:
                    break;
            }
        }

        LeaveBalanceDto dto = new LeaveBalanceDto();
        int annualEntitled = employee.getAnnualLeaveBalance() != null ? employee.getAnnualLeaveBalance() : 0;
        int sickEntitled = employee.getSickLeaveBalance() != null ? employee.getSickLeaveBalance() : 0;
        int personalEntitled = employee.getPersonalLeaveBalance() != null ? employee.getPersonalLeaveBalance() : 0;

        dto.setAnnualEntitled(annualEntitled);
        dto.setSickEntitled(sickEntitled);
        dto.setPersonalEntitled(personalEntitled);
        dto.setAnnualUsed(annualUsed);
        dto.setSickUsed(sickUsed);
        dto.setPersonalUsed(personalUsed);
        dto.setAnnualRemaining(Math.max(annualEntitled - annualUsed, 0));
        dto.setSickRemaining(Math.max(sickEntitled - sickUsed, 0));
        dto.setPersonalRemaining(Math.max(personalEntitled - personalUsed, 0));
        return dto;
    }
}
