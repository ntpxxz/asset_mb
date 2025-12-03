const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function checkSchema() {
    try {
        const res = await pool.query(`
      SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name 
      FROM information_schema.key_column_usage 
      WHERE table_name = 'inventory_transactions' AND column_name = 'user_id';
    `);
        console.log('Foreign Key Constraints:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchema();
