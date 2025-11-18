import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import path from 'path';
import { constants } from 'fs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  try {
    // Await params ก่อน
    const params = await context.params;
    const filename = params.filename;
    
    // ป้องกัน path traversal
    if (filename.includes('..') || filename.includes('/')) {
      return new NextResponse('Invalid filename', { status: 400 });
    }
    
    const filePath = path.join(process.cwd(), 'public/uploads', filename);
    
    console.log(`Attempting to serve image from: ${filePath}`);
    
    // เช็คว่าไฟล์มีอยู่
    try {
      await access(filePath, constants.R_OK);
    } catch {
      console.error(`File not found: ${filePath}`);
      return new NextResponse('Image not found', { status: 404 });
    }
    
    const fileBuffer = await readFile(filePath);
    
    const ext = path.extname(filename).toLowerCase();
    const contentTypeMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    
    const contentType = contentTypeMap[ext] || 'application/octet-stream';
    
    console.log(`Successfully serving ${filename} as ${contentType}`);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}