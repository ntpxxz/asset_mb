import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided." }, { status: 400 });
  }

  // Validate File Type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ 
      success: false, 
      error: `Invalid file type. Only ${allowedTypes.join(', ')} are allowed.` 
    }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Sanitize and Create a Unique Filename
  const sanitizedFilename = file.name.replace(/[^a-z0-9_.\-]/gi, '_');
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const filename = `${uniqueSuffix}-${sanitizedFilename}`;
  
  // Ensure Upload Directory Exists
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  const filePath = path.join(uploadDir, filename);

  try {
    await mkdir(uploadDir, { recursive: true });
    await writeFile(filePath, buffer);
    console.log(`File saved to ${filePath}`);

    // ใช้ /uploads/ เพื่อให้ Nginx serve ไฟล์โดยตรง
    const image_url = `/uploads/${filename}`;
    
    return NextResponse.json({ success: true, image_url: image_url });

  } catch (error) {
    console.error("Error saving file:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to save the uploaded file." 
    }, { status: 500 });
  }
}