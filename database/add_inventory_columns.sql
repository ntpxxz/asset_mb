-- Migration: Add missing columns to inventory_items table
-- Date: 2025-12-09
-- Description: Adds min_stock_level and is_active columns that the application code expects

-- Add min_stock_level column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'min_stock_level'
    ) THEN
        ALTER TABLE inventory_items ADD COLUMN min_stock_level INTEGER NOT NULL DEFAULT 5;
        RAISE NOTICE 'Column min_stock_level added successfully.';
    ELSE
        RAISE NOTICE 'Column min_stock_level already exists.';
    END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory_items' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE inventory_items ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
        RAISE NOTICE 'Column is_active added successfully.';
    ELSE
        RAISE NOTICE 'Column is_active already exists.';
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_items'
ORDER BY ordinal_position;
