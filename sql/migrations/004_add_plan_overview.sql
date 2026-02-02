-- Migration: Add Plan Overview and Adjustments
-- Date: 2026-02-02
-- Description: Add columns to support plan review and refinement feature

-- Add plan overview metadata
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_overview JSONB;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS plan_iterations INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_adjustments JSONB;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_plans_plan_iterations ON plans(plan_iterations);

-- Add comments
COMMENT ON COLUMN plans.plan_overview IS 'Metadata about the plan including focus breakdown, phases, time commitment, etc.';
COMMENT ON COLUMN plans.plan_iterations IS 'Number of times the plan was regenerated before user confirmation';
COMMENT ON COLUMN plans.user_adjustments IS 'User adjustments made during plan review (intensity, time budget, exclusions, etc.)';

-- Example plan_overview structure:
-- {
--   "title": "Your Personalized Longevity Blueprint",
--   "tagline": "Focus on Sleep Optimization & Stress Management",
--   "projected_impact": "+3.2 years",
--   "daily_commitment_avg": 35,
--   "daily_commitment_range": [20, 50],
--   "difficulty": "moderate",
--   "phases": [
--     {
--       "name": "Foundation",
--       "days": "1-10",
--       "focus": "Building habits, gentle introduction",
--       "intensity": "low-medium"
--     },
--     {
--       "name": "Growth",
--       "days": "11-20",
--       "focus": "Increasing complexity, adding variety",
--       "intensity": "medium-high"
--     },
--     {
--       "name": "Mastery",
--       "days": "21-30",
--       "focus": "Optimization, advanced techniques",
--       "intensity": "medium-high"
--     }
--   ],
--   "focus_breakdown": {
--     "movement": 25,
--     "nutrition": 20,
--     "sleep": 30,
--     "stress": 15,
--     "cognitive": 5,
--     "social": 5
--   },
--   "sample_activities": [
--     {
--       "day": 3,
--       "activities": ["10-min morning walk", "5-min box breathing", "Sleep journal"]
--     },
--     {
--       "day": 15,
--       "activities": ["20-min HIIT workout", "Prepare overnight oats", "15-min meditation"]
--     },
--     {
--       "day": 28,
--       "activities": ["30-min nature walk", "Advanced breathwork", "Gratitude practice"]
--     }
--   ]
-- }

-- Example user_adjustments structure:
-- {
--   "intensity": "moderate",
--   "time_budget": 30,
--   "focus_percentages": {
--     "movement": 25,
--     "nutrition": 20,
--     "sleep": 30,
--     "stress": 15,
--     "cognitive": 5,
--     "social": 5
--   },
--   "exclusions": ["cold_exposure", "fasting"],
--   "preferences": {
--     "exercise_types": ["yoga", "walking"],
--     "timing_preference": "morning"
--   }
-- }
