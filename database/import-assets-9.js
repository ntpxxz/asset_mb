const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

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
                    window_license,
                    os_license,
                    ms_office,
                    version,
                    legally_purchase,
                    processor,
                    memory,
                    storage,
                    ip_address,
                    mac_address,
                    hostname,
                    status,
                    condition,
                    notes,
                    created_at,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW(), NOW()
                )
            `;

                // Map CSV columns to Database columns
                const values = [
                    row.asset_tag,              // asset_tag
                    row.building,               // building_or_factory
                    row.division,               // division
                    row.section,                // section
                    row.area,                   // area
                    row.pc_name,                // pc_name
                    row.type,                   // pc_type
                    row.manufacturer,           // manufacturer
                    row.model,                  // model
                    row.serialnumber,           // serial_number_cpu
                    row.assigneduser,           // user_owner
                    row.operatingsystem,        // os_use
                    row.os_version,             // window_license (mapping based on assumption)
                    row.os_key,                 // os_license
                    row.ms_office_apps,         // ms_office
                    row.ms_office_version,      // version
                    row.is_legally_purchased,   // legally_purchase
                    row.processor,              // processor
                    row.memory,                 // memory
                    row.storage,                // storage
                    row.ipaddress,              // ip_address
                    row.macaddress,             // mac_address
                    row.hostname,               // hostname
                    row.status || 'active',     // status
                    row.condition || 'good',    // condition
                    row.notes                   // notes
                ];

                await client.query(sql, values);
                successCount++;

                if ((i + 1) % 100 === 0) process.stdout.write('.');

            } catch (err) {
                errorCount++;
                console.error(`Error on row ${i} (Asset: ${row.asset_tag}):`, err.message);
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

const csvFile = path.join(__dirname, 'assets - 9.csv');
if (!fs.existsSync(csvFile)) {
    console.error('❌ CSV file not found:', csvFile);
} else {
    recreateAndImport(csvFile);
}
