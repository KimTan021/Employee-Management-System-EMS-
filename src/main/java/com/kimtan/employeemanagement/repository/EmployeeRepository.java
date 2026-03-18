package com.kimtan.employeemanagement.repository;

import com.kimtan.employeemanagement.model.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmpId(String empId);
    List<Employee> findByDepartmentId(Integer departmentId);
    java.util.Optional<Employee> findByUserUsername(String username);
    java.util.Optional<Employee> findByUserUsernameAndActiveTrue(String username);
    List<Employee> findByActiveTrue();
    List<Employee> findByActiveFalse();
    List<Employee> findByActive(Boolean active);
}
