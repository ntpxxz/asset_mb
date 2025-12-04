const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'pg-main',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'rootpg',
    password: process.env.POSTGRES_PASSWORD || '123456',
    database: process.env.POSTGRES_DB || 'asset_management',
});

async function createTable() {
    const createTableSQL = `
    CREATE TABLE IF NOT EXISTS assets (
      id SERIAL PRIMARY KEY,
      asset_tag VARCHAR(255) UNIQUE NOT NULL,
      type VARCHAR(100),
      manufacturer VARCHAR(255),
      model VARCHAR(255),
      serialnumber VARCHAR(255),
      purchasedate VARCHAR(50),
      purchaseprice VARCHAR(50),
      supplier VARCHAR(255),
      warrantyexpiry VARCHAR(50),
      assigneduser VARCHAR(255),
      location VARCHAR(255),
      department VARCHAR(255),
      status VARCHAR(50) DEFAULT 'in-stock',
      operatingsystem VARCHAR(255),
      processor VARCHAR(255),
      memory VARCHAR(100),
      storage VARCHAR(100),
      hostname VARCHAR(255),
      ipaddress VARCHAR(50),
      macaddress VARCHAR(50),
      patchstatus VARCHAR(50) DEFAULT 'needs-review',
      lastpatch_check VARCHAR(50),
      isloanable BOOLEAN DEFAULT false,
      condition VARCHAR(50) DEFAULT 'good',
      description TEXT,
      notes TEXT,
      building VARCHAR(255),
      division VARCHAR(255),
      section VARCHAR(255),
      area VARCHAR(255),
      pc_name VARCHAR(255),
      os_key VARCHAR(255),
      os_version VARCHAR(100),
      ms_office_apps VARCHAR(255),
      ms_office_version VARCHAR(100),
      is_legally_purchased VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_asset_tag ON assets(asset_tag);
    CREATE INDEX IF NOT EXISTS idx_status ON assets(status);
    CREATE INDEX IF NOT EXISTS idx_type ON assets(type);
    CREATE INDEX IF NOT EXISTS idx_department ON assets(department);
  `;

    await pool.query(createTableSQL);
    console.log('Table created successfully');
}

async function importAssets() {
    const csvPath = path.join(__dirname, '../database/assets (6).csv');
    const csvContent = fs.readFileSync(csvPath, 'latin1');

    const lines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
    console.log(`Found ${lines.length} records to import`);

    const assets = lines.map((line) => {
        // Simple CSV parsing handling quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                parts.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        parts.push(current.trim());

        const clean = (val) => val === '-' ? '' : val.replace(/^"|"$/g, '');

        return {
            asset_tag: clean(parts[5]) || `UNKNOWN-${clean(parts[0])}`,
            type: (clean(parts[6]) || 'computer').toLowerCase(),
            manufacturer: 'Unknown',
            model: clean(parts[7]) || 'Unknown',
            serialnumber: clean(parts[8]) || 'Unknown',
            purchasedate: clean(parts[11]) || null,
            purchaseprice: null,
            supplier: '',
            warrantyexpiry: null,
            assigneduser: clean(parts[9]),
            location: clean(parts[4]),
            department: clean(parts[2]),
            status: 'in-use',
            operatingsystem: clean(parts[10]),
            processor: '',
            memory: '',
            storage: '',
            hostname: clean(parts[5]),
            ipaddress: '',
            macaddress: '',
            patchstatus: 'needs-review',
            lastpatch_check: null,
            isloanable: clean(parts[16]) === 'Yes',
            condition: 'good',
            description: `Imported from CSV. Division: ${clean(parts[1])}, Section: ${clean(parts[3])}`,
            notes: '',
            building: '',
            division: clean(parts[1]),
            section: clean(parts[3]),
            area: clean(parts[4]),
            pc_name: clean(parts[5]),
            os_key: clean(parts[12]),
            os_version: clean(parts[13]),
            ms_office_apps: clean(parts[14]),
            ms_office_version: clean(parts[15]),
            is_legally_purchased: clean(parts[11]),
        };
    });

    console.log('Starting database import...');

    // Clear existing assets
    await pool.query('DELETE FROM assets');
    console.log('Cleared existing assets');

    // Import in batches
    const batchSize = 100;
    for (let i = 0; i < assets.length; i += batchSize) {
        const batch = assets.slice(i, i + batchSize);

        for (const asset of batch) {
            const insertSQL = `
        INSERT INTO assets (
          asset_tag, type, manufacturer, model, serialnumber, purchasedate,
          purchaseprice, supplier, warrantyexpiry, assigneduser, location,
          department, status, operatingsystem, processor, memory, storage,
          hostname, ipaddress, macaddress, patchstatus, lastpatch_check,
          isloanable, condition, description, notes, building, division,
          section, area, pc_name, os_key, os_version, ms_office_apps,
          ms_office_version, is_legally_purchased
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
          $29, $30, $31, $32, $33, $34, $35, $36
        )
        ON CONFLICT (asset_tag) DO NOTHING
      `;

            const values = [
                asset.asset_tag, asset.type, asset.manufacturer, asset.model,
                asset.serialnumber, asset.purchasedate, asset.purchaseprice,
                asset.supplier, asset.warrantyexpiry, asset.assigneduser,
                asset.location, asset.department, asset.status, asset.operatingsystem,
                asset.processor, asset.memory, asset.storage, asset.hostname,
                asset.ipaddress, asset.macaddress, asset.patchstatus,
                asset.lastpatch_check, asset.isloanable, asset.condition,
                asset.description, asset.notes, asset.building, asset.division,
                asset.section, asset.area, asset.pc_name, asset.os_key,
                asset.os_version, asset.ms_office_apps, asset.ms_office_version,
                asset.is_legally_purchased
            ];

            await pool.query(insertSQL, values);
        }

        console.log(`Imported ${Math.min(i + batchSize, assets.length)} / ${assets.length} assets`);
    }

    console.log('Import completed successfully!');
}

async function main() {
    try {
        await createTable();
        await importAssets();
    } catch (error) {
        console.error('Error importing assets:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

main();
