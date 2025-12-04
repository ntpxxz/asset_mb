-- ============================================================================
-- Rollback Migration: Restore Unused Columns
-- Date: 2025-12-04
-- Description: Rollback script for 001_remove_unused_columns.sql
-- 
-- WARNING: This script will restore the column structure but NOT the data!
-- Only use this if you need to rollback the migration immediately after
-- applying it and have a backup to restore data from.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Verify rollback intent
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ROLLBACK: Restoring unused columns';
    RAISE NOTICE 'WARNING: This will restore columns but NOT data!';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- STEP 2: Restore columns to ASSETS table
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Restoring columns to assets table...';
END $$;

ALTER TABLE assets 
  ADD COLUMN IF NOT EXISTS building VARCHAR(255),
  ADD COLUMN IF NOT EXISTS division VARCHAR(255),
  ADD COLUMN IF NOT EXISTS section VARCHAR(255),
  ADD COLUMN IF NOT EXISTS area VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pc_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS license_free VARCHAR(255),
  ADD COLUMN IF NOT EXISTS os_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS os_version VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ms_office_apps TEXT,
  ADD COLUMN IF NOT EXISTS ms_office_version VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_legally_purchased VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refer_document TEXT,
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mac_address VARCHAR(255);

DO $$
BEGIN
    RAISE NOTICE 'Restored 14 columns to assets table';
END $$;

-- ============================================================================
-- STEP 3: Restore columns to INVENTORY_ITEMS table
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Restoring columns to inventory_items table...';
END $$;

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

DO $$
BEGIN
    RAISE NOTICE 'Restored 4 columns to inventory_items table';
END $$;

-- ============================================================================
-- STEP 4: Restore columns to INVENTORY_TRANSACTIONS table
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Restoring columns to inventory_transactions table...';
END $$;

ALTER TABLE inventory_transactions
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;

DO $$
BEGIN
    RAISE NOTICE 'Restored 2 columns to inventory_transactions table';
END $$;

-- ============================================================================
-- STEP 5: Restore columns to USERS table
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Restoring columns to users table...';
END $$;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS position VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

DO $$
BEGIN
    RAISE NOTICE 'Restored 2 columns to users table';
END $$;

-- ============================================================================
-- STEP 6: Log rollback
-- ============================================================================
DO $$
BEGIN
    -- Log the rollback
    INSERT INTO schema_migrations (migration_name, description)
    VALUES (
        '001_remove_unused_columns_rollback',
        'Rolled back: Restored 22 columns to assets, inventory_items, inventory_transactions, and users tables (structure only, no data)'
    );
    
    RAISE NOTICE 'Rollback logged successfully';
END $$;

COMMIT;

-- ============================================================================
-- STEP 7: Display restored schema
-- ============================================================================
SELECT 
  table_name, 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('assets', 'inventory_items', 'inventory_transactions', 'users')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- Rollback Complete
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Rollback completed successfully!';
    RAISE NOTICE 'IMPORTANT: Columns restored but contain NO DATA';
    RAISE NOTICE 'Restore data from backup if needed';
    RAISE NOTICE 'Timestamp: %', NOW();
    RAISE NOTICE '============================================================';
END $$;

-- ============================================================================
-- NEXT STEPS AFTER ROLLBACK
-- ============================================================================
-- If you need to restore data, use:
-- psql -U rootpg -d asset_management < your_backup_file.sql
-- 
-- Or restore specific tables:
-- pg_restore -U rootpg -d asset_management -t assets your_backup_file.dump
-- ============================================================================
