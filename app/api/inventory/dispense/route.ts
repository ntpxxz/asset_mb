import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { z } from 'zod';

const dispenseSchema = z.object({
  itemId: z.number().int().positive("Item ID is required"),
  quantityToDispense: z.coerce.number().int().positive("Quantity must be a positive number"),
  userId: z.string().optional().nullable(), // The user receiving the item
  notes: z.string().optional().nullable(),
});

// POST /api/inventory/dispense - Dispense an item
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const validation = dispenseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ success: false, error: 'Invalid input', details: validation.error.flatten() }, { status: 400 });
    }

    const { itemId, quantityToDispense, userId, notes } = validation.data;

    await client.query('BEGIN');

    // Get current item data, including its price, and lock the row for update
    const { rows } = await client.query('SELECT * FROM inventory_items WHERE id = $1 FOR UPDATE', [itemId]);
    const item = rows[0];

    if (!item) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    if (item.quantity < quantityToDispense) {
      await client.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Insufficient stock available' }, { status: 400 });
    }

    // Update the quantity in the main inventory table
    const newQuantity = item.quantity - quantityToDispense;
    await client.query('UPDATE inventory_items SET quantity = $1, updated_at = NOW() WHERE id = $2', [newQuantity, itemId]);

    // --- FIX IS HERE: Log the dispense transaction WITH PRICE ---
    await client.query(
      'INSERT INTO inventory_transactions (item_id, user_id, transaction_type, quantity_change, price_per_unit, notes) VALUES ($1, $2, $3, $4, $5, $6)',
      [itemId, userId || null, 'dispense', -quantityToDispense, item.price_per_unit, notes || null]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true, message: 'Item dispensed successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to dispense item:', error);
    return NextResponse.json({ success: false, error: 'Failed to dispense item' }, { status: 500 });
  } finally {
    client.release();
  }
}