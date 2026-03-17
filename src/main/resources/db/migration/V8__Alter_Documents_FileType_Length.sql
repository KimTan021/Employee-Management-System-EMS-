-- MIME types (e.g. docx) can exceed 50 characters; widen to avoid 500 errors on upload.
ALTER TABLE documents
  MODIFY COLUMN file_type VARCHAR(255) NOT NULL;

