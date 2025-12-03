-- Fix column name mismatches between database and API
-- This aligns the database schema with what the API expects

-- Rename columns to match API expectations
ALTER TABLE assets RENAME COLUMN user_owner TO assigneduser;
ALTER TABLE assets RENAME COLUMN building_or_factory TO building;
ALTER TABLE assets RENAME COLUMN serial_number_cpu TO serialnumber;
ALTER TABLE assets RENAME COLUMN pc_type TO type;
ALTER TABLE assets RENAME COLUMN os_use TO operatingsystem;
ALTER TABLE assets RENAME COLUMN window_license TO os_key;
ALTER TABLE assets RENAME COLUMN os_license TO os_version;
ALTER TABLE assets RENAME COLUMN version TO ms_office_version;
ALTER TABLE assets RENAME COLUMN legally_purchase TO is_legally_purchased;
ALTER TABLE assets RENAME COLUMN refer_document TO notes;

-- Add missing columns that the API expects
ALTER TABLE assets ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchasedate DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchaseprice DECIMAL(10,2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warrantyexpiry DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS patchstatus VARCHAR(50) DEFAULT 'needs-review';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS lastpatch_check DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS isloanable BOOLEAN DEFAULT false;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS description TEXT;

-- Rename ms_office to ms_office_apps for clarity
ALTER TABLE assets RENAME COLUMN ms_office TO ms_office_apps;
