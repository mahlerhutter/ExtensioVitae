# Supabase Backup Configuration Guide

**Date:** 2026-02-04  
**Priority:** 🟠 HIGH  
**Effort:** 1 hour  
**Status:** PENDING (Manual Configuration Required)

---

## Overview

This guide documents the process for configuring automated backups for the ExtensioVitae Supabase database to prevent data loss.

## Prerequisites

- Access to Supabase Dashboard
- Project: ExtensioVitae (Production)
- Admin permissions

---

## Configuration Steps

### 1. Access Backup Settings

1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the **ExtensioVitae** project
3. Go to **Settings** → **Database** → **Backups**

### 2. Enable Automated Backups

**Supabase Pro Plan includes:**
- Daily automated backups
- Point-in-time recovery (PITR)
- 7-day retention by default

**Configuration:**
1. Verify automated backups are enabled (should be default on Pro plan)
2. Check backup schedule: Daily at 2:00 AM UTC
3. Confirm retention period: **7 days minimum** (recommended: 30 days)

### 3. Configure Point-in-Time Recovery (PITR)

**PITR Settings:**
- Enable PITR for production database
- Retention: 7 days (Pro plan default)
- Allows recovery to any point within the retention window

**Steps:**
1. Navigate to **Database** → **Backups** → **Point in Time Recovery**
2. Click **Enable PITR**
3. Confirm retention period: 7 days
4. Save configuration

### 4. Test Backup Restoration

**IMPORTANT:** Test the restore process in a staging environment first.

**Test Procedure:**
1. Create a test backup manually:
   - Go to **Backups** → **Manual Backups**
   - Click **Create Backup**
   - Name: `test-backup-2026-02-04`
   - Wait for completion (~5-10 minutes)

2. Test restore to new project:
   - Create a new Supabase project: `extensiovitae-restore-test`
   - Go to original project → **Backups**
   - Select the test backup
   - Click **Restore to New Project**
   - Select the test project
   - Confirm restoration

3. Verify restored data:
   - Check table row counts match
   - Verify RLS policies are intact
   - Test authentication
   - Verify Edge Functions are included

### 5. Document Recovery Process

**Emergency Recovery Procedure:**

#### Scenario 1: Recent Data Loss (< 7 days)
1. Go to Supabase Dashboard → **Backups**
2. Select **Point-in-Time Recovery**
3. Choose timestamp before data loss
4. Click **Restore**
5. Confirm restoration (⚠️ This will overwrite current database)
6. Wait for completion (~10-30 minutes depending on size)
7. Verify data integrity
8. Redeploy Edge Functions if needed

#### Scenario 2: Complete Database Corruption
1. Go to **Backups** → **Automated Backups**
2. Select most recent healthy backup
3. Click **Restore to New Project**
4. Create new project: `extensiovitae-recovery-[date]`
5. Update environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Redeploy application
7. Test all functionality
8. Update DNS if using custom domain

#### Scenario 3: Accidental Deletion (< 24 hours)
1. Use PITR to restore to timestamp before deletion
2. Export deleted data from restored state
3. Import back into production database
4. Verify data integrity

---

## Backup Monitoring

### Daily Checks (Automated)
- Supabase sends email notifications for:
  - Failed backups
  - Storage quota warnings
  - PITR issues

### Weekly Manual Checks
1. Verify latest backup timestamp
2. Check backup size (should be consistent)
3. Review backup logs for errors

### Monthly Tests
1. Perform test restoration to staging
2. Verify data integrity
3. Document any issues

---

## Backup Storage

**Location:**
- Supabase-managed S3 buckets (EU region)
- Encrypted at rest (AES-256)
- Geographically redundant

**Retention Policy:**
- Automated backups: 7 days (configurable up to 30 days on Pro)
- Manual backups: Retained until manually deleted
- PITR: 7 days rolling window

**Storage Limits:**
- Pro plan: 8 GB included
- Additional storage: $0.125/GB/month
- Current database size: ~50 MB (well within limits)

---

## Cost Considerations

**Supabase Pro Plan ($25/month):**
- ✅ Automated daily backups
- ✅ 7-day PITR
- ✅ 8 GB backup storage
- ✅ Email notifications

**Additional Costs:**
- None expected (database < 1 GB)
- PITR storage: Included in Pro plan
- Backup storage: Included up to 8 GB

---

## Security Considerations

### Backup Encryption
- ✅ All backups encrypted at rest (AES-256)
- ✅ Encrypted in transit (TLS 1.3)
- ✅ Encryption keys managed by Supabase

### Access Control
- ✅ Only project admins can restore backups
- ✅ Audit log tracks all backup operations
- ✅ 2FA required for production access

### Compliance
- ✅ DSGVO compliant (EU-hosted)
- ✅ Backup data subject to same RLS policies
- ✅ PII encrypted in backups (localStorage encryption)

---

## Troubleshooting

### Backup Failed
1. Check Supabase status page
2. Verify storage quota not exceeded
3. Review backup logs in dashboard
4. Contact Supabase support if persistent

### Restore Failed
1. Verify backup integrity (checksum)
2. Check target project has sufficient resources
3. Ensure no active connections during restore
4. Try restoring to new project instead

### PITR Not Available
1. Verify PITR is enabled
2. Check retention window (7 days)
3. Ensure timestamp is within window
4. Contact support if issue persists

---

## Acceptance Criteria

- [ ] Automated backups enabled and running daily
- [ ] PITR enabled with 7-day retention
- [ ] Test backup created and verified
- [ ] Test restore completed successfully
- [ ] Recovery procedure documented
- [ ] Backup monitoring configured
- [ ] Email notifications enabled
- [ ] Team trained on recovery process

---

## Next Steps

1. **Immediate (Today):**
   - [ ] Enable automated backups in Supabase dashboard
   - [ ] Enable PITR
   - [ ] Create first manual test backup

2. **This Week:**
   - [ ] Test restore to staging environment
   - [ ] Document recovery runbook
   - [ ] Set up backup monitoring alerts

3. **Ongoing:**
   - [ ] Weekly backup verification
   - [ ] Monthly restore tests
   - [ ] Quarterly disaster recovery drills

---

## References

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [Point-in-Time Recovery Guide](https://supabase.com/docs/guides/platform/backups#point-in-time-recovery)
- [Disaster Recovery Best Practices](https://supabase.com/docs/guides/platform/going-into-prod#backups)

---

**Last Updated:** 2026-02-04  
**Owner:** ExtensioVitae DevOps  
**Review Frequency:** Quarterly
