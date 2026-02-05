-- Migration 024: Fix column mismatch (lab_date vs test_date)
-- Description: Ensures we strictly use 'test_date' and removes 'lab_date' if it exists.

DO $$
BEGIN
    -- 1. If 'lab_date' exists, we need to handle it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'lab_date') THEN
        
        -- If 'test_date' does NOT exist, just rename 'lab_date' -> 'test_date'
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lab_results' AND column_name = 'test_date') THEN
            ALTER TABLE public.lab_results RENAME COLUMN lab_date TO test_date;
        
        ELSE
            -- Both exist. 'lab_date' might have the NOT NULL constraint causing issues.
            -- Copy data if needed
            UPDATE public.lab_results SET test_date = lab_date WHERE test_date IS NULL;
            
            -- Drop the problematic column
            ALTER TABLE public.lab_results DROP COLUMN lab_date;
        END IF;
    END IF;
END $$;

-- 2. Make sure 'test_date' is definitely there
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS test_date DATE;

-- 3. Ensure 'test_date' is NOT NULL (since our logic relies on it being set, usually to current date on upload)
-- Recalculate nulls first to avoid errors
UPDATE public.lab_results SET test_date = CURRENT_DATE WHERE test_date IS NULL;
ALTER TABLE public.lab_results ALTER COLUMN test_date SET NOT NULL;
