# 🧹 Cleanup Scripts & Documentation

This directory contains automated analysis and cleanup scripts for the IT Asset Management System.

## 📁 Files Overview

### Analysis & Reports
- **`analyze-unused-data.mjs`** - Automated script to analyze unused database columns, tables, and orphaned files
- **`unused-data-analysis.json`** - JSON report with detailed findings (auto-generated)
- **`CLEANUP_SUMMARY.md`** - Quick reference summary of findings
- **`CLEANUP_IMPLEMENTATION_PLAN.md`** - Detailed implementation plan with step-by-step instructions

### Migration Scripts
- **`database/001_remove_unused_columns.sql`** - SQL migration to remove unused columns
- **`database/001_remove_unused_columns_rollback.sql`** - Rollback script to restore columns

### Cleanup Scripts
- **`scripts/cleanup-orphaned-files.ps1`** - PowerShell script to remove orphaned files

---

## 🚀 Quick Start

### 1. Run Analysis
```bash
# Analyze the codebase for unused data
node scripts/analyze-unused-data.mjs
```

This will generate:
- Console output with summary
- `unused-data-analysis.json` with detailed findings

### 2. Review Findings
```bash
# Read the quick summary
cat CLEANUP_SUMMARY.md

# Read the detailed plan
cat CLEANUP_IMPLEMENTATION_PLAN.md

# View JSON report
cat unused-data-analysis.json
```

### 3. Execute Cleanup (After Review)

#### Option A: Manual Step-by-Step
Follow the instructions in `CLEANUP_IMPLEMENTATION_PLAN.md`

#### Option B: Automated Scripts

**Database Cleanup:**
```bash
# Create backup first!
pg_dump -U rootpg -d asset_management > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
psql -U rootpg -d asset_management -f database/001_remove_unused_columns.sql
```

**File Cleanup:**
```powershell
# Run PowerShell script
.\scripts\cleanup-orphaned-files.ps1
```

---

## 📊 Analysis Results Summary

### Current Findings (as of Dec 4, 2025)

| Category | Count | Priority |
|----------|-------|----------|
| Unused Columns | 22 | Medium |
| Unused Tables | 1 | High |
| Orphaned Files | 14 | Low |
| Type Mismatches | 2 | High |

### Breakdown

**Unused Columns by Table:**
- `assets`: 14 columns
- `inventory_items`: 4 columns
- `inventory_transactions`: 2 columns
- `users`: 2 columns

**Unused Tables:**
- `asset_history` (8 columns)

**Orphaned Files:**
- 14 screenshot files in `public/uploads/`

---

## 🔧 Script Details

### analyze-unused-data.mjs

**Purpose:** Automatically analyze the database schema and codebase to identify unused data

**What it checks:**
- ✅ Database columns vs. expected schema
- ✅ Tables not referenced in application
- ✅ Orphaned files in upload directories
- ✅ TypeScript type mismatches

**Output:**
- Console report with color-coded findings
- JSON file with detailed analysis
- Actionable recommendations

**Usage:**
```bash
node scripts/analyze-unused-data.mjs
```

**Requirements:**
- Node.js 18+
- PostgreSQL database access
- Environment variables configured

---

### cleanup-orphaned-files.ps1

**Purpose:** Safely remove orphaned files with automatic backup

**Features:**
- ✅ Automatic backup before deletion
- ✅ Verification of file existence
- ✅ Detailed progress reporting
- ✅ Error handling and rollback capability

**Usage:**
```powershell
# From project root
.\scripts\cleanup-orphaned-files.ps1
```

**What it does:**
1. Checks which orphaned files exist
2. Creates timestamped backup directory
3. Copies files to backup
4. Deletes original files
5. Reports results and freed space

---

### Database Migration Scripts

#### 001_remove_unused_columns.sql

**Purpose:** Remove 22 unused columns from database

**Affected Tables:**
- `assets` (14 columns)
- `inventory_items` (4 columns)
- `inventory_transactions` (2 columns)
- `users` (2 columns)

**Features:**
- ✅ Transaction-safe (wrapped in BEGIN/COMMIT)
- ✅ Detailed logging with RAISE NOTICE
- ✅ Verification queries
- ✅ Migration tracking

**Usage:**
```bash
# IMPORTANT: Create backup first!
pg_dump -U rootpg -d asset_management > backup.sql

# Run migration
psql -U rootpg -d asset_management -f database/001_remove_unused_columns.sql
```

#### 001_remove_unused_columns_rollback.sql

**Purpose:** Rollback the column removal migration

**⚠️ WARNING:** This restores column structure but NOT data!

**Usage:**
```bash
# Rollback (structure only)
psql -U rootpg -d asset_management -f database/001_remove_unused_columns_rollback.sql

# Restore data from backup
psql -U rootpg -d asset_management < backup.sql
```

---

## ⚠️ Important Safety Notes

### Before Running Any Cleanup:

1. **Create Full Backup**
   ```bash
   pg_dump -U rootpg -d asset_management > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test on Development First**
   - Never run migrations directly on production
   - Test on dev/staging environment first
   - Verify application functionality after cleanup

3. **Review All Changes**
   - Read `CLEANUP_IMPLEMENTATION_PLAN.md` thoroughly
   - Understand what will be removed
   - Get team approval if needed

4. **Have Rollback Plan**
   - Keep backup accessible
   - Have rollback scripts ready
   - Know how to restore quickly

---

## 🔄 Re-running Analysis

The analysis script can be re-run anytime to check for new unused data:

```bash
# Re-run analysis
node scripts/analyze-unused-data.mjs

# Compare with previous report
diff unused-data-analysis.json unused-data-analysis.json.backup
```

**Recommended frequency:**
- After major feature additions
- Before major releases
- Quarterly maintenance reviews

---

## 📝 Customizing the Analysis

### Adding Custom Checks

Edit `scripts/analyze-unused-data.mjs` to add custom analysis:

```javascript
// Example: Check for unused API endpoints
async function analyzeUnusedAPIs() {
  // Your custom logic here
}

// Add to main function
async function main() {
  // ... existing code
  await analyzeUnusedAPIs();
  // ... rest of code
}
```

### Updating Expected Schema

Edit the `expectedSchema` object in `analyze-unused-data.mjs`:

```javascript
const expectedSchema = {
  assets: [
    'id', 'asset_tag', 'type', // ... add your columns
  ],
  // ... other tables
};
```

---

## 🐛 Troubleshooting

### Analysis Script Fails to Connect

**Error:** `Error: connect ECONNREFUSED`

**Solution:**
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Verify environment variables
echo $POSTGRES_HOST
echo $POSTGRES_DB
```

### Migration Fails

**Error:** `ERROR: column "xyz" does not exist`

**Solution:**
- Column may have already been removed
- Check current schema: `\d+ table_name` in psql
- Safe to ignore if using `IF EXISTS` clause

### Cleanup Script Permission Denied

**Error:** `Access denied` when running PowerShell script

**Solution:**
```powershell
# Run PowerShell as Administrator
# Or set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📞 Support

### Need Help?

1. **Check Documentation:**
   - `CLEANUP_IMPLEMENTATION_PLAN.md` - Detailed instructions
   - `CLEANUP_SUMMARY.md` - Quick reference

2. **Review Analysis:**
   - `unused-data-analysis.json` - Full findings

3. **Verify Backups:**
   - Always have a recent backup before cleanup

4. **Test First:**
   - Run on development environment
   - Verify application works after cleanup

---

## 📚 Related Documentation

- **Database Schema:** `schema.sql`
- **Type Definitions:** `lib/types.ts`
- **API Documentation:** `tests/api-tests.postman_collection.json`

---

## ✅ Checklist

Before running cleanup:
- [ ] Read `CLEANUP_IMPLEMENTATION_PLAN.md`
- [ ] Create database backup
- [ ] Test on development environment
- [ ] Get team approval (if required)
- [ ] Schedule maintenance window
- [ ] Have rollback plan ready

After cleanup:
- [ ] Verify application starts
- [ ] Test all major features
- [ ] Check logs for errors
- [ ] Monitor performance
- [ ] Update documentation

---

**Last Updated:** December 4, 2025  
**Maintained By:** Development Team
