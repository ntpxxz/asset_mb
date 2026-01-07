import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get image path first
        const planResult = await pool.query('SELECT image_url FROM floor_plans WHERE id = $1', [id]);

        if (planResult.rows.length === 0) {
            return NextResponse.json({ error: 'Floor plan not found' }, { status: 404 });
        }

        const imageUrl = planResult.rows[0].image_url;

        // Delete from DB
        await pool.query('DELETE FROM floor_plans WHERE id = $1', [id]);

        // Try to delete file
        try {
            const filePath = path.join(process.cwd(), 'public', imageUrl);
            await unlink(filePath);
        } catch (err) {
            console.error('Error deleting file:', err);
            // Continue even if file delete fails
        }

        return NextResponse.json({ message: 'Floor plan deleted successfully' });
    } catch (error) {
        console.error('Error deleting floor plan:', error);
        return NextResponse.json({ error: 'Failed to delete floor plan' }, { status: 500 });
    }
}
