import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth-guard";
import { ghPutBinaryFile, ghListDir } from "@/lib/github";

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and sanitize
  const basename = filename.split('/').pop() || filename;
  return basename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

async function checkFileExists(path: string): Promise<boolean> {
  try {
    const files = await ghListDir('public/blog-images');
    return files.some((file: any) => file.path === path);
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    await requireSession();
    
    const images = await ghListDir('public/blog-images');
    
    const imageList = images
      .filter((item: any) => item.type === 'file')
      .map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size,
        url: `/blog-images/${item.name}`,
        downloadUrl: item.download_url
      }))
      .sort((a: any, b: any) => b.name.localeCompare(a.name));

    return NextResponse.json({ images: imageList });
  } catch (error: any) {
    console.error('Failed to list images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list images' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireSession();
    
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customName = formData.get('name') as string | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed. Supported types: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    const filename = sanitizeFilename(customName || file.name);
    
    if (!filename) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const path = `public/blog-images/${filename}`;
    
    // Check if file already exists
    const exists = await checkFileExists(path);
    if (exists) {
      return NextResponse.json(
        { error: `File ${filename} already exists` },
        { status: 409 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = Buffer.from(arrayBuffer).toString('base64');
    
    const result = await ghPutBinaryFile(
      path,
      base64Content,
      `feat: upload image ${filename}`
    );

    return NextResponse.json({
      success: true,
      filename,
      path,
      url: `/blog-images/${filename}`,
      size: file.size,
      type: file.type,
      commit: result
    });
  } catch (error: any) {
    console.error('Failed to upload image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireSession();
    
    const body = await req.json();
    const { filename, sha } = body;
    
    if (!filename || !sha) {
      return NextResponse.json(
        { error: 'Filename and SHA are required' },
        { status: 400 }
      );
    }

    const sanitizedFilename = sanitizeFilename(filename);
    const path = `public/blog-images/${sanitizedFilename}`;
    
    // Note: We'd need to import ghDeleteFile, but let's add it here
    const { ghDeleteFile } = await import('@/lib/github');
    
    const result = await ghDeleteFile(
      path,
      `feat: delete image ${sanitizedFilename}`,
      sha
    );

    return NextResponse.json({
      success: true,
      filename: sanitizedFilename,
      path,
      commit: result
    });
  } catch (error: any) {
    console.error('Failed to delete image:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: error.message.includes('Unauthorized') ? 401 : 500 }
    );
  }
}