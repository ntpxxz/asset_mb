const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://rootpg:123456@localhost:5432/asset_management';

const client = new Client({
    connectionString: connectionString,
});

async function runMigration() {
    try {
        await client.connect();
        console.log('Connected to database');

        const sqlPath = path.join(__dirname, '../database/002_add_floor_plans.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
