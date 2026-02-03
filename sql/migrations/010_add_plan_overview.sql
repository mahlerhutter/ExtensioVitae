-- Add missing plan_overview column to plans table
-- This column stores a summary/overview of the plan for quick display

ALTER TABLE plans 
ADD COLUMN IF NOT EXISTS plan_overview JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN plans.plan_overview IS 'Summary overview of the plan (pillar breakdown, key stats, etc.)';
