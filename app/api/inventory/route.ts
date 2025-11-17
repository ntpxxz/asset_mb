// app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// (Schema ไม่เปลี่ยนแปลง)
const itemSchema = z.object({
  barcode: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(0, "Quantity cannot be negative"),
  location: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  min_stock_level: z.coerce.number().int().min(0).optional().default(5), 
  price_per_unit: z.coerce.number().min(0).optional().default(0),
  image_url: z.string().optional().nullable(), 
});

// --- vvvv GET FUNCTION ที่แก้ไขแล้ว vvvv ---
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barcode = searchParams.get('barcode');
  
  // --- Pagination and Search Params ---
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const search = searchParams.get('search');

  try {
    // 1. Logic สำหรับ Barcode Lookup (คงเดิม)
    if (barcode) {
      const { rows } = await pool.query('SELECT * FROM inventory_items WHERE barcode = $1 AND is_active = true', [barcode]);
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Item with this barcode not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: rows[0] });
    }
    
    // 2. Logic สำหรับการดึงรายการ (แก้ไขใหม่)
    const whereClauses: string[] = ['is_active = true'];
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (search) {
      whereClauses.push(`(name ILIKE $${paramIndex} OR barcode ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }
    
    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // --- Query 1: นับจำนวนทั้งหมด (สำหรับ TotalPages) ---
    const totalQuery = `SELECT COUNT(*) FROM inventory_items ${whereSql}`;
    const totalResult = await pool.query(totalQuery, queryParams);
    const total = parseInt(totalResult.rows[0].count, 10);

    // --- Query 2: ดึงข้อมูลทีละหน้า ---
    queryParams.push(limit, offset);
    const dataQuery = `
      SELECT * FROM inventory_items 
      ${whereSql} 
      ORDER BY name ASC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const dataResult = await pool.query(dataQuery, queryParams);

    return NextResponse.json({ 
      success: true, 
      data: dataResult.rows,
      total: total // <-- ส่ง Total กลับไปด้วย
    });

  } catch (error) {
    console.error('Failed to fetch inventory items:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}
// --- ^^^^ GET FUNCTION ที่แก้ไขแล้ว ^^^^ ---


// POST /api/inventory - (ฟังก์ชันนี้เหมือนเดิม ไม่ต้องแก้ไข)
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const validation = itemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { barcode, name, quantity, location, category, description, min_stock_level, price_per_unit, image_url } = validation.data;

    await client.query('BEGIN');
    
    let existingItem = null;
    if (barcode) {
      const { rows } = await client.query('SELECT * FROM inventory_items WHERE barcode = $1 FOR UPDATE', [barcode]);
      existingItem = rows[0];
    } else if (name) { // Fallback to name if barcode is not provided
      const { rows } = await client.query('SELECT * FROM inventory_items WHERE name ILIKE $1 FOR UPDATE', [name]);
      existingItem = rows[0];
    }

    let item;
    if (existingItem) {
      // --- START: WEIGHTED AVERAGE COST LOGIC ---
      const existingTotalValue = Number(existingItem.quantity) * Number(existingItem.price_per_unit);
      const newStockValue = Number(quantity) * Number(price_per_unit);
      const newTotalQuantity = existingItem.quantity + quantity;
      
      // Calculate the new average price, avoid division by zero
      const newAveragePrice = newTotalQuantity > 0 ? (existingTotalValue + newStockValue) / newTotalQuantity : 0;
      
      // Update the main item with the new quantity and the NEW AVERAGE PRICE
      const { rows } = await client.query(
        `UPDATE inventory_items 
         SET 
            quantity = $1, 
            price_per_unit = $2, 
            updated_at = NOW(),
            -- Only update image if a new one is provided
            image_url = COALESCE($3, image_url)
         WHERE id = $4 RETURNING *`,
        [newTotalQuantity, newAveragePrice, image_url, existingItem.id]
      );
      item = rows[0];

      // Log the transaction with the ACTUAL PURCHASE PRICE for this specific batch
      await client.query(
        'INSERT INTO inventory_transactions (item_id, transaction_type, quantity_change, price_per_unit, notes) VALUES ($1, $2, $3, $4, $5)',
        [item.id, 'receive', quantity, price_per_unit, 'Stock received']
      );
      // --- END: WEIGHTED AVERAGE COST LOGIC ---

    } else {
      // Item does not exist, create new. The average price is simply the first purchase price.
      const { rows } = await client.query(
        'INSERT INTO inventory_items (barcode, name, quantity, location, category, description, image_url, min_stock_level, price_per_unit) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [barcode || null, name, quantity, location || null, category || null, description || null, image_url || null, min_stock_level, price_per_unit]
      );
      item = rows[0];

      // Log this initial transaction with its purchase price
      await client.query(
        'INSERT INTO inventory_transactions (item_id, transaction_type, quantity_change, price_per_unit, notes) VALUES ($1, $2, $3, $4, $5)',
        [item.id, 'receive', quantity, price_per_unit, 'Initial stock']
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, data: item, message: 'Inventory updated successfully' }, { status: 201 });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to update inventory:', error);
     if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'An item with this barcode already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update inventory' }, { status: 500 });
  } finally {
    client.release();
  }
}