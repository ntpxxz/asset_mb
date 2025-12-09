const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function checkCount() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT COUNT(*) FROM assets');
        console.log('Total assets in DB:', res.rows[0].count);
    } catch (err) {
        console.error('Error querying count:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

checkCount();
