package com.kimtan.employeemanagement.mapper;

import com.kimtan.employeemanagement.model.dto.LeaveRequestDto;
import com.kimtan.employeemanagement.model.entity.LeaveRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LeaveRequestMapper {
    @Mapping(source = "employee.id", target = "employeeId")
    LeaveRequestDto toDto(LeaveRequest leaveRequest);

    @Mapping(source = "employeeId", target = "employee.id")
    LeaveRequest toEntity(LeaveRequestDto leaveRequestDto);
}
