import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

// --- START: FIX HERE ---
const itemUpdateSchema = z.object({
  barcode: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  location: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  min_stock_level: z.coerce.number().int().min(0).optional().default(5), 
  price_per_unit: z.coerce.number().min(0).optional().default(0),

  image_url: z.string().optional().nullable(), // <-- **เพิ่มบรรทัดนี้**
});
// --- END: FIX HERE ---


// GET /api/inventory/[id] - Get a single item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { rows } = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [id]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Failed to fetch item:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch item' }, { status: 500 });
  }
}

// PUT /api/inventory/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = await pool.connect();
  try {
    const { id } = params;
    const body = await request.json();
    const validation = itemUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }
    
    // --- START: FIX HERE ---
    const { name, barcode, location, category, description,min_stock_level, price_per_unit, image_url } = validation.data; 

    await client.query('BEGIN');
    
    // --- START: FIX HERE ---
    const { rows } = await client.query(
      `UPDATE inventory_items 
       SET name = $1, barcode = $2, location = $3, category = $4, description = $5, image_url = $6, min_stock_level = $7,price_per_unit=$8, updated_at = NOW() 
       WHERE id = $9 RETURNING *`,
      [name, barcode || null, location || null, category || null, description || null, image_url || null, min_stock_level, price_per_unit, id]
    );
    // --- END: FIX HERE ---
    
    await client.query('COMMIT');
    
    if (rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: rows[0], message: 'Item updated successfully' });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to update item:', error);
    if (error.code === '23505') {
       return NextResponse.json({ success: false, error: 'Another item with this barcode already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  } finally {
    client.release();
  }
}