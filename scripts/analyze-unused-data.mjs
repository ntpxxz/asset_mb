import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const pool = new Pool({
    user: process.env.POSTGRES_USER || 'rootpg',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'asset_management',
    password: process.env.POSTGRES_PASSWORD || '123456',
    port: Number(process.env.POSTGRES_PORT || 5432),
});

// Analysis results
const analysis = {
    unusedColumns: [],
    unusedTables: [],
    orphanedFiles: [],
    unusedTypes: [],
    recommendations: [],
    summary: {}
};

// Define expected database schema
const expectedSchema = {
    assets: [
        'id', 'asset_tag', 'type', 'manufacturer', 'model', 'serialnumber',
        'purchasedate', 'purchaseprice', 'supplier', 'warrantyexpiry',
        'assigneduser', 'location', 'department', 'status',
        'operatingsystem', 'processor', 'memory', 'storage',
        'hostname', 'ipaddress', 'macaddress', 'patchstatus',
        'lastpatch_check', 'isloanable', 'condition', 'description',
        'notes', 'created_at', 'updated_at', 'delete_at'
    ],
    users: [
        'id', 'firstname', 'lastname', 'email', 'phone',
        'department', 'role', 'location', 'employee_id',
        'start_date', 'status', 'assets_count', 'created_at',
        'updated_at', 'password'
    ],
    asset_borrowing: [
        'id', 'asset_tag', 'checkout_date', 'due_date', 'checkin_date',
        'status', 'purpose', 'notes', 'created_at', 'updated_at',
        'borrowername', 'borrowercontact', 'condition', 'damage_reported',
        'damage_description', 'maintenance_required', 'maintenance_notes',
        'returned_by_name'
    ],
    asset_patches: [
        'id', 'asset_id', 'patch_status', 'lastpatch_check',
        'operating_system', 'vulnerabilities', 'pending_updates',
        'critical_updates', 'security_updates', 'notes',
        'next_checkdate', 'created_at', 'updated_at'
    ],
    asset_patch_history: [
        'id', 'patchId', 'patchName', 'version', 'description',
        'patchType', 'severity', 'status', 'installDate',
        'scheduledDate', 'size', 'kbNumber', 'cveIds',
        'notes', 'createdAt'
    ],
    inventory_items: [
        'id', 'barcode', 'name', 'description', 'quantity',
        'min_stock_level', 'price_per_unit', 'location',
        'category', 'image_url', 'created_at', 'updated_at'
    ],
    inventory_transactions: [
        'id', 'item_id', 'user_id', 'transaction_type',
        'quantity_change', 'notes', 'transaction_date'
    ],
    software: [
        'id', 'software_name', 'publisher', 'version', 'license_key',
        'licenses_type', 'purchasedate', 'expirydate', 'licenses_total',
        'licenses_assigned', 'category', 'description', 'notes',
        'status', 'created_at', 'updated_at'
    ]
};

// Fields that are commonly used in TypeScript types
const typeDefinedFields = {
    HardwareAsset: [
        'id', 'asset_tag', 'type', 'manufacturer', 'model', 'serialnumber',
        'purchasedate', 'purchaseprice', 'supplier', 'warrantyexpiry',
        'assigneduser', 'location', 'department', 'status',
        'operatingsystem', 'processor', 'memory', 'storage',
        'hostname', 'ipaddress', 'macaddress', 'patchstatus',
        'lastpatch_check', 'isloanable', 'condition', 'description',
        'notes', 'building', 'division', 'section', 'area',
        'pc_name', 'os_key', 'os_version', 'ms_office_apps',
        'ms_office_version', 'is_legally_purchased', 'created_at', 'updated_at'
    ]
};

async function getActualDatabaseSchema() {
    console.log('📊 Fetching actual database schema...\n');
    const schemaMap = {};

    try {
        const result = await pool.query(`
      SELECT 
        table_name, 
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position
    `);

        for (const row of result.rows) {
            if (!schemaMap[row.table_name]) {
                schemaMap[row.table_name] = [];
            }
            schemaMap[row.table_name].push({
                name: row.column_name,
                type: row.data_type,
                nullable: row.is_nullable === 'YES'
            });
        }

        return schemaMap;
    } catch (error) {
        console.error('❌ Error fetching schema:', error.message);
        return {};
    }
}

async function analyzeUnusedColumns(actualSchema) {
    console.log('🔍 Analyzing unused columns...\n');

    for (const [tableName, columns] of Object.entries(actualSchema)) {
        const expectedCols = expectedSchema[tableName];

        if (!expectedCols) {
            analysis.unusedTables.push({
                table: tableName,
                reason: 'Table not defined in expected schema',
                columnCount: columns.length
            });
            continue;
        }

        for (const col of columns) {
            if (!expectedCols.includes(col.name)) {
                analysis.unusedColumns.push({
                    table: tableName,
                    column: col.name,
                    type: col.type,
                    reason: 'Column not in expected schema'
                });
            }
        }
    }

    // Check for missing columns
    for (const [tableName, expectedCols] of Object.entries(expectedSchema)) {
        const actualCols = actualSchema[tableName];

        if (!actualCols) {
            console.log(`⚠️  Table "${tableName}" is expected but not found in database`);
            continue;
        }

        const actualColNames = actualCols.map(c => c.name);
        for (const expectedCol of expectedCols) {
            if (!actualColNames.includes(expectedCol)) {
                console.log(`⚠️  Column "${tableName}.${expectedCol}" is expected but not found in database`);
            }
        }
    }
}

async function analyzeOrphanedFiles() {
    console.log('\n📁 Analyzing orphaned files...\n');

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const publicUploadsDir = path.join(__dirname, '..', 'public', 'uploads');

    // Check uploads directory
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir, { recursive: true });
        if (files.length === 0) {
            console.log('✅ No files in uploads directory');
        } else {
            analysis.orphanedFiles.push({
                directory: 'uploads',
                fileCount: files.length,
                files: files
            });
        }
    }

    // Check public/uploads directory
    if (fs.existsSync(publicUploadsDir)) {
        const files = fs.readdirSync(publicUploadsDir, { recursive: true });
        if (files.length === 0) {
            console.log('✅ No files in public/uploads directory');
        } else {
            // Check if these files are referenced in database
            try {
                const result = await pool.query(`
          SELECT image_url FROM inventory_items WHERE image_url IS NOT NULL
        `);

                const referencedFiles = result.rows.map(r => path.basename(r.image_url));
                const unreferencedFiles = files.filter(f => !referencedFiles.includes(f));

                if (unreferencedFiles.length > 0) {
                    analysis.orphanedFiles.push({
                        directory: 'public/uploads',
                        fileCount: unreferencedFiles.length,
                        files: unreferencedFiles,
                        reason: 'Files not referenced in database'
                    });
                }
            } catch (error) {
                console.error('❌ Error checking file references:', error.message);
            }
        }
    }
}

async function analyzeTypeDefinitions() {
    console.log('\n📝 Analyzing TypeScript type definitions...\n');

    // Check for fields in types that don't exist in database
    const actualSchema = await getActualDatabaseSchema();
    const assetsColumns = actualSchema.assets?.map(c => c.name) || [];

    const typeFields = typeDefinedFields.HardwareAsset;
    const extraFields = typeFields.filter(field => !assetsColumns.includes(field));

    if (extraFields.length > 0) {
        analysis.unusedTypes.push({
            type: 'HardwareAsset',
            extraFields: extraFields,
            reason: 'Fields defined in TypeScript type but not in database'
        });
    }
}

function generateRecommendations() {
    console.log('\n💡 Generating recommendations...\n');

    // Recommendation 1: Remove unused columns
    if (analysis.unusedColumns.length > 0) {
        analysis.recommendations.push({
            priority: 'Medium',
            category: 'Database Cleanup',
            action: 'Remove unused columns',
            details: `Found ${analysis.unusedColumns.length} unused columns that can be safely removed`,
            impact: 'Reduces database size and improves query performance'
        });
    }

    // Recommendation 2: Clean up orphaned files
    if (analysis.orphanedFiles.length > 0) {
        const totalOrphanedFiles = analysis.orphanedFiles.reduce((sum, item) => sum + item.fileCount, 0);
        analysis.recommendations.push({
            priority: 'Low',
            category: 'File System Cleanup',
            action: 'Remove orphaned files',
            details: `Found ${totalOrphanedFiles} orphaned files in upload directories`,
            impact: 'Frees up disk space'
        });
    }

    // Recommendation 3: Update TypeScript types
    if (analysis.unusedTypes.length > 0) {
        analysis.recommendations.push({
            priority: 'High',
            category: 'Code Cleanup',
            action: 'Update TypeScript type definitions',
            details: 'Remove fields from types that don\'t exist in database schema',
            impact: 'Improves type safety and prevents confusion'
        });
    }

    // Recommendation 4: Remove unused tables
    if (analysis.unusedTables.length > 0) {
        analysis.recommendations.push({
            priority: 'High',
            category: 'Database Cleanup',
            action: 'Review and remove unused tables',
            details: `Found ${analysis.unusedTables.length} tables not referenced in application`,
            impact: 'Simplifies database schema and reduces maintenance overhead'
        });
    }
}

function generateSummary() {
    analysis.summary = {
        totalUnusedColumns: analysis.unusedColumns.length,
        totalUnusedTables: analysis.unusedTables.length,
        totalOrphanedFiles: analysis.orphanedFiles.reduce((sum, item) => sum + item.fileCount, 0),
        totalRecommendations: analysis.recommendations.length,
        analysisDate: new Date().toISOString()
    };
}

function printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 UNUSED DATA & ASSETS ANALYSIS REPORT');
    console.log('='.repeat(80) + '\n');

    // Summary
    console.log('📈 SUMMARY');
    console.log('-'.repeat(80));
    console.log(`Unused Columns:      ${analysis.summary.totalUnusedColumns}`);
    console.log(`Unused Tables:       ${analysis.summary.totalUnusedTables}`);
    console.log(`Orphaned Files:      ${analysis.summary.totalOrphanedFiles}`);
    console.log(`Recommendations:     ${analysis.summary.totalRecommendations}`);
    console.log(`Analysis Date:       ${new Date(analysis.summary.analysisDate).toLocaleString()}`);
    console.log('');

    // Unused Columns
    if (analysis.unusedColumns.length > 0) {
        console.log('\n🗑️  UNUSED COLUMNS');
        console.log('-'.repeat(80));
        analysis.unusedColumns.forEach(item => {
            console.log(`  • ${item.table}.${item.column} (${item.type})`);
            console.log(`    Reason: ${item.reason}`);
        });
    }

    // Unused Tables
    if (analysis.unusedTables.length > 0) {
        console.log('\n📋 UNUSED TABLES');
        console.log('-'.repeat(80));
        analysis.unusedTables.forEach(item => {
            console.log(`  • ${item.table} (${item.columnCount} columns)`);
            console.log(`    Reason: ${item.reason}`);
        });
    }

    // Orphaned Files
    if (analysis.orphanedFiles.length > 0) {
        console.log('\n📁 ORPHANED FILES');
        console.log('-'.repeat(80));
        analysis.orphanedFiles.forEach(item => {
            console.log(`  • Directory: ${item.directory}`);
            console.log(`    File Count: ${item.fileCount}`);
            if (item.reason) console.log(`    Reason: ${item.reason}`);
            if (item.files.length <= 10) {
                item.files.forEach(file => console.log(`      - ${file}`));
            } else {
                console.log(`      (Too many files to list, see JSON report)`);
            }
        });
    }

    // Type Issues
    if (analysis.unusedTypes.length > 0) {
        console.log('\n📝 TYPE DEFINITION ISSUES');
        console.log('-'.repeat(80));
        analysis.unusedTypes.forEach(item => {
            console.log(`  • Type: ${item.type}`);
            console.log(`    Extra Fields: ${item.extraFields.join(', ')}`);
            console.log(`    Reason: ${item.reason}`);
        });
    }

    // Recommendations
    if (analysis.recommendations.length > 0) {
        console.log('\n💡 RECOMMENDATIONS');
        console.log('-'.repeat(80));
        analysis.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. [${rec.priority}] ${rec.action}`);
            console.log(`     Category: ${rec.category}`);
            console.log(`     Details: ${rec.details}`);
            console.log(`     Impact: ${rec.impact}`);
            console.log('');
        });
    }

    console.log('='.repeat(80));
    console.log('✅ Analysis complete!');
    console.log('='.repeat(80) + '\n');
}

async function saveReport() {
    const reportPath = path.join(__dirname, '..', 'unused-data-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

async function main() {
    try {
        console.log('🚀 Starting unused data and assets analysis...\n');

        const actualSchema = await getActualDatabaseSchema();
        await analyzeUnusedColumns(actualSchema);
        await analyzeOrphanedFiles();
        await analyzeTypeDefinitions();
        generateRecommendations();
        generateSummary();
        printReport();
        await saveReport();

    } catch (error) {
        console.error('❌ Analysis failed:', error);
    } finally {
        await pool.end();
    }
}

main();
