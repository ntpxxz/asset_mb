import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const itemUpdateSchema = z.object({
  barcode: z.string().optional().nullable(),
  name: z.string().min(1, "Item name is required"),
  location: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
});

type Ctx = { params: Promise<{ id: string }> }; // <-- ต้องเป็น Promise<{ id }>

export async function GET(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;
  try {
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

export async function PUT(request: NextRequest, context: Ctx) {
  const params = await context.params;
  const id = params.id;

  const client = await pool.connect();
  try {
    const body = await request.json();
    const validation = itemUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }
    const { name, barcode, location, category, description, image_url } = validation.data;

    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE inventory_items 
       SET name = $1, barcode = $2, location = $3, category = $4, description = $5, image_url = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [name, barcode ?? null, location ?? null, category ?? null, description ?? null, image_url ?? null, id]
    );
    await client.query('COMMIT');

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: rows[0], message: 'Item updated successfully' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Failed to update item:', error);
    if (error?.code === '23505') {
      return NextResponse.json({ success: false, error: 'Another item with this barcode already exists.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  } finally {
    client.release();
  }
}
export async function DELETE(
  request: NextRequest,
  context: Ctx,
) {
  const params = await context.params;
  const id = params.id;

  try {
    // เปลี่ยนจาก DELETE เป็น UPDATE
    const { rowCount } = await pool.query(
      'UPDATE inventory_items SET is_active = false, updated_at = NOW() WHERE id = $1',
      [id],
    );

    if (rowCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Item not found' },
        { status: 404 },
      );
    }

    // ถ้าสำเร็จ ก็ส่ง message ว่า "deleted" เหมือนเดิม
    return NextResponse.json({ success: true, message: 'Item deleted (archived) successfully' });

  } catch (error: any) {
    console.error('Failed to archive item:', error);
    // Error อื่นๆ ที่ไม่ใช่ Foreign Key (เผื่อไว้)
    return NextResponse.json(
      { success: false, error: 'Failed to archive item' },
      { status: 500 },
    );
  }
}