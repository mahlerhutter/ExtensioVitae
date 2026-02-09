-- =====================================================
-- Clean Up Duplicate Canon Entries
-- =====================================================
-- Purpose: Remove duplicate entries, keep only the oldest
-- =====================================================

-- Delete duplicates, keeping only the first (oldest) entry for each doctrine
DELETE FROM canon_entries
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY domain, doctrine 
                   ORDER BY created_at ASC
               ) as row_num
        FROM canon_entries
    ) t
    WHERE row_num > 1
);

-- Verify cleanup
SELECT domain, COUNT(*) as count
FROM canon_entries
GROUP BY domain
ORDER BY domain;

-- Expected output after cleanup:
-- meaning_purpose         | 5
-- metabolic_health        | 6
-- movement_hierarchy      | 6
-- sleep_regulation        | 6
-- stress_nervous_system   | 5
-- TOTAL: 28
