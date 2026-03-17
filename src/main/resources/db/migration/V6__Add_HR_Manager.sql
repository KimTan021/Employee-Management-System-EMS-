-- Seed an HR Manager User
-- Use an idempotent insert to avoid failing when the user already exists.
INSERT IGNORE INTO users (username, password_hash, role)
VALUES ('hr.manager', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HCGF.O0TK/Y5tZkS2PzAu', 'HR_MANAGER');

-- We won't strictly enforce linking them to an Employee, but they will be able to access the Admin Dashboard.
