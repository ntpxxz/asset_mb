const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables if using dotenv (optional, depends on your setup)
// require('dotenv').config({ path: '../.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    user: process.env.POSTGRES_USER || 'rootpg',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'asset_management',
    password: process.env.POSTGRES_PASSWORD || '123456',
    port: Number(process.env.POSTGRES_PORT || 5432),
    ssl: false // Set to true/config if using SSL
});

async function runMigration() {
    console.log('🔌 Connecting to database...');
    const client = await pool.connect();

    try {
        console.log('🔧 Starting column name fix migration...');

        const sqlPath = path.join(__dirname, 'fix_column_names.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('✅ Migration completed successfully!');
        console.log('📋 Column names have been aligned with API expectations.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(console.error);