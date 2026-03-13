package com.kimtan.employeemanagement.mapper;

import com.kimtan.employeemanagement.model.dto.EmployeeRequest;
import com.kimtan.employeemanagement.model.dto.EmployeeResponse;
import com.kimtan.employeemanagement.model.entity.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface EmployeeMapper {

    @Mapping(source = "department.name", target = "departmentName")
    EmployeeResponse toDto(Employee employee);

    @Mapping(target = "department", ignore = true) // Handled in Service to lookup Department entity
    @Mapping(target = "id", ignore = true)
    Employee toEntity(EmployeeRequest request);

    @Mapping(target = "department", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "empId", ignore = true) // EmpID should generally be immutable after creation
    void updateEntityFromDto(EmployeeRequest request, @MappingTarget Employee employee);
}
