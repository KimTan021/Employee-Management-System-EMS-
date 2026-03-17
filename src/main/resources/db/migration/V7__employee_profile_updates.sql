-- Add new employee fields required by the UI/UX changes
ALTER TABLE employees
  ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1,
  ADD COLUMN phone VARCHAR(30),
  ADD COLUMN address VARCHAR(255),
  ADD COLUMN emergency_contact_name VARCHAR(100),
  ADD COLUMN emergency_contact_phone VARCHAR(30),
  ADD COLUMN annual_leave_balance INT DEFAULT 12,
  ADD COLUMN sick_leave_balance INT DEFAULT 10,
  ADD COLUMN personal_leave_balance INT DEFAULT 5;

-- Table for employee profile change requests
CREATE TABLE IF NOT EXISTS profile_change_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  phone VARCHAR(30),
  address VARCHAR(255),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(30),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME,
  updated_at DATETIME,
  PRIMARY KEY (id),
  CONSTRAINT fk_profile_change_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);
