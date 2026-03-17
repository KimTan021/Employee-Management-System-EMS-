-- Add user_id to employees to link the employee record to their login account
ALTER TABLE employees ADD COLUMN user_id BIGINT NULL;
ALTER TABLE employees ADD CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Create a Leave Requests table for the new Employee Portal feature
CREATE TABLE leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE INDEX idx_leave_emp ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);

-- Seed a test Employee User (john.doe / password is 'p4ssw0rd')
INSERT INTO users (username, password_hash, role) VALUES ('john.doe', '$2a$10$Wcry8mjGISamZdHm1Pg.Se1He97n3t.S26pR8zgxb/Gsx11dXnDKu', 'EMPLOYEE');

-- Seed a test Employee Record and link it to the john.doe user
INSERT INTO employees (emp_id, first_name, last_name, date_of_birth, department_id, salary, user_id) 
VALUES ('EMP-001', 'John', 'Doe', '1990-05-15', 1, 75000.00, (SELECT id FROM users WHERE username = 'john.doe'));

-- Seed a test Leave Request
INSERT INTO leave_requests (employee_id, start_date, end_date, type, status, reason)
VALUES ((SELECT id FROM employees WHERE emp_id = 'EMP-001'), '2026-04-01', '2026-04-05', 'Vacation', 'PENDING', 'Annual family trip');
