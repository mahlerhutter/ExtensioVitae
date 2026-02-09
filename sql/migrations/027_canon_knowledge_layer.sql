-- =====================================================
-- Migration 027: Canon Knowledge Layer
-- =====================================================
-- Purpose: Non-negotiable Longevity Principles for RAG Decision Engine
-- Dependencies: Requires pgvector extension
-- Author: RAG Implementation Phase 2
-- Date: 2026-02-08
-- =====================================================

-- =====================================================
-- 1. ENABLE PGVECTOR EXTENSION (if not already enabled)
-- =====================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 2. CREATE CANON_ENTRIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS canon_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- ==========================================
    -- CORE CONTENT
    -- ==========================================
    domain TEXT NOT NULL CHECK (domain IN (
        'sleep_regulation',
        'metabolic_health',
        'movement_hierarchy',
        'stress_nervous_system',
        'meaning_purpose'
    )),
    doctrine TEXT NOT NULL, -- The "What" statement (1-2 sentences)
    mechanism TEXT NOT NULL, -- The "Why" explanation (3-5 sentences)
    
    -- ==========================================
    -- VECTOR EMBEDDING (for semantic search)
    -- ==========================================
    embedding vector(1536), -- OpenAI text-embedding-3-small
    
    -- ==========================================
    -- APPLICABILITY RULES
    -- ==========================================
    applicability_conditions JSONB DEFAULT '{}'::jsonb,
    -- Example: {"sleep_debt": ["none", "mild"]}
    -- Means: This canon entry only applies when sleep_debt is "none" or "mild"
    
    contraindications JSONB DEFAULT '[]'::jsonb,
    -- Example: [{"field": "sleep_debt", "value": "severe"}]
    -- Means: This canon entry does NOT apply when sleep_debt is "severe"
    
    -- ==========================================
    -- EVIDENCE GRADING
    -- ==========================================
    evidence_grade TEXT CHECK (evidence_grade IN ('S', 'A', 'B', 'C')),
    -- S: Consensus (e.g., sleep matters)
    -- A: RCT-backed (randomized controlled trials)
    -- B: Observational studies
    -- C: Expert opinion / mechanistic reasoning
    
    -- ==========================================
    -- SOURCE CITATIONS
    -- ==========================================
    source_citations TEXT[] DEFAULT '{}',
    -- Example: ["Walker, M. (2017). Why We Sleep. Scribner."]
    
    -- ==========================================
    -- VERSIONING
    -- ==========================================
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    retired_at TIMESTAMPTZ -- When this entry is superseded by a new version
);

-- =====================================================
-- 3. INDEXES
-- =====================================================

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_canon_embedding ON canon_entries 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100); -- Adjust based on dataset size (100 lists for ~10k rows)

-- Domain filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_canon_domain ON canon_entries(domain) 
WHERE retired_at IS NULL;

-- Evidence grade filtering
CREATE INDEX IF NOT EXISTS idx_canon_evidence_grade ON canon_entries(evidence_grade)
WHERE retired_at IS NULL;

-- Active entries (not retired)
CREATE INDEX IF NOT EXISTS idx_canon_active ON canon_entries(created_at DESC)
WHERE retired_at IS NULL;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE canon_entries ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read canon entries
CREATE POLICY canon_entries_select_all ON canon_entries
    FOR SELECT
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Only service role can insert/update/delete (admin operations)
CREATE POLICY canon_entries_admin_all ON canon_entries
    FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- 5. HELPER FUNCTION: Semantic Search
-- =====================================================

CREATE OR REPLACE FUNCTION search_canon_entries(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    filter_domain TEXT DEFAULT NULL,
    filter_user_state JSONB DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    domain TEXT,
    doctrine TEXT,
    mechanism TEXT,
    evidence_grade TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.domain,
        ce.doctrine,
        ce.mechanism,
        ce.evidence_grade,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM canon_entries ce
    WHERE
        ce.retired_at IS NULL
        AND (filter_domain IS NULL OR ce.domain = filter_domain)
        AND 1 - (ce.embedding <=> query_embedding) > match_threshold
        -- TODO: Add applicability_conditions filtering based on filter_user_state
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- =====================================================
-- 6. HELPER FUNCTION: Get Canon Entries by Domain
-- =====================================================

CREATE OR REPLACE FUNCTION get_canon_by_domain(
    p_domain TEXT,
    p_include_retired BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    domain TEXT,
    doctrine TEXT,
    mechanism TEXT,
    applicability_conditions JSONB,
    contraindications JSONB,
    evidence_grade TEXT,
    source_citations TEXT[],
    version INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.id,
        ce.domain,
        ce.doctrine,
        ce.mechanism,
        ce.applicability_conditions,
        ce.contraindications,
        ce.evidence_grade,
        ce.source_citations,
        ce.version
    FROM canon_entries ce
    WHERE
        ce.domain = p_domain
        AND (p_include_retired OR ce.retired_at IS NULL)
    ORDER BY ce.evidence_grade ASC, ce.created_at DESC;
END;
$$;

-- =====================================================
-- 7. HELPER FUNCTION: Check Applicability
-- =====================================================

CREATE OR REPLACE FUNCTION check_canon_applicability(
    p_canon_id UUID,
    p_user_state JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_canon RECORD;
    v_condition_key TEXT;
    v_condition_values JSONB;
    v_user_value TEXT;
    v_contraindication JSONB;
BEGIN
    -- Get canon entry
    SELECT * INTO v_canon
    FROM canon_entries
    WHERE id = p_canon_id AND retired_at IS NULL;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check contraindications (if any match, return false)
    FOR v_contraindication IN SELECT * FROM jsonb_array_elements(v_canon.contraindications)
    LOOP
        v_condition_key := v_contraindication->>'field';
        v_user_value := p_user_state->>v_condition_key;
        
        IF v_user_value = v_contraindication->>'value' THEN
            RETURN false; -- Contraindication matched
        END IF;
    END LOOP;
    
    -- Check applicability_conditions (all must match if specified)
    FOR v_condition_key IN SELECT * FROM jsonb_object_keys(v_canon.applicability_conditions)
    LOOP
        v_condition_values := v_canon.applicability_conditions->v_condition_key;
        v_user_value := p_user_state->>v_condition_key;
        
        -- Check if user_value is in allowed values
        IF NOT (v_condition_values ? v_user_value) THEN
            RETURN false; -- Condition not met
        END IF;
    END LOOP;
    
    RETURN true; -- All checks passed
END;
$$;

-- =====================================================
-- 8. TRIGGER: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_canon_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_canon_entries_updated_at
    BEFORE UPDATE ON canon_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_canon_entries_updated_at();

-- =====================================================
-- 9. COMMENTS (Documentation)
-- =====================================================

COMMENT ON TABLE canon_entries IS 'Non-negotiable longevity principles that always apply (independent of user state). Foundation of RAG Decision Engine.';

COMMENT ON COLUMN canon_entries.domain IS 'Longevity domain: sleep_regulation, metabolic_health, movement_hierarchy, stress_nervous_system, meaning_purpose';
COMMENT ON COLUMN canon_entries.doctrine IS 'The "What" statement (1-2 sentences). Example: "Sleep timing consistency matters more than duration."';
COMMENT ON COLUMN canon_entries.mechanism IS 'The "Why" explanation (3-5 sentences). Explains biological/physiological mechanism.';
COMMENT ON COLUMN canon_entries.embedding IS 'Vector embedding (1536 dimensions) for semantic search using OpenAI text-embedding-3-small';
COMMENT ON COLUMN canon_entries.applicability_conditions IS 'JSONB object defining when this entry applies. Example: {"sleep_debt": ["none", "mild"]}';
COMMENT ON COLUMN canon_entries.contraindications IS 'JSONB array of conditions when this entry does NOT apply. Example: [{"field": "sleep_debt", "value": "severe"}]';
COMMENT ON COLUMN canon_entries.evidence_grade IS 'Evidence strength: S (consensus), A (RCT), B (observational), C (expert opinion)';
COMMENT ON COLUMN canon_entries.retired_at IS 'Timestamp when this entry was superseded by a new version. NULL = active.';

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant service role full access (for Edge Functions)
GRANT ALL ON canon_entries TO service_role;

-- Grant authenticated users SELECT only
GRANT SELECT ON canon_entries TO authenticated;
GRANT SELECT ON canon_entries TO anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'canon_entries') THEN
        RAISE NOTICE '✅ canon_entries table created successfully';
    END IF;
    
    IF EXISTS (SELECT FROM pg_extension WHERE extname = 'vector') THEN
        RAISE NOTICE '✅ pgvector extension enabled';
    END IF;
    
    RAISE NOTICE '✅ Migration 027 completed: Canon Knowledge Layer';
END $$;
