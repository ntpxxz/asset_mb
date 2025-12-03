const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

// Helper to generate asset tag
function generateAssetTag(pcName, index) {
    if (pcName && pcName.trim() !== '' && pcName !== '-') {
        return pcName.replace(/[^a-zA-Z0-9.-]/g, '');
    }
    return `AST-${String(index).padStart(5, '0')}`;
}

async function recreateAndImport(csvFilePath) {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to database...');

        // 1. Recreate Schema
        console.log('🔄 Recreating database schema...');
        const schemaPath = path.join(__dirname, 'recreate_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(schemaSql);
        console.log('✅ Schema recreated successfully (Table dropped and created).');
        console.log('');

        // 2. Read and Import CSV
        console.log('📂 Reading CSV file:', csvFilePath);
        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Found ${results.length} rows to import.`);

        let successCount = 0;
        let errorCount = 0;

        // 3. Insert Data
        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
                // Generate Asset Tag
                const assetTag = generateAssetTag(row.pc_name, i + 1);

                // Prepare SQL
                const sql = `
                INSERT INTO assets (
                    asset_tag,
                    building_or_factory,
                    division,
                    section,
                    area,
                    pc_name,
                    pc_type,
                    manufacturer,
                    model,
                    serial_number_cpu,
                    user_owner,
                    os_use,
                    license_free,
                    window_license,
                    os_license,
                    ms_office,
                    version,
                    legally_purchase,
                    refer_document,
                    processor,
                    memory,
                    storage,
                    ip_address,
                    mac_address,
                    hostname,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
                )
            `;

                const values = [
                    assetTag,
                    row.building_or_factory,
                    row.division,
                    row.section,
                    row.area,
                    row.pc_name,
                    row.pc_type,
                    row.manufacturer, // New separated field
                    row.model,        // New separated field
                    row.serial_number_cpu,
                    row.user_owner,
                    row.os_use,
                    row.license_free,
                    row.window_license,
                    row.os_license,
                    row.ms_office,
                    row.version,
                    row.legally_purchase,
                    row.refer_document,
                    row.processor,    // New Tech Spec
                    row.memory,       // New Tech Spec
                    row.storage,      // New Tech Spec
                    row.ip_address,   // New Network Config
                    row.mac_address,  // New Network Config
                    row.hostname      // New Network Config
                ];

                await client.query(sql, values);
                successCount++;

                if ((i + 1) % 100 === 0) process.stdout.write('.');

            } catch (err) {
                errorCount++;
                // console.error(`Error on row ${i}:`, err.message);
            }
        }

        console.log('\n');
        console.log('═'.repeat(60));
        console.log('📊 Import Summary');
        console.log('═'.repeat(60));
        console.log(`✅ Imported: ${successCount}`);
        console.log(`❌ Failed:   ${errorCount}`);
        console.log('═'.repeat(60));

    } catch (err) {
        console.error('❌ Fatal Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

const csvFile = path.join(__dirname, 'Software-Inventory_Dec_Cleaned.csv');
if (!fs.existsSync(csvFile)) {
    console.error('❌ Cleaned CSV not found. Run clean-new-csv.js first.');
} else {
    recreateAndImport(csvFile);
}
