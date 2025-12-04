# 🧹 Cleanup Implementation Plan

**Generated:** December 4, 2025  
**Analysis Report:** `unused-data-analysis.json`

---

## 📊 Executive Summary

The automated analysis has identified **22 unused database columns**, **1 unused table**, and **14 orphaned files** that can be safely removed to improve system performance, reduce storage costs, and enhance code maintainability.

### Key Findings
- **Unused Columns:** 22 columns across 4 tables
- **Unused Tables:** 1 table (`asset_history`)
- **Orphaned Files:** 14 image files in `public/uploads`
- **Type Mismatches:** 2 fields in TypeScript types don't match database

---

## 🎯 Cleanup Priorities

### Priority 1: HIGH - Critical Code & Schema Issues
1. **Update TypeScript Type Definitions** ⚠️
2. **Review Unused Table (`asset_history`)** ⚠️

### Priority 2: MEDIUM - Database Optimization
3. **Remove Unused Database Columns**

### Priority 3: LOW - File System Cleanup
4. **Remove Orphaned Files**

---

## 📋 Detailed Action Items

### 1. Update TypeScript Type Definitions (HIGH Priority)

**Issue:** The `HardwareAsset` type in `lib/types.ts` references fields that don't exist in the database.

**Fields to Fix:**
- `ipaddress` → Should be `ip_address` (database uses snake_case)
- `macaddress` → Should be `mac_address` (database uses snake_case)

**Action Required:**
```typescript
// File: lib/types.ts
// Line: ~30-31

// BEFORE:
ipaddress: string;
macaddress: string;

// AFTER:
ip_address: string;
mac_address: string;
```

**Impact:**
- ✅ Fixes type safety issues
- ✅ Prevents runtime errors
- ✅ Improves developer experience

---

### 2. Review Unused Table: `asset_history` (HIGH Priority)

**Issue:** The `asset_history` table exists in the database but is not referenced in the application code.

**Table Structure:** 8 columns (needs investigation)

**Possible Actions:**
1. **Option A:** If this table was meant for audit logging, integrate it into the application
2. **Option B:** If it's truly unused, drop the table
3. **Option C:** If it contains historical data, export and archive before deletion

**Recommended Steps:**
1. Query the table to check if it contains data:
   ```sql
   SELECT COUNT(*) FROM asset_history;
   SELECT * FROM asset_history LIMIT 10;
   ```
2. Check if any triggers or stored procedures reference it
3. If empty and unreferenced, create a backup and drop:
   ```sql
   -- Backup
   COPY asset_history TO '/backup/asset_history_backup.csv' CSV HEADER;
   
   -- Drop
   DROP TABLE IF EXISTS asset_history CASCADE;
   ```

---

### 3. Remove Unused Database Columns (MEDIUM Priority)

**Total Columns to Remove:** 22

#### 3.1 Assets Table (14 columns)

**Columns to Remove:**
```sql
ALTER TABLE assets 
  DROP COLUMN IF EXISTS building,
  DROP COLUMN IF EXISTS division,
  DROP COLUMN IF EXISTS section,
  DROP COLUMN IF EXISTS area,
  DROP COLUMN IF EXISTS pc_name,
  DROP COLUMN IF EXISTS license_free,
  DROP COLUMN IF EXISTS os_key,
  DROP COLUMN IF EXISTS os_version,
  DROP COLUMN IF EXISTS ms_office_apps,
  DROP COLUMN IF EXISTS ms_office_version,
  DROP COLUMN IF EXISTS is_legally_purchased,
  DROP COLUMN IF EXISTS refer_document,
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS mac_address;
```

**Note:** These columns appear to be legacy fields from a previous system or unused features.

**Before Removal:**
1. ✅ Verify no API endpoints use these fields
2. ✅ Check if any forms reference these fields
3. ✅ Search codebase for references
4. ✅ Create database backup

#### 3.2 Inventory Items Table (4 columns)

**Columns to Remove:**
```sql
ALTER TABLE inventory_items
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS min_quantity,
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS notes;
```

**Analysis:**
- `is_active` - Not used in current implementation
- `min_quantity` - Duplicate of `min_stock_level`
- `supplier` - Not referenced in inventory APIs
- `notes` - Not used in inventory forms

**Action Required:**
1. Check if `min_quantity` has different data than `min_stock_level`
2. If `supplier` contains data, consider migrating to a separate suppliers table
3. If `notes` contains data, migrate to `description` field

#### 3.3 Inventory Transactions Table (2 columns)

**Columns to Remove:**
```sql
ALTER TABLE inventory_transactions
  DROP COLUMN IF EXISTS price_per_unit,
  DROP COLUMN IF EXISTS created_at;
```

**Note:** 
- `price_per_unit` - Price is stored in `inventory_items` table
- `created_at` - Duplicate of `transaction_date`

#### 3.4 Users Table (2 columns)

**Columns to Remove:**
```sql
ALTER TABLE users
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS is_active;
```

**Analysis:**
- `position` - Not used (use `role` instead)
- `is_active` - Duplicate of `status` field

---

### 4. Remove Orphaned Files (LOW Priority)

**Location:** `public/uploads/`  
**Total Files:** 14 image files

**Files to Remove:**
```
1759900938802-985882133-Screenshot_2025-10-08_121502.png
1759905716810-510619651-Screenshot_2025-10-08_121502.png
1759906326462-130171639-Screenshot_2025-10-08_121502.png
1759906735198-935646069-Screenshot_2025-10-08_121502.png
1759907015330-249089912-Screenshot_2025-10-08_121502.png
1759907289782-119622068-Screenshot_2025-10-08_121502.png
1759907417982-361751942-Screenshot_2025-10-08_121502.png
1759907497754-258348373-Screenshot_2025-10-08_121502.png
1759907598638-930176260-Screenshot_2025-10-08_121502.png
1759907656319-69177454-Screenshot_2025-10-08_121502.png
1759908165644-708656130-Screenshot_2025-10-08_121502.png
1760505726313-337453317-Screenshot_2025-10-15_122144.png
1760505917575-868779803-Screenshot_2025-10-15_122456.png
1761104347745-667109089-Screenshot_2025-10-21_162110.png
```

**Cleanup Script:**
```bash
# Navigate to uploads directory
cd public/uploads

# Create backup (optional)
mkdir -p ../../backups/orphaned-files
cp *.png ../../backups/orphaned-files/

# Remove orphaned files
rm -f 1759900938802-985882133-Screenshot_2025-10-08_121502.png
rm -f 1759905716810-510619651-Screenshot_2025-10-08_121502.png
# ... (continue for all files)

# Or remove all at once (after verification)
# rm -f *.png
```

**PowerShell Script:**
```powershell
# Create cleanup script
$orphanedFiles = @(
    "1759900938802-985882133-Screenshot_2025-10-08_121502.png",
    "1759905716810-510619651-Screenshot_2025-10-08_121502.png",
    # ... add all files
)

foreach ($file in $orphanedFiles) {
    $path = "public/uploads/$file"
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "Removed: $file"
    }
}
```

---

## 🔄 Implementation Workflow

### Phase 1: Preparation (Day 1)
- [ ] Create full database backup
- [ ] Create git branch: `cleanup/unused-data`
- [ ] Review all findings with team
- [ ] Get approval for changes

### Phase 2: Code Updates (Day 1-2)
- [ ] Update TypeScript types (`lib/types.ts`)
- [ ] Search and update any code referencing removed fields
- [ ] Update API documentation
- [ ] Run TypeScript compiler to check for errors

### Phase 3: Database Cleanup (Day 2-3)
- [ ] Investigate `asset_history` table
- [ ] Create SQL migration scripts
- [ ] Test migration on development database
- [ ] Execute migration on staging
- [ ] Verify application functionality
- [ ] Execute migration on production

### Phase 4: File System Cleanup (Day 3)
- [ ] Backup orphaned files
- [ ] Remove orphaned files
- [ ] Verify application still works

### Phase 5: Verification (Day 4)
- [ ] Run full test suite
- [ ] Manual testing of all features
- [ ] Performance testing
- [ ] Review logs for errors

### Phase 6: Documentation (Day 4-5)
- [ ] Update schema documentation
- [ ] Update API documentation
- [ ] Update developer guide
- [ ] Create changelog entry

---

## 📝 SQL Migration Scripts

### Migration: Remove Unused Columns

**File:** `database/migrations/001_remove_unused_columns.sql`

```sql
-- Migration: Remove Unused Columns
-- Date: 2025-12-04
-- Description: Remove unused columns identified in cleanup analysis

BEGIN;

-- Backup data (optional - create views or temp tables if needed)
-- CREATE TABLE assets_backup AS SELECT * FROM assets;

-- Remove unused columns from assets table
ALTER TABLE assets 
  DROP COLUMN IF EXISTS building,
  DROP COLUMN IF EXISTS division,
  DROP COLUMN IF EXISTS section,
  DROP COLUMN IF EXISTS area,
  DROP COLUMN IF EXISTS pc_name,
  DROP COLUMN IF EXISTS license_free,
  DROP COLUMN IF EXISTS os_key,
  DROP COLUMN IF EXISTS os_version,
  DROP COLUMN IF EXISTS ms_office_apps,
  DROP COLUMN IF EXISTS ms_office_version,
  DROP COLUMN IF EXISTS is_legally_purchased,
  DROP COLUMN IF EXISTS refer_document,
  DROP COLUMN IF EXISTS ip_address,
  DROP COLUMN IF EXISTS mac_address;

-- Remove unused columns from inventory_items table
ALTER TABLE inventory_items
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS min_quantity,
  DROP COLUMN IF EXISTS supplier,
  DROP COLUMN IF EXISTS notes;

-- Remove unused columns from inventory_transactions table
ALTER TABLE inventory_transactions
  DROP COLUMN IF EXISTS price_per_unit,
  DROP COLUMN IF EXISTS created_at;

-- Remove unused columns from users table
ALTER TABLE users
  DROP COLUMN IF EXISTS position,
  DROP COLUMN IF EXISTS is_active;

COMMIT;

-- Verify changes
SELECT 
  table_name, 
  column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('assets', 'inventory_items', 'inventory_transactions', 'users')
ORDER BY table_name, ordinal_position;
```

### Rollback Script

**File:** `database/migrations/001_remove_unused_columns_rollback.sql`

```sql
-- Rollback: Restore Unused Columns
-- Note: This will restore columns but NOT the data

BEGIN;

-- Restore assets columns
ALTER TABLE assets 
  ADD COLUMN IF NOT EXISTS building VARCHAR(255),
  ADD COLUMN IF NOT EXISTS division VARCHAR(255),
  ADD COLUMN IF NOT EXISTS section VARCHAR(255),
  ADD COLUMN IF NOT EXISTS area VARCHAR(255),
  ADD COLUMN IF NOT EXISTS pc_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS license_free VARCHAR(255),
  ADD COLUMN IF NOT EXISTS os_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS os_version VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ms_office_apps TEXT,
  ADD COLUMN IF NOT EXISTS ms_office_version VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_legally_purchased VARCHAR(255),
  ADD COLUMN IF NOT EXISTS refer_document TEXT,
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mac_address VARCHAR(255);

-- Restore inventory_items columns
ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS min_quantity INTEGER,
  ADD COLUMN IF NOT EXISTS supplier VARCHAR(255),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Restore inventory_transactions columns
ALTER TABLE inventory_transactions
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE;

-- Restore users columns
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS position VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

COMMIT;
```

---

## 📊 Expected Benefits

### Database Performance
- **Reduced Table Size:** ~15-20% reduction in assets table size
- **Faster Queries:** Fewer columns to scan
- **Better Indexing:** More efficient index usage

### Code Quality
- **Type Safety:** Fixed TypeScript type mismatches
- **Maintainability:** Cleaner schema, easier to understand
- **Documentation:** Accurate schema documentation

### Storage
- **Disk Space:** ~5-10 MB freed from orphaned files
- **Backup Size:** Smaller database backups

---

## ⚠️ Risks & Mitigation

### Risk 1: Data Loss
**Mitigation:** 
- Create full database backup before any changes
- Test on development environment first
- Keep rollback scripts ready

### Risk 2: Breaking Changes
**Mitigation:**
- Search entire codebase for field references
- Run full test suite
- Deploy to staging first

### Risk 3: Unknown Dependencies
**Mitigation:**
- Monitor application logs after deployment
- Have rollback plan ready
- Deploy during low-traffic period

---

## ✅ Verification Checklist

### Pre-Deployment
- [ ] Database backup created
- [ ] Git branch created
- [ ] Code changes reviewed
- [ ] Migration scripts tested on dev
- [ ] Team approval obtained

### Post-Deployment
- [ ] Application starts successfully
- [ ] All API endpoints working
- [ ] No errors in logs
- [ ] Database queries performing well
- [ ] User acceptance testing passed

---

## 📞 Support & Rollback

### If Issues Occur:
1. **Check logs:** Review application and database logs
2. **Verify data:** Ensure no data corruption
3. **Rollback if needed:** Use rollback scripts
4. **Contact team:** Escalate if issues persist

### Rollback Procedure:
```bash
# 1. Stop application
pm2 stop asset-management

# 2. Restore database from backup
psql -U rootpg -d asset_management < backup_2025-12-04.sql

# 3. Revert code changes
git checkout main

# 4. Restart application
pm2 start asset-management
```

---

## 📚 Additional Resources

- **Analysis Report:** `unused-data-analysis.json`
- **Analysis Script:** `scripts/analyze-unused-data.mjs`
- **Database Schema:** `schema.sql`
- **Type Definitions:** `lib/types.ts`

---

**Last Updated:** December 4, 2025  
**Next Review:** After implementation completion
