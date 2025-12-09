// Migration script to add missing columns to inventory_items table
// Run with: node database/migrate-inventory-columns.js

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@pg-main:5432/asset_management'
});

async function migrate() {
    const client = await pool.connect();

    try {
        console.log('Starting migration...\n');

        // Add min_stock_level column
        console.log('Checking for min_stock_level column...');
        const checkMinStock = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'min_stock_level'
    `);

        if (checkMinStock.rows.length === 0) {
            console.log('Adding min_stock_level column...');
            await client.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN min_stock_level INTEGER NOT NULL DEFAULT 5
      `);
            console.log('✅ Column min_stock_level added successfully.\n');
        } else {
            console.log('✅ Column min_stock_level already exists.\n');
        }

        // Add is_active column
        console.log('Checking for is_active column...');
        const checkIsActive = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items' AND column_name = 'is_active'
    `);

        if (checkIsActive.rows.length === 0) {
            console.log('Adding is_active column...');
            await client.query(`
        ALTER TABLE inventory_items 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
      `);
            console.log('✅ Column is_active added successfully.\n');
        } else {
            console.log('✅ Column is_active already exists.\n');
        }

        // Verify the table structure
        console.log('Current inventory_items table structure:');
        const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'inventory_items'
      ORDER BY ordinal_position
    `);

        console.table(columns.rows);
        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrate().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
