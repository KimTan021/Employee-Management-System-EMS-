-- Update admin password to a newly generated valid bcrypt hash for 'p4ssw0rd'
UPDATE users 
SET password_hash = '$2a$10$W1y.dhQEaSLyaOtGfvayT.zRqsi6mUAxTx5RPRkOp47Cbkldi6j2W' 
WHERE username = 'admin';
