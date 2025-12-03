import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkColumns() {
    try {
        const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assets'
      ORDER BY ordinal_position;
    `);

        console.log('\n=== ACTUAL COLUMNS IN assets TABLE ===\n');
        result.rows.forEach(row => {
            console.log(`${row.column_name.padEnd(30)} ${row.data_type.padEnd(20)} ${row.is_nullable}`);
        });
        console.log('\n=== TOTAL COLUMNS:', result.rows.length, '===\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkColumns();
