const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function dropForeignKey() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database...');

        // Drop the foreign key constraint
        console.log('🔨 Dropping foreign key constraint: inventory_transactions_user_id_fkey');
        await client.query(`
      ALTER TABLE inventory_transactions 
      DROP CONSTRAINT IF EXISTS inventory_transactions_user_id_fkey;
    `);

        console.log('✅ Successfully dropped foreign key constraint!');
        console.log('🎉 You can now enter free-text names for transactions.');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

dropForeignKey();
