import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const adjustSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  newQuantity: z.coerce.number().int().min(0, "New quantity cannot be negative"),
  userId: z.string().optional().nullable(),
  notes: z.string().min(1, "Reason for adjustment is required"),
});

// POST /api/inventory/adjust - Adjust an item's stock quantity
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const validation = adjustSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { itemId, newQuantity, userId, notes } = validation.data;

    await client.query('BEGIN');

    // Get current item and lock the row for update
    const { rows } = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId]);
    const item = rows[0];

    if (!item) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    // Calculate the difference
    const quantityChange = newQuantity - item.quantity;

    if (quantityChange === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'New quantity is the same as the current quantity. No adjustment needed.' }, { status: 400 });
    }

    // Update the quantity in the main inventory table to the new physical count
    await client.query('UPDATE inventory_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQuantity, itemId]);

    // Log the adjustment transaction with the calculated change
    await client.query(
      'INSERT INTO inventory_transactions (item_id, user_id, transaction_type, quantity_change, price_per_unit, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [itemId, userId || null, 'adjust', quantityChange, item.price_per_unit, notes]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Stock adjusted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to adjust stock:', error);
    return NextResponse.json({ success: false, error: 'Failed to adjust stock' }, { status: 500 });
  } finally {
    client.release();
  }
}