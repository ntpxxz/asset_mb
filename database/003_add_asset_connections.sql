-- Create asset_connections table
CREATE TABLE IF NOT EXISTS asset_connections (
    id SERIAL PRIMARY KEY,
    floor_plan_id INTEGER NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
    from_asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    to_asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(floor_plan_id, from_asset_id, to_asset_id)
);

-- Index for faster lookups
CREATE INDEX idx_asset_connections_floor_plan_id ON asset_connections(floor_plan_id);
