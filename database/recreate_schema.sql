-- Recreate Assets Table Schema
-- Drops existing table and creates new one with correct columns and timestamps

DROP TABLE IF EXISTS assets CASCADE;

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR(255) UNIQUE, -- Generated or mapped from PC Name
    
    -- Imported Columns
    building_or_factory VARCHAR(255),
    division VARCHAR(255),
    section VARCHAR(255),
    area VARCHAR(255),
    pc_name VARCHAR(255),
    pc_type VARCHAR(100),
    
    -- Separated Maker and Model
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    
    serial_number_cpu VARCHAR(255),
    user_owner VARCHAR(255),
    os_use VARCHAR(255),
    license_free VARCHAR(255),
    window_license VARCHAR(255),
    os_license VARCHAR(255),
    ms_office TEXT,
    version VARCHAR(100),
    legally_purchase VARCHAR(100),
    refer_document TEXT,
    
    -- Technical Specifications
    processor VARCHAR(255),
    memory VARCHAR(255),     -- RAM
    storage VARCHAR(255),    -- HDD/SSD
    
    -- Network Configuration
    ip_address VARCHAR(50),
    mac_address VARCHAR(50),
    hostname VARCHAR(255),
    
    -- Standard Asset Management Columns
    status VARCHAR(50) DEFAULT 'active',
    condition VARCHAR(50) DEFAULT 'good',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
