// app/api/migrate-inventory/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
    const client = await pool.connect();

    try {
        console.log('Starting inventory_items migration...\n');

        const results = [];

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
            results.push('✅ Column min_stock_level added successfully.');
        } else {
            results.push('✅ Column min_stock_level already exists.');
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
            results.push('✅ Column is_active added successfully.');
        } else {
            results.push('✅ Column is_active already exists.');
        }

        // === USERS TABLE MIGRATIONS ===

        // Add location column to users table
        console.log('Checking for location column in users table...');
        const checkUserLocation = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'location'
    `);

        if (checkUserLocation.rows.length === 0) {
            console.log('Adding location column to users table...');
            await client.query(`
        ALTER TABLE users 
        ADD COLUMN location VARCHAR(255)
      `);
            results.push('✅ [users] Column location added successfully.');
        } else {
            results.push('✅ [users] Column location already exists.');
        }

        // === INVENTORY_TRANSACTIONS TABLE MIGRATIONS ===

        // Add transaction_date column (or rename created_at)
        console.log('Checking for transaction_date column in inventory_transactions table...');
        const checkTransactionDate = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'inventory_transactions' AND column_name = 'transaction_date'
    `);

        if (checkTransactionDate.rows.length === 0) {
            console.log('Adding transaction_date column to inventory_transactions table...');
            // Add transaction_date as an alias/copy of created_at for backward compatibility
            await client.query(`
        ALTER TABLE inventory_transactions 
        ADD COLUMN transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
            // Update existing rows to copy created_at to transaction_date
            await client.query(`
        UPDATE inventory_transactions 
        SET transaction_date = created_at 
        WHERE transaction_date IS NULL
      `);
            results.push('✅ [inventory_transactions] Column transaction_date added successfully.');
        } else {
            results.push('✅ [inventory_transactions] Column transaction_date already exists.');
        }

        // === VERIFY TABLE STRUCTURES ===

        const inventoryColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'inventory_items'
      ORDER BY ordinal_position
    `);

        const userColumns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

        return NextResponse.json({
            success: true,
            message: 'Migration completed successfully!',
            results,
            tables: {
                inventory_items: inventoryColumns.rows,
                users: userColumns.rows
            }
        }, { status: 200 });

    } catch (error: any) {
        console.error('❌ Migration failed:', error);
        return NextResponse.json({
            success: false,
            error: 'Migration failed',
            details: error.message
        }, { status: 500 });
    } finally {
        client.release();
    }
}
