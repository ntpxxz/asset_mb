import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const returnSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  quantityToReturn: z.coerce.number().int().positive("Quantity must be a positive number"),
  userId: z.string().optional().nullable(), // The user returning the item
  notes: z.string().optional().nullable(),
});

// POST /api/inventory/return - Return an item to stock
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const validation = returnSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { itemId, quantityToReturn, userId, notes } = validation.data;

    await client.query('BEGIN');

    // Get current item and lock the row for update
    const { rows } = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId]);
    const item = rows[0];

    if (!item) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    // Update the quantity by adding the returned amount
    const newQuantity = item.quantity + quantityToReturn;
    await client.query('UPDATE inventory_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQuantity, itemId]);

    // Log the return transaction
    await client.query(
      'INSERT INTO inventory_transactions (item_id, user_id, transaction_type, quantity_change, price_per_unit, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [itemId, userId || null, 'return', quantityToReturn, item.price_per_unit, notes || null] // Use current average price
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Item returned successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to return item:', error);
    return NextResponse.json({ success: false, error: 'Failed to return item' }, { status: 500 });
  } finally {
    client.release();
  }
}