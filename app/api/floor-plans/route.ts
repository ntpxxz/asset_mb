import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function GET() {
    try {
        const result = await pool.query('SELECT * FROM floor_plans ORDER BY level ASC, name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching floor plans:', error);
        return NextResponse.json({ error: 'Failed to fetch floor plans' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('image') as File;
        const name = formData.get('name') as string;
        const level = formData.get('level') ? parseInt(formData.get('level') as string) : 0;

        if (!file || !name) {
            return NextResponse.json({ error: 'Name and image are required' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const uploadDir = path.join(process.cwd(), 'public/uploads/floor-plans');
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        const imageUrl = `/uploads/floor-plans/${filename}`;

        const result = await pool.query(
            'INSERT INTO floor_plans (name, image_url, level) VALUES ($1, $2, $3) RETURNING *',
            [name, imageUrl, level]
        );

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Error creating floor plan:', error);
        return NextResponse.json({ error: 'Failed to create floor plan' }, { status: 500 });
    }
}
