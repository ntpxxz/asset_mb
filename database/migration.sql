-- ============================================
-- ITAM Database Migration Script
-- Purpose: Add missing columns to existing database
-- Date: 2025-12-02
-- ============================================

-- Start transaction
BEGIN;

-- ============================================
-- UPDATE: assets table - Add missing columns
-- ============================================

-- Location & Organization fields
ALTER TABLE assets ADD COLUMN IF NOT EXISTS building VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS division VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS section VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS area VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS pc_name VARCHAR(255);

-- Operating System & Software fields
ALTER TABLE assets ADD COLUMN IF NOT EXISTS os_key VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS os_version VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS ms_office_apps TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS ms_office_version VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS is_legally_purchased VARCHAR(50);

-- Ensure all standard fields exist
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_tag VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS type VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS model VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS serialnumber VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchasedate DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS purchaseprice DECIMAL(12, 2);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warrantyexpiry DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS assigneduser VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'available';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'good';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS operatingsystem VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS processor VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS memory VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS storage VARCHAR(100);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS hostname VARCHAR(255);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS ipaddress VARCHAR(45);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS macaddress VARCHAR(17);
ALTER TABLE assets ADD COLUMN IF NOT EXISTS patchstatus VARCHAR(50) DEFAULT 'needs-review';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS lastpatch_check DATE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS isloanable BOOLEAN DEFAULT FALSE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigneduser ON assets(assigneduser);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_building ON assets(building);
CREATE INDEX IF NOT EXISTS idx_assets_division ON assets(division);
CREATE INDEX IF NOT EXISTS idx_assets_warrantyexpiry ON assets(warrantyexpiry);

-- ============================================
-- UPDATE: inventory_items table
-- ============================================
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS barcode VARCHAR(255);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(12, 2);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS supplier VARCHAR(255);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);

-- ============================================
-- UPDATE: inventory_transactions table
-- ============================================
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS item_id INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS quantity_change INTEGER;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(12, 2);
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(created_at);

-- ============================================
-- UPDATE: users table
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS firstname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS lastname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS position VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- ============================================
-- CREATE OR UPDATE: Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory_items;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create triggers
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Commit transaction
COMMIT;

-- ============================================
-- Verification Queries (Optional - Run separately)
-- ============================================

-- Check assets table columns
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'assets' 
-- ORDER BY ordinal_position;

-- Check inventory_items table columns
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_items' 
-- ORDER BY ordinal_position;

-- Check inventory_transactions table columns
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_transactions' 
-- ORDER BY ordinal_position;

-- Check users table columns
-- SELECT column_name, data_type, character_maximum_length 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- ============================================
-- END OF MIGRATION
-- ============================================
