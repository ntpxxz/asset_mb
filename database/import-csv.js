const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function importCSV(csvFilePath) {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to database...');
        console.log('📂 Reading CSV file:', csvFilePath);

        const results = [];

        // Read CSV file
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Found ${results.length} rows to import`);
        console.log('');

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Begin transaction
        await client.query('BEGIN');

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
                // Map CSV columns to database columns
                const columns = [];
                const values = [];
                const placeholders = [];

                // Add each field if it exists in the CSV
                let paramIndex = 1;

                const fieldMapping = {
                    'asset_tag': 'asset_tag',
                    'type': 'type',
                    'manufacturer': 'manufacturer',
                    'model': 'model',
                    'serialnumber': 'serialnumber',
                    'purchasedate': 'purchasedate',
                    'purchaseprice': 'purchaseprice',
                    'supplier': 'supplier',
                    'warrantyexpiry': 'warrantyexpiry',
                    'assigneduser': 'assigneduser',
                    'location': 'location',
                    'department': 'department',
                    'building': 'building',
                    'division': 'division',
                    'section': 'section',
                    'area': 'area',
                    'pc_name': 'pc_name',
                    'status': 'status',
                    'condition': 'condition',
                    'operatingsystem': 'operatingsystem',
                    'os_version': 'os_version',
                    'os_key': 'os_key',
                    'ms_office_apps': 'ms_office_apps',
                    'ms_office_version': 'ms_office_version',
                    'is_legally_purchased': 'is_legally_purchased',
                    'processor': 'processor',
                    'memory': 'memory',
                    'storage': 'storage',
                    'hostname': 'hostname',
                    'ipaddress': 'ipaddress',
                    'macaddress': 'macaddress',
                    'patchstatus': 'patchstatus',
                    'lastpatch_check': 'lastpatch_check',
                    'isloanable': 'isloanable',
                    'description': 'description',
                    'notes': 'notes'
                };

                for (const [csvCol, dbCol] of Object.entries(fieldMapping)) {
                    if (row[csvCol] !== undefined && row[csvCol] !== '') {
                        columns.push(dbCol);
                        values.push(row[csvCol]);
                        placeholders.push(`$${paramIndex++}`);
                    }
                }

                if (columns.length === 0) {
                    console.log(`⚠️  Row ${i + 1}: Skipped (no data)`);
                    continue;
                }

                const sql = `
          INSERT INTO assets (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (asset_tag) DO UPDATE SET
            ${columns.map((col, idx) => `${col} = $${idx + 1}`).join(', ')}
        `;

                await client.query(sql, values);
                successCount++;

                if ((i + 1) % 10 === 0) {
                    console.log(`✓ Imported ${i + 1}/${results.length} rows...`);
                }

            } catch (error) {
                errorCount++;
                errors.push({
                    row: i + 1,
                    data: row,
                    error: error.message
                });
                console.log(`✗ Row ${i + 1}: ${error.message}`);
            }
        }

        // Commit transaction
        await client.query('COMMIT');

        console.log('');
        console.log('═'.repeat(50));
        console.log('📊 Import Summary:');
        console.log('═'.repeat(50));
        console.log(`✅ Successfully imported: ${successCount} rows`);
        console.log(`❌ Failed: ${errorCount} rows`);
        console.log(`📝 Total processed: ${results.length} rows`);
        console.log('');

        if (errors.length > 0 && errors.length <= 10) {
            console.log('Error details:');
            errors.forEach(err => {
                console.log(`  Row ${err.row}: ${err.error}`);
            });
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Import failed:', error.message);
        console.error('');
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Get CSV file path from command line argument
const csvFilePath = process.argv[2] || '/tmp/import_data.csv';

console.log('');
console.log('═'.repeat(50));
console.log('  ITAM CSV Import Tool');
console.log('═'.repeat(50));
console.log('');

// Check if file exists
if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ Error: File not found: ${csvFilePath}`);
    console.error('');
    console.error('Usage: node import-csv.js <path-to-csv-file>');
    console.error('Example: node import-csv.js ./data/assets.csv');
    process.exit(1);
}

importCSV(csvFilePath).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
