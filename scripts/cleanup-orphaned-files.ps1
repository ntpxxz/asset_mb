# ============================================================================
# Cleanup Script: Remove Orphaned Files
# Date: 2025-12-04
# Description: Remove orphaned image files from public/uploads directory
# ============================================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Orphaned Files Cleanup Script" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$uploadsDir = "public/uploads"
$backupDir = "backups/orphaned-files-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# List of orphaned files identified by analysis
$orphanedFiles = @(
    "1759900938802-985882133-Screenshot_2025-10-08_121502.png",
    "1759905716810-510619651-Screenshot_2025-10-08_121502.png",
    "1759906326462-130171639-Screenshot_2025-10-08_121502.png",
    "1759906735198-935646069-Screenshot_2025-10-08_121502.png",
    "1759907015330-249089912-Screenshot_2025-10-08_121502.png",
    "1759907289782-119622068-Screenshot_2025-10-08_121502.png",
    "1759907417982-361751942-Screenshot_2025-10-08_121502.png",
    "1759907497754-258348373-Screenshot_2025-10-08_121502.png",
    "1759907598638-930176260-Screenshot_2025-10-08_121502.png",
    "1759907656319-69177454-Screenshot_2025-10-08_121502.png",
    "1759908165644-708656130-Screenshot_2025-10-08_121502.png",
    "1760505726313-337453317-Screenshot_2025-10-15_122144.png",
    "1760505917575-868779803-Screenshot_2025-10-15_122456.png",
    "1761104347745-667109089-Screenshot_2025-10-21_162110.png"
)

# ============================================================================
# STEP 1: Verify uploads directory exists
# ============================================================================
Write-Host "[1/5] Verifying uploads directory..." -ForegroundColor Yellow

if (-not (Test-Path $uploadsDir)) {
    Write-Host "✓ Uploads directory does not exist. Nothing to clean." -ForegroundColor Green
    exit 0
}

Write-Host "✓ Uploads directory found: $uploadsDir" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 2: Check which files actually exist
# ============================================================================
Write-Host "[2/5] Checking for orphaned files..." -ForegroundColor Yellow

$existingFiles = @()
$missingFiles = @()

foreach ($file in $orphanedFiles) {
    $filePath = Join-Path $uploadsDir $file
    if (Test-Path $filePath) {
        $existingFiles += $file
        Write-Host "  Found: $file" -ForegroundColor White
    } else {
        $missingFiles += $file
    }
}

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Files found: $($existingFiles.Count)" -ForegroundColor White
Write-Host "  - Files already removed: $($missingFiles.Count)" -ForegroundColor Gray
Write-Host ""

if ($existingFiles.Count -eq 0) {
    Write-Host "✓ No orphaned files found. Cleanup not needed." -ForegroundColor Green
    exit 0
}

# ============================================================================
# STEP 3: Create backup directory
# ============================================================================
Write-Host "[3/5] Creating backup directory..." -ForegroundColor Yellow

try {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "✓ Backup directory created: $backupDir" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create backup directory: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# ============================================================================
# STEP 4: Backup files before deletion
# ============================================================================
Write-Host "[4/5] Backing up files..." -ForegroundColor Yellow

$backupSuccess = 0
$backupFailed = 0

foreach ($file in $existingFiles) {
    $sourcePath = Join-Path $uploadsDir $file
    $destPath = Join-Path $backupDir $file
    
    try {
        Copy-Item -Path $sourcePath -Destination $destPath -Force
        Write-Host "  ✓ Backed up: $file" -ForegroundColor Green
        $backupSuccess++
    } catch {
        Write-Host "  ✗ Failed to backup: $file - $_" -ForegroundColor Red
        $backupFailed++
    }
}

Write-Host ""
Write-Host "Backup Summary:" -ForegroundColor Cyan
Write-Host "  - Successful: $backupSuccess" -ForegroundColor Green
Write-Host "  - Failed: $backupFailed" -ForegroundColor $(if ($backupFailed -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($backupFailed -gt 0) {
    Write-Host "⚠ Some files failed to backup. Aborting deletion for safety." -ForegroundColor Yellow
    exit 1
}

# ============================================================================
# STEP 5: Delete orphaned files
# ============================================================================
Write-Host "[5/5] Deleting orphaned files..." -ForegroundColor Yellow

$deleteSuccess = 0
$deleteFailed = 0
$totalSize = 0

foreach ($file in $existingFiles) {
    $filePath = Join-Path $uploadsDir $file
    
    try {
        $fileInfo = Get-Item $filePath
        $fileSize = $fileInfo.Length
        $totalSize += $fileSize
        
        Remove-Item -Path $filePath -Force
        Write-Host "  ✓ Deleted: $file ($([math]::Round($fileSize/1KB, 2)) KB)" -ForegroundColor Green
        $deleteSuccess++
    } catch {
        Write-Host "  ✗ Failed to delete: $file - $_" -ForegroundColor Red
        $deleteFailed++
    }
}

Write-Host ""

# ============================================================================
# STEP 6: Summary
# ============================================================================
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Results:" -ForegroundColor White
Write-Host "  - Files deleted: $deleteSuccess" -ForegroundColor Green
Write-Host "  - Files failed: $deleteFailed" -ForegroundColor $(if ($deleteFailed -gt 0) { "Red" } else { "Gray" })
Write-Host "  - Space freed: $([math]::Round($totalSize/1KB, 2)) KB" -ForegroundColor Cyan
Write-Host "  - Backup location: $backupDir" -ForegroundColor Yellow
Write-Host ""

if ($deleteFailed -eq 0) {
    Write-Host "✓ All orphaned files removed successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠ Some files could not be deleted. Check errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Note: Backup files are kept in: $backupDir" -ForegroundColor Gray
Write-Host "You can safely delete the backup after verifying the application works correctly." -ForegroundColor Gray
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
