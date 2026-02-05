-- ============================================================================
-- Lab Snapshot System - Database Schema (SIMPLIFIED)
-- Migration 020: Biomarker Results & Lab Upload Tracking
-- ============================================================================

-- Step 1: Create lab_uploads table (no dependencies)
CREATE TABLE IF NOT EXISTS lab_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    storage_path TEXT NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending',
    ocr_started_at TIMESTAMPTZ,
    ocr_completed_at TIMESTAMPTZ,
    ocr_error TEXT,
    ocr_provider TEXT DEFAULT 'claude_vision',
    biomarkers_detected INTEGER DEFAULT 0,
    biomarkers_verified INTEGER DEFAULT 0,
    average_confidence NUMERIC,
    test_date DATE,
    lab_name TEXT,
    lab_location TEXT,
    user_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT ocr_status_check CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review'))
);

-- Step 2: Create biomarker_results table (references lab_uploads)
CREATE TABLE IF NOT EXISTS biomarker_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lab_upload_id UUID REFERENCES lab_uploads(id) ON DELETE CASCADE,
    biomarker_name TEXT NOT NULL,
    biomarker_category TEXT,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    reference_min NUMERIC,
    reference_max NUMERIC,
    reference_range_text TEXT,
    optimal_min NUMERIC,
    optimal_max NUMERIC,
    status TEXT,
    test_date DATE NOT NULL,
    lab_name TEXT,
    test_method TEXT,
    ocr_confidence NUMERIC,
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT status_check CHECK (status IN ('optimal', 'borderline', 'low', 'high', 'critical')),
    CONSTRAINT ocr_confidence_check CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1)
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_biomarker_results_user_id ON biomarker_results(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_biomarker_name ON biomarker_results(biomarker_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_test_date ON biomarker_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_user_id ON lab_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_ocr_status ON lab_uploads(ocr_status);

-- Step 4: Enable RLS
ALTER TABLE biomarker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_uploads ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies
CREATE POLICY "Users can view their own biomarker results"
    ON biomarker_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biomarker results"
    ON biomarker_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own lab uploads"
    ON lab_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lab uploads"
    ON lab_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);
