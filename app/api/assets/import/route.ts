import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pool from '@/lib/db';
import fs from 'fs';

// Default path - CHANGE THIS to your actual file path
const DEFAULT_EXCEL_PATH = 'C:\\Users\\Administrator\\Documents\\assets.xlsx';

export async function POST() {
    try {
        const filePath = process.env.EXCEL_IMPORT_PATH || DEFAULT_EXCEL_PATH;

        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: `Excel file not found at: ${filePath}. Please check the path.` },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

        // Assume data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const rows = XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
            return NextResponse.json({ message: 'No data found in Excel file' }, { status: 200 });
        }

        let successCount = 0;
        let errorCount = 0;

        // Process each row
        for (const row of rows as any[]) {
            try {
                // Map Excel columns to Database fields
                // Adjust these keys based on your actual Excel headers
                const assetTag = row['Asset Tag'] || row['AssetTag'] || row['Tag'];
                const serialNumber = row['Serial Number'] || row['SerialNumber'] || row['Serial'];

                // Skip if no unique identifier
                if (!assetTag && !serialNumber) {
                    console.warn('Skipping row without Asset Tag or Serial Number:', row);
                    errorCount++;
                    continue;
                }

                const model = row['Model'] || '';
                const manufacturer = row['Manufacturer'] || '';
                const type = (row['Type'] || 'unknown').toLowerCase();
                const status = (row['Status'] || 'available').toLowerCase();
                const assignedUser = row['Assigned User'] || row['User'] || null;
                const location = row['Location'] || null;
                const purchaseDate = row['Purchase Date'] ? new Date(row['Purchase Date']) : null;
                const purchasePrice = row['Purchase Price'] || row['Price'] || 0;
                const warrantyExpiry = row['Warranty Expiry'] ? new Date(row['Warranty Expiry']) : null;

                // Upsert logic (Update if exists, Insert if new)
                // We'll try to match by Asset Tag first, then Serial Number

                // Check if exists
                let existing = null;
                if (assetTag) {
                    const res = await pool.query('SELECT id FROM assets WHERE asset_tag = $1', [assetTag]);
                    existing = res.rows[0];
                }
                if (!existing && serialNumber) {
                    const res = await pool.query('SELECT id FROM assets WHERE serialnumber = $1', [serialNumber]);
                    existing = res.rows[0];
                }

                if (existing) {
                    // Update
                    await pool.query(
                        `UPDATE assets SET 
              model = $1, manufacturer = $2, type = $3, status = $4, 
              assigneduser = $5, location = $6, purchasedate = $7, 
              purchaseprice = $8, warrantyexpiry = $9, updated_at = NOW()
             WHERE id = $10`,
                        [model, manufacturer, type, status, assignedUser, location, purchaseDate, purchasePrice, warrantyExpiry, existing.id]
                    );
                } else {
                    // Insert
                    await pool.query(
                        `INSERT INTO assets (
              asset_tag, serialnumber, model, manufacturer, type, status, 
              assigneduser, location, purchasedate, purchaseprice, warrantyexpiry, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
                        [assetTag || '', serialNumber || '', model, manufacturer, type, status, assignedUser, location, purchaseDate, purchasePrice, warrantyExpiry]
                    );
                }
                successCount++;
            } catch (err) {
                console.error('Error processing row:', row, err);
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import complete. Processed ${successCount} assets. Failed: ${errorCount}.`,
            stats: { success: successCount, errors: errorCount }
        });

    } catch (error) {
        console.error('Import failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error during import' },
            { status: 500 }
        );
    }
}
