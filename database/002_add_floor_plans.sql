-- ============================================
-- Migration: Add Floor Plans and Asset Placements
-- Description: Adds tables for managing floor plan images and positioning assets on them.
-- ============================================

-- TABLE: floor_plans
CREATE TABLE IF NOT EXISTS floor_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    level INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: asset_placements
CREATE TABLE IF NOT EXISTS asset_placements (
    id SERIAL PRIMARY KEY,
    floor_plan_id INTEGER NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
    asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    x_position DECIMAL(10, 2) NOT NULL, -- Stored as percentage (0-100)
    y_position DECIMAL(10, 2) NOT NULL, -- Stored as percentage (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(floor_plan_id, asset_id) -- Prevent same asset being placed multiple times on same floor (or across floors? logic might need check)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asset_placements_floor ON asset_placements(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_asset_placements_asset ON asset_placements(asset_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_floor_plans_updated_at ON floor_plans;
CREATE TRIGGER update_floor_plans_updated_at
    BEFORE UPDATE ON floor_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_asset_placements_updated_at ON asset_placements;
CREATE TRIGGER update_asset_placements_updated_at
    BEFORE UPDATE ON asset_placements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
