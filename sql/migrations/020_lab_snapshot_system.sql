-- ============================================================================
-- Lab Snapshot System - Database Schema
-- Migration 020: Biomarker Results & Lab Upload Tracking
-- ============================================================================
-- 
-- This migration creates the database schema for the Lab Snapshot Lite feature.
-- Focuses on 10 key biomarkers with OCR extraction and user verification.
--
-- Key Tables:
-- 1. biomarker_results: Stores individual biomarker values from lab tests
-- 2. lab_uploads: Tracks lab report uploads and OCR processing status
--
-- ============================================================================

-- ============================================================================
-- TABLE: lab_uploads
-- ============================================================================
-- Tracks lab report uploads and OCR processing status
-- NOTE: Created FIRST because biomarker_results references it

CREATE TABLE IF NOT EXISTS lab_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File Information
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'pdf', 'jpg', 'png'
    file_size INTEGER, -- bytes
    storage_path TEXT NOT NULL, -- Supabase Storage path
    
    -- OCR Processing
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'manual_review')),
    ocr_started_at TIMESTAMPTZ,
    ocr_completed_at TIMESTAMPTZ,
    ocr_error TEXT,
    ocr_provider TEXT DEFAULT 'claude_vision', -- 'claude_vision', 'google_vision', 'manual'
    
    -- Extraction Results
    biomarkers_detected INTEGER DEFAULT 0,
    biomarkers_verified INTEGER DEFAULT 0,
    average_confidence NUMERIC,
    
    -- Test Information
    test_date DATE,
    lab_name TEXT,
    lab_location TEXT,
    
    -- User Actions
    user_reviewed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB, -- Store raw OCR response, detected text, etc.
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TABLE: biomarker_results
-- ============================================================================
-- Stores individual biomarker values extracted from lab reports
-- NOTE: Created AFTER lab_uploads because it references lab_uploads(id)

CREATE TABLE IF NOT EXISTS biomarker_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lab_upload_id UUID REFERENCES lab_uploads(id) ON DELETE CASCADE,
    
    -- Biomarker Information
    biomarker_name TEXT NOT NULL,
    biomarker_category TEXT, -- e.g., 'vitamins', 'hormones', 'metabolic', 'inflammation'
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL, -- e.g., 'ng/ml', 'mg/dL', 'mmol/L'
    
    -- Reference Ranges
    reference_min NUMERIC,
    reference_max NUMERIC,
    reference_range_text TEXT, -- Original text from lab (e.g., "20-50 ng/ml")
    optimal_min NUMERIC, -- Optimal range (may differ from lab reference)
    optimal_max NUMERIC,
    
    -- Status
    status TEXT CHECK (status IN ('optimal', 'borderline', 'low', 'high', 'critical')),
    
    -- Test Information
    test_date DATE NOT NULL,
    lab_name TEXT,
    test_method TEXT, -- e.g., 'ELISA', 'LC-MS/MS'
    
    -- OCR Metadata
    ocr_confidence NUMERIC CHECK (ocr_confidence >= 0 AND ocr_confidence <= 1),
    manually_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- biomarker_results indexes
CREATE INDEX IF NOT EXISTS idx_biomarker_results_user_id ON biomarker_results(user_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_biomarker_name ON biomarker_results(biomarker_name);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_test_date ON biomarker_results(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_status ON biomarker_results(status);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_user_biomarker ON biomarker_results(user_id, biomarker_name, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_biomarker_results_lab_upload ON biomarker_results(lab_upload_id);

-- lab_uploads indexes
CREATE INDEX IF NOT EXISTS idx_lab_uploads_user_id ON lab_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_ocr_status ON lab_uploads(ocr_status);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_created_at ON lab_uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lab_uploads_test_date ON lab_uploads(test_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE biomarker_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_uploads ENABLE ROW LEVEL SECURITY;

-- biomarker_results policies
CREATE POLICY "Users can view their own biomarker results"
    ON biomarker_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biomarker results"
    ON biomarker_results FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biomarker results"
    ON biomarker_results FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biomarker results"
    ON biomarker_results FOR DELETE
    USING (auth.uid() = user_id);

-- lab_uploads policies
CREATE POLICY "Users can view their own lab uploads"
    ON lab_uploads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lab uploads"
    ON lab_uploads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lab uploads"
    ON lab_uploads FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lab uploads"
    ON lab_uploads FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate biomarker status
CREATE OR REPLACE FUNCTION calculate_biomarker_status(
    p_value NUMERIC,
    p_reference_min NUMERIC,
    p_reference_max NUMERIC,
    p_optimal_min NUMERIC,
    p_optimal_max NUMERIC
)
RETURNS TEXT AS $$
BEGIN
    -- Critical: Way outside reference range
    IF p_reference_min IS NOT NULL AND p_value < p_reference_min * 0.5 THEN
        RETURN 'critical';
    END IF;
    IF p_reference_max IS NOT NULL AND p_value > p_reference_max * 1.5 THEN
        RETURN 'critical';
    END IF;
    
    -- Low: Below reference range
    IF p_reference_min IS NOT NULL AND p_value < p_reference_min THEN
        RETURN 'low';
    END IF;
    
    -- High: Above reference range
    IF p_reference_max IS NOT NULL AND p_value > p_reference_max THEN
        RETURN 'high';
    END IF;
    
    -- Optimal: Within optimal range (if defined)
    IF p_optimal_min IS NOT NULL AND p_optimal_max IS NOT NULL THEN
        IF p_value >= p_optimal_min AND p_value <= p_optimal_max THEN
            RETURN 'optimal';
        ELSE
            RETURN 'borderline';
        END IF;
    END IF;
    
    -- Default: Within reference range
    RETURN 'optimal';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update biomarker status automatically
CREATE OR REPLACE FUNCTION update_biomarker_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status := calculate_biomarker_status(
        NEW.value,
        NEW.reference_min,
        NEW.reference_max,
        NEW.optimal_min,
        NEW.optimal_max
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate status on insert/update
CREATE TRIGGER biomarker_results_status_trigger
    BEFORE INSERT OR UPDATE ON biomarker_results
    FOR EACH ROW
    EXECUTE FUNCTION update_biomarker_status();

-- Function to update lab_upload statistics
CREATE OR REPLACE FUNCTION update_lab_upload_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE lab_uploads
    SET 
        biomarkers_detected = (
            SELECT COUNT(*) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id
        ),
        biomarkers_verified = (
            SELECT COUNT(*) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id 
            AND manually_verified = TRUE
        ),
        average_confidence = (
            SELECT AVG(ocr_confidence) 
            FROM biomarker_results 
            WHERE lab_upload_id = NEW.lab_upload_id 
            AND ocr_confidence IS NOT NULL
        ),
        updated_at = NOW()
    WHERE id = NEW.lab_upload_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lab_upload stats when biomarker results change
CREATE TRIGGER biomarker_results_stats_trigger
    AFTER INSERT OR UPDATE OR DELETE ON biomarker_results
    FOR EACH ROW
    EXECUTE FUNCTION update_lab_upload_stats();

-- ============================================================================
-- REFERENCE DATA: Standard Biomarkers
-- ============================================================================

-- Table for standard biomarker definitions (optional, for UI consistency)
CREATE TABLE IF NOT EXISTS biomarker_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    common_units TEXT[], -- Array of common units
    typical_reference_min NUMERIC,
    typical_reference_max NUMERIC,
    optimal_min NUMERIC,
    optimal_max NUMERIC,
    interpretation_low TEXT,
    interpretation_high TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 10 key biomarkers for Lab Snapshot Lite
INSERT INTO biomarker_definitions (name, display_name, category, description, common_units, typical_reference_min, typical_reference_max, optimal_min, optimal_max, interpretation_low, interpretation_high)
VALUES
    ('vitamin_d', 'Vitamin D (25-OH)', 'vitamins', 'Vitamin D status indicator', ARRAY['ng/ml', 'nmol/L'], 20, 50, 40, 80, 'Deficiency - Supplement with 5000 IU/day', 'Excess - Reduce supplementation'),
    ('vitamin_b12', 'Vitamin B12', 'vitamins', 'B12 status and neurological health', ARRAY['pg/ml', 'pmol/L'], 200, 900, 400, 800, 'Deficiency - Consider B12 supplementation', 'Excess - Usually not concerning'),
    ('ferritin', 'Ferritin', 'minerals', 'Iron storage indicator', ARRAY['ng/ml', 'μg/L'], 30, 400, 50, 150, 'Low iron stores - Increase iron intake', 'High - Check for inflammation or hemochromatosis'),
    ('tsh', 'TSH (Thyroid Stimulating Hormone)', 'hormones', 'Thyroid function indicator', ARRAY['mIU/L', 'μIU/ml'], 0.4, 4.0, 1.0, 2.5, 'Hyperthyroidism - Consult endocrinologist', 'Hypothyroidism - Consult endocrinologist'),
    ('hba1c', 'HbA1c (Glycated Hemoglobin)', 'metabolic', 'Long-term blood sugar control', ARRAY['%', 'mmol/mol'], 4.0, 5.6, 4.0, 5.4, 'Hypoglycemia - Monitor blood sugar', 'Prediabetes/Diabetes - Consult physician'),
    ('total_cholesterol', 'Total Cholesterol', 'lipids', 'Overall cholesterol level', ARRAY['mg/dL', 'mmol/L'], 125, 200, 150, 180, 'Low - Usually not concerning', 'High - Consider diet and lifestyle changes'),
    ('triglycerides', 'Triglycerides', 'lipids', 'Blood fat level', ARRAY['mg/dL', 'mmol/L'], 0, 150, 0, 100, 'Low - Usually not concerning', 'High - Reduce sugar and alcohol intake'),
    ('crp', 'CRP (C-Reactive Protein)', 'inflammation', 'Inflammation marker', ARRAY['mg/L', 'mg/dL'], 0, 3.0, 0, 1.0, 'Low - Good', 'High - Inflammation present'),
    ('glucose_fasting', 'Fasting Glucose', 'metabolic', 'Blood sugar level (fasting)', ARRAY['mg/dL', 'mmol/L'], 70, 100, 75, 90, 'Hypoglycemia - Monitor and adjust diet', 'Prediabetes - Reduce carb intake'),
    ('creatinine', 'Creatinine', 'kidney', 'Kidney function indicator', ARRAY['mg/dL', 'μmol/L'], 0.6, 1.2, 0.7, 1.0, 'Low - Usually not concerning', 'High - Check kidney function')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Latest biomarker results per user
CREATE OR REPLACE VIEW latest_biomarker_results AS
SELECT DISTINCT ON (user_id, biomarker_name)
    id,
    user_id,
    biomarker_name,
    value,
    unit,
    status,
    test_date,
    lab_name,
    ocr_confidence,
    manually_verified,
    created_at
FROM biomarker_results
ORDER BY user_id, biomarker_name, test_date DESC, created_at DESC;

-- View: Biomarker trends (last 3 results per biomarker)
CREATE OR REPLACE VIEW biomarker_trends AS
SELECT 
    user_id,
    biomarker_name,
    ARRAY_AGG(value ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS values,
    ARRAY_AGG(test_date ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS dates,
    ARRAY_AGG(status ORDER BY test_date DESC) FILTER (WHERE rn <= 3) AS statuses
FROM (
    SELECT 
        user_id,
        biomarker_name,
        value,
        test_date,
        status,
        ROW_NUMBER() OVER (PARTITION BY user_id, biomarker_name ORDER BY test_date DESC) AS rn
    FROM biomarker_results
) ranked
WHERE rn <= 3
GROUP BY user_id, biomarker_name;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE biomarker_results IS 'Stores individual biomarker values from lab tests';
COMMENT ON TABLE lab_uploads IS 'Tracks lab report uploads and OCR processing status';
COMMENT ON TABLE biomarker_definitions IS 'Reference data for standard biomarker definitions';

COMMENT ON COLUMN biomarker_results.ocr_confidence IS 'Confidence score from OCR (0-1), null if manually entered';
COMMENT ON COLUMN biomarker_results.status IS 'Calculated status: optimal, borderline, low, high, critical';
COMMENT ON COLUMN lab_uploads.ocr_status IS 'OCR processing status: pending, processing, completed, failed, manual_review';

-- ============================================================================
-- GRANTS (if needed for service role)
-- ============================================================================

-- Grant access to authenticated users (handled by RLS policies)
-- No additional grants needed

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Migration: 020_lab_snapshot_system.sql
-- Created: 2026-02-05
-- Description: Lab Snapshot Lite - Biomarker tracking with OCR extraction
-- Tables: biomarker_results, lab_uploads, biomarker_definitions
-- Features: RLS policies, auto-status calculation, statistics tracking
