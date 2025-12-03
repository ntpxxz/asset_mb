-- ============================================
-- ITAM Database Schema Export
-- Generated: 2025-12-02
-- Description: Complete database schema for IT Asset Management System
-- ============================================

-- ============================================
-- TABLE: assets
-- Description: Main table for hardware assets (computers, network equipment, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Basic Asset Information
    asset_tag VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(100) NOT NULL,  -- laptop, desktop, server, router, switch, monitor, printer, etc.
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serialnumber VARCHAR(255) UNIQUE NOT NULL,
    
    -- Purchase Information
    purchasedate DATE,
    purchaseprice DECIMAL(12, 2),
    supplier VARCHAR(255),
    warrantyexpiry DATE,
    
    -- Assignment & Location
    assigneduser VARCHAR(255),  -- Free text field (no FK constraint)
    location VARCHAR(255),
    department VARCHAR(255),
    
    -- Organizational Structure (New Fields)
    building VARCHAR(255),
    division VARCHAR(255),
    section VARCHAR(255),
    area VARCHAR(255),
    pc_name VARCHAR(255),
    
    -- Status & Condition
    status VARCHAR(50) DEFAULT 'available',  -- available, assigned, maintenance, retired
    condition VARCHAR(50) DEFAULT 'good',    -- new, good, fair, poor, broken
    
    -- Operating System & Software (for computers)
    operatingsystem VARCHAR(255),
    os_version VARCHAR(255),
    os_key VARCHAR(255),
    ms_office_apps TEXT,
    ms_office_version VARCHAR(100),
    is_legally_purchased VARCHAR(50),  -- yes, no, unknown
    
    -- Technical Specifications (for computers)
    processor VARCHAR(255),
    memory VARCHAR(100),
    storage VARCHAR(100),
    
    -- Network Configuration
    hostname VARCHAR(255),
    ipaddress VARCHAR(45),  -- Supports IPv4 and IPv6
    macaddress VARCHAR(17),
    
    -- Patch Management
    patchstatus VARCHAR(50) DEFAULT 'needs-review',  -- up-to-date, needs-review, pending
    lastpatch_check DATE,
    
    -- Additional Information
    isloanable BOOLEAN DEFAULT FALSE,
    description TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigneduser ON assets(assigneduser);
CREATE INDEX IF NOT EXISTS idx_assets_location ON assets(location);
CREATE INDEX IF NOT EXISTS idx_assets_building ON assets(building);
CREATE INDEX IF NOT EXISTS idx_assets_division ON assets(division);
CREATE INDEX IF NOT EXISTS idx_assets_warrantyexpiry ON assets(warrantyexpiry);

-- ============================================
-- TABLE: inventory_items
-- Description: Inventory/stock items (consumables, accessories, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    barcode VARCHAR(255) UNIQUE,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    price_per_unit DECIMAL(12, 2),
    location VARCHAR(255),
    supplier VARCHAR(255),
    image_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory_items(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);

-- ============================================
-- TABLE: inventory_transactions
-- Description: Transaction history for inventory items
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    user_id VARCHAR(255),  -- Free text field (no FK constraint)
    transaction_type VARCHAR(50) NOT NULL,  -- dispense, return, adjust
    quantity_change INTEGER NOT NULL,
    price_per_unit DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_item ON inventory_transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON inventory_transactions(created_at);

-- ============================================
-- TABLE: users
-- Description: System users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    department VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',  -- admin, user, viewer
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employee_id);

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to assets table
DROP TRIGGER IF EXISTS update_assets_updated_at ON assets;
CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to inventory_items table
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS: Field descriptions
-- ============================================
COMMENT ON TABLE assets IS 'Hardware assets including computers, network equipment, and peripherals';
COMMENT ON COLUMN assets.asset_tag IS 'Unique identifier for the asset';
COMMENT ON COLUMN assets.type IS 'Asset type: laptop, desktop, server, router, switch, firewall, access-point, gateway, monitor, printer, etc.';
COMMENT ON COLUMN assets.assigneduser IS 'User assigned to this asset (free text, no foreign key)';
COMMENT ON COLUMN assets.building IS 'Building or factory location';
COMMENT ON COLUMN assets.division IS 'Division/Department';
COMMENT ON COLUMN assets.section IS 'Section within division';
COMMENT ON COLUMN assets.area IS 'Specific area or zone';
COMMENT ON COLUMN assets.pc_name IS 'Computer name/hostname';
COMMENT ON COLUMN assets.os_key IS 'Operating system license key';
COMMENT ON COLUMN assets.ms_office_apps IS 'Installed Microsoft Office applications';
COMMENT ON COLUMN assets.is_legally_purchased IS 'Whether software is legally purchased (yes/no/unknown)';

COMMENT ON TABLE inventory_items IS 'Consumable items and accessories in stock';
COMMENT ON TABLE inventory_transactions IS 'Transaction history for inventory items (dispense, return, adjust)';
COMMENT ON TABLE users IS 'System users and employees';

-- ============================================
-- END OF SCHEMA
-- ============================================
