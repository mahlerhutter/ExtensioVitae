-- Migration: 023_lab_results_schema.sql
-- Description: Creates tables for lab results and biomarkers, plus storage bucket.

-- 1. Create a private storage bucket for lab reports (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('lab-reports', 'lab-reports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the lab_results table (Robust: Create if missing, then ensure columns exist)
CREATE TABLE IF NOT EXISTS public.lab_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist (idempotent for re-runs on existing tables)
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS test_date DATE;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS file_path TEXT;
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.lab_results ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add check constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily in one line, so we DROP first to be safe or ignore)
DO $$ BEGIN
    ALTER TABLE public.lab_results DROP CONSTRAINT IF EXISTS lab_results_status_check;
    ALTER TABLE public.lab_results ADD CONSTRAINT lab_results_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
EXCEPTION
    WHEN undefined_column THEN NULL;
END $$;

-- 3. Create the biomarkers table (The individual data points)
CREATE TABLE IF NOT EXISTS public.biomarkers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    result_id UUID REFERENCES public.lab_results(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- Denormalized for performance
    name TEXT NOT NULL,          -- e.g., 'Vitamin D, 25-Hydroxy'
    slug TEXT NOT NULL,          -- e.g., 'vitamin_d_25_oh' (for trend matching)
    value NUMERIC NOT NULL,      -- e.g., 45.5
    unit TEXT,                   -- e.g., 'ng/mL'
    ref_range_low NUMERIC,       -- e.g., 30.0
    ref_range_high NUMERIC,      -- e.g., 100.0
    category TEXT,               -- e.g., 'Vitamins', 'Lipids', 'Hormones'
    is_out_of_range BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Indexes for Dashboard Performance
CREATE INDEX IF NOT EXISTS idx_lab_results_user_id ON public.lab_results(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_date ON public.lab_results(test_date);
CREATE INDEX IF NOT EXISTS idx_biomarkers_user_id ON public.biomarkers(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_result_id ON public.biomarkers(result_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_slug ON public.biomarkers(slug); -- Critical for "Show me Vitamin D history"

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.lab_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biomarkers ENABLE ROW LEVEL SECURITY;

-- 6. Define RLS Policies for lab_results
DROP POLICY IF EXISTS "Users can view own lab results" ON public.lab_results;
CREATE POLICY "Users can view own lab results" 
    ON public.lab_results FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own lab results" ON public.lab_results;
CREATE POLICY "Users can insert own lab results" 
    ON public.lab_results FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lab results" ON public.lab_results;
CREATE POLICY "Users can update own lab results" 
    ON public.lab_results FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lab results" ON public.lab_results;
CREATE POLICY "Users can delete own lab results" 
    ON public.lab_results FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Define RLS Policies for biomarkers
DROP POLICY IF EXISTS "Users can view own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can view own biomarkers" 
    ON public.biomarkers FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can insert own biomarkers" 
    ON public.biomarkers FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can update own biomarkers" 
    ON public.biomarkers FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own biomarkers" ON public.biomarkers;
CREATE POLICY "Users can delete own biomarkers" 
    ON public.biomarkers FOR DELETE 
    USING (auth.uid() = user_id);

-- 8. Storage Policies (User isolation: 'lab-reports/USER_ID/*')
DROP POLICY IF EXISTS "Users can upload own lab reports" ON storage.objects;
CREATE POLICY "Users can upload own lab reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view own lab reports" ON storage.objects;
CREATE POLICY "Users can view own lab reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete own lab reports" ON storage.objects;
CREATE POLICY "Users can delete own lab reports"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'lab-reports' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
