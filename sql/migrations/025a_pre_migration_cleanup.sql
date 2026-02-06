-- ============================================================================
-- ExtensioVitae: Migration 025 - Pre-Migration Cleanup
-- Purpose: Drop/rename conflicting tables before applying 025_integrated_systems
-- Date: 2026-02-06
-- ============================================================================

-- This migration prepares the database for the new partitioned tables
-- by backing up and dropping existing non-partitioned versions

BEGIN;

-- ============================================================================
-- BACKUP EXISTING DATA (Optional - comment out if not needed)
-- ============================================================================

-- Backup task_completions to a temporary table
CREATE TABLE IF NOT EXISTS task_completions_backup_20260206 AS
SELECT * FROM task_completions;

COMMENT ON TABLE task_completions_backup_20260206 IS 'Backup of task_completions before migration 025 (2026-02-06)';

-- ============================================================================
-- DROP CONFLICTING TABLES
-- ============================================================================

-- Drop task_completions (will be recreated as partitioned table)
DROP TABLE IF EXISTS task_completions CASCADE;

-- Drop tasks if it exists (will be recreated with new schema)
DROP TABLE IF EXISTS tasks CASCADE;

-- Drop wearable tables if they exist
DROP TABLE IF EXISTS wearable_data CASCADE;
DROP TABLE IF EXISTS wearable_connections CASCADE;

-- Drop recovery tables if they exist
DROP TABLE IF EXISTS recovery_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS user_recovery_baseline CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Pre-migration cleanup completed';
  RAISE NOTICE 'Dropped tables: tasks, task_completions, wearable_connections, wearable_data, recovery_metrics';
  RAISE NOTICE 'Backup created: task_completions_backup_20260206';
  RAISE NOTICE 'Ready to apply migration 025_integrated_systems.sql';
END $$;

COMMIT;
