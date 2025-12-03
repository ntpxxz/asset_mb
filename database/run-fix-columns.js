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
s