const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://rootpg:123456@localhost:5432/asset_management',
});

async function runMigration() {
    const client = await pool.connect();

    try {
        console.log('🔌 Connected to database...');
        console.log('📋 Reading migration file...');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, 'migration.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Running migration...');
        console.log('─'.repeat(50));

        // Execute the migration
        await client.query(migrationSQL);

        console.log('─'.repeat(50));
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('📊 Verifying tables...');

        // Verify assets table
        const assetsCheck = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'assets'
    `);
        console.log(`   ✓ Assets table: ${assetsCheck.rows[0].column_count} columns`);

        // Verify inventory_items table
        const inventoryCheck = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_items'
    `);
        console.log(`   ✓ Inventory items table: ${inventoryCheck.rows[0].column_count} columns`);

        // Verify inventory_transactions table
        const transactionsCheck = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_transactions'
    `);
        console.log(`   ✓ Inventory transactions table: ${transactionsCheck.rows[0].column_count} columns`);

        // Verify users table
        const usersCheck = await client.query(`
      SELECT COUNT(*) as column_count 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
        console.log(`   ✓ Users table: ${usersCheck.rows[0].column_count} columns`);

        console.log('');
        console.log('🎉 Database update complete!');
        console.log('');
        console.log('New columns added:');
        console.log('  • building, division, section, area, pc_name');
        console.log('  • os_key, os_version, ms_office_apps, ms_office_version');
        console.log('  • is_legally_purchased');
        console.log('');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('');
        console.error('Error details:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
console.log('');
console.log('═'.repeat(50));
console.log('  ITAM Database Migration');
console.log('═'.repeat(50));
console.log('');

runMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
