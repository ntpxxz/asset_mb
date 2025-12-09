const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function updateData(csvFilePath) {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to database...');
        console.log('📂 Reading CSV file:', csvFilePath);

        const results = [];

        await new Promise((resolve, reject) => {
            fs.createReadStream(csvFilePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', resolve)
                .on('error', reject);
        });

        console.log(`📊 Found ${results.length} rows to process.`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < results.length; i++) {
            const row = results[i];

            try {
                // Handle empty strings for numeric/date fields to avoid syntax errors or invalid input
                const cleanRow = { ...row };

                const parseDate = (dateStr) => {
                    if (!dateStr || dateStr === 'NULL' || dateStr === '-' || dateStr === '') return null;
                    // Try to parse DD/MM/YYYY
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        // Assume DD/MM/YYYY
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return null;
                };

                ['purchasedate', 'warrantyexpiry', 'lastpatch_check'].forEach(field => {
                    cleanRow[field] = parseDate(cleanRow[field]);
                });

                ['purchaseprice'].forEach(field => {
                    if (cleanRow[field] === 'NULL' || cleanRow[field] === '') {
                        cleanRow[field] = null;
                    }
                });
                // Handle boolean fields
                ['isloanable'].forEach(field => {
                    if (cleanRow[field] === 'TRUE') cleanRow[field] = true;
                    else if (cleanRow[field] === 'FALSE') cleanRow[field] = false;
                    else cleanRow[field] = null;
                });

                // Fix created_at if it's just time or invalid
                if (!cleanRow.created_at || cleanRow.created_at.length < 10) {
                    cleanRow.created_at = new Date();
                }

                const sql = `
                    INSERT INTO assets (
                        asset_tag,
                        type,
                        manufacturer,
                        model,
                        serialnumber,
                        purchasedate,
                        purchaseprice,
                        supplier,
                        warrantyexpiry,
                        assigneduser,
                        location,
                        department,
                        building,
                        division,
                        section,
                        area,
                        pc_name,
                        status,
                        condition,
                        operatingsystem,
                        os_version,
                        os_key,
                        ms_office_apps,
                        ms_office_version,
                        is_legally_purchased,
                        processor,
                        memory,
                        storage,
                        hostname,
                        ipaddress,
                        macaddress,
                        patchstatus,
                        lastpatch_check,
                        isloanable,
                        description,
                        notes,
                        created_at,
                        updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, NOW()
                    )
                    ON CONFLICT (asset_tag) DO UPDATE SET
                        type = EXCLUDED.type,
                        manufacturer = EXCLUDED.manufacturer,
                        model = EXCLUDED.model,
                        serialnumber = EXCLUDED.serialnumber,
                        purchasedate = EXCLUDED.purchasedate,
                        purchaseprice = EXCLUDED.purchaseprice,
                        supplier = EXCLUDED.supplier,
                        warrantyexpiry = EXCLUDED.warrantyexpiry,
                        assigneduser = EXCLUDED.assigneduser,
                        location = EXCLUDED.location,
                        department = EXCLUDED.department,
                        building = EXCLUDED.building,
                        division = EXCLUDED.division,
                        section = EXCLUDED.section,
                        area = EXCLUDED.area,
                        pc_name = EXCLUDED.pc_name,
                        status = EXCLUDED.status,
                        condition = EXCLUDED.condition,
                        operatingsystem = EXCLUDED.operatingsystem,
                        os_version = EXCLUDED.os_version,
                        os_key = EXCLUDED.os_key,
                        ms_office_apps = EXCLUDED.ms_office_apps,
                        ms_office_version = EXCLUDED.ms_office_version,
                        is_legally_purchased = EXCLUDED.is_legally_purchased,
                        processor = EXCLUDED.processor,
                        memory = EXCLUDED.memory,
                        storage = EXCLUDED.storage,
                        hostname = EXCLUDED.hostname,
                        ipaddress = EXCLUDED.ipaddress,
                        macaddress = EXCLUDED.macaddress,
                        patchstatus = EXCLUDED.patchstatus,
                        lastpatch_check = EXCLUDED.lastpatch_check,
                        isloanable = EXCLUDED.isloanable,
                        description = EXCLUDED.description,
                        notes = EXCLUDED.notes,
                        updated_at = NOW();
                `;

                const values = [
                    cleanRow.asset_tag,
                    cleanRow.type,
                    cleanRow.manufacturer,
                    cleanRow.model,
                    cleanRow.serialnumber,
                    cleanRow.purchasedate,
                    cleanRow.purchaseprice,
                    cleanRow.supplier,
                    cleanRow.warrantyexpiry,
                    cleanRow.assigneduser,
                    cleanRow.location,
                    cleanRow.department,
                    cleanRow.building,
                    cleanRow.division,
                    cleanRow.section,
                    cleanRow.area,
                    cleanRow.pc_name,
                    cleanRow.status,
                    cleanRow.condition,
                    cleanRow.operatingsystem,
                    cleanRow.os_version,
                    cleanRow.os_key,
                    cleanRow.ms_office_apps,
                    cleanRow.ms_office_version,
                    cleanRow.is_legally_purchased,
                    cleanRow.processor,
                    cleanRow.memory,
                    cleanRow.storage,
                    cleanRow.hostname,
                    cleanRow.ipaddress,
                    cleanRow.macaddress,
                    cleanRow.patchstatus,
                    cleanRow.lastpatch_check,
                    cleanRow.isloanable,
                    cleanRow.description,
                    cleanRow.notes,
                    cleanRow.created_at || new Date()
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
        console.log('📊 Update Summary');
        console.log('═'.repeat(60));
        console.log(`✅ Processed: ${successCount}`);
        console.log(`❌ Failed:    ${errorCount}`);
        console.log('═'.repeat(60));

    } catch (err) {
        console.error('❌ Fatal Error:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

const csvFile = path.join(__dirname, 'data-1765248099347.csv');
if (!fs.existsSync(csvFile)) {
    console.error('❌ CSV file not found:', csvFile);
} else {
    updateData(csvFile);
}
