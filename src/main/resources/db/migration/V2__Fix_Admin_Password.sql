-- Fix the admin password to correctly hash 'p4ssw0rd' instead of 'password'
UPDATE users SET password_hash = '$2a$10$Wcry8mjGISamZdHm1Pg.Se1He97n3t.S26pR8zgxb/Gsx11dXnDKu' WHERE username = 'admin';
