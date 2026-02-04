-- Migration 017: Biological Inventory & Fulfillment Bridge (v0.8.0)
-- Purpose: Track supplement inventory and predict depletion
-- Axiom: AX-3 Real-World Execution - Reduce cognitive load by automating supply management

-- User Supplement Inventory
CREATE TABLE IF NOT EXISTS user_supplement_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_name TEXT NOT NULL,
    supplement_slug TEXT NOT NULL, -- e.g. 'magnesium', 'vitamin_d3'
    dosage_unit TEXT NOT NULL, -- 'capsules', 'ml', 'tablets', 'grams'
    current_stock NUMERIC NOT NULL DEFAULT 0, -- Current quantity in stock
    daily_consumption_rate NUMERIC DEFAULT 0, -- Auto-calculated based on protocols
    reorder_threshold NUMERIC DEFAULT 7, -- Days of supply before warning
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, supplement_slug)
);

-- Consumption History (for compliance tracking & prediction refinement)
CREATE TABLE IF NOT EXISTS supplement_consumption_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_slug TEXT NOT NULL,
    consumed_amount NUMERIC NOT NULL,
    consumed_at TIMESTAMPTZ DEFAULT NOW(),
    protocol_id TEXT, -- Optional: which protocol triggered this consumption
    compliance BOOLEAN DEFAULT TRUE -- Did user actually take it?
);

-- Reorder History (for supply chain analytics)
CREATE TABLE IF NOT EXISTS supplement_reorder_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    supplement_slug TEXT NOT NULL,
    ordered_quantity NUMERIC NOT NULL,
    ordered_at TIMESTAMPTZ DEFAULT NOW(),
    expected_arrival TIMESTAMPTZ,
    fulfilled BOOLEAN DEFAULT FALSE,
    fulfillment_method TEXT -- 'whatsapp', 'email', 'manual'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_supplement_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_user_date ON supplement_consumption_log(user_id, consumed_at DESC);
CREATE INDEX IF NOT EXISTS idx_reorder_user ON supplement_reorder_log(user_id, ordered_at DESC);

-- RLS Policies
ALTER TABLE user_supplement_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_consumption_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplement_reorder_log ENABLE ROW LEVEL SECURITY;

-- Inventory policies
CREATE POLICY "Users can view own inventory" ON user_supplement_inventory
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own inventory" ON user_supplement_inventory
    FOR ALL USING (auth.uid() = user_id);

-- Consumption log policies
CREATE POLICY "Users can view own consumption log" ON supplement_consumption_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log own consumption" ON supplement_consumption_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reorder log policies
CREATE POLICY "Users can view own reorder log" ON supplement_reorder_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reorder log" ON supplement_reorder_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reorder log" ON supplement_reorder_log
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_timestamp
    BEFORE UPDATE ON user_supplement_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_timestamp();

-- NOTE: Default inventory is initialized per-user via inventoryService.initializeInventory()
-- Seed data cannot be added here because auth.uid() is NULL during migration

COMMENT ON TABLE user_supplement_inventory IS 'v0.8.0: Tracks user supplement inventory for predictive reordering';
COMMENT ON TABLE supplement_consumption_log IS 'v0.8.0: Logs actual supplement consumption for compliance tracking';
COMMENT ON TABLE supplement_reorder_log IS 'v0.8.0: Tracks reorder history for supply chain optimization';
