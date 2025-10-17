-- Add impsCharge column
ALTER TABLE member_details ADD COLUMN impsCharge INT NULL;

-- Add isImpsPaid column
ALTER TABLE member_details ADD COLUMN isImpsPaid BOOLEAN NULL; 