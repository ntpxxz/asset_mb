const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assets';
        `);
        console.log(JSON.stringify(res.rows.map(r => r.column_name).sort()));
    } catch (err) {
        console.error('Error querying schema:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkSchema();
