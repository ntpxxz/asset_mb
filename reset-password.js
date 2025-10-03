const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const employeeId = process.argv[2];
const newPassword = process.argv[3];

// --- 1. Check for input ---
if (!employeeId || !newPassword) {
  console.error('🔴 Usage: node reset-password.js <employee_id> "your-new-password"');
  process.exit(1);
}

// --- 2. Database Connection Configuration ---
const dbConfig = {
  user: 'rootpg',
  host: 'localhost',
  database: 'asset_management',
  password: '123456',
  port: 5432,
};
console.log('🔵 Attempting to connect to database with config:', dbConfig);

const pool = new Pool(dbConfig);
const saltRounds = 10;

async function resetPassword() {
  try {
    // --- 3. Hashing Password ---
    console.log(`🔵 Hashing password for employee: ${employeeId}...`);
    const hash = await bcrypt.hash(newPassword, saltRounds);
    console.log('🔵 Password hashed successfully. Hash starts with:', hash.substring(0, 10) + '...');
    
    // --- 4. Updating Database ---
    console.log(`🔵 Executing UPDATE query for employee_id: ${employeeId}`);
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE employee_id = $2 RETURNING id, employee_id',
      [hash, employeeId]
    );

    // --- 5. Checking Result ---
    console.log(`🔵 Query finished. Rows updated: ${result.rowCount}`);

    if (result.rowCount > 0) {
      console.log(`✅ Successfully updated password for user: ${result.rows[0].employee_id}`);
    } else {
      console.error(`❌ Error: Employee ID "${employeeId}" not found in the database. No rows were updated.`);
    }
  } catch (err) {
    console.error('🔴 An error occurred during the process:', err.message);
  } finally {
    await pool.end();
    console.log('🔵 Database connection closed.');
  }
}

resetPassword();