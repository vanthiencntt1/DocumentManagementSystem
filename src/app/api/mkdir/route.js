import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { getBasePath } from '@/lib/ftp';

export async function POST(request) {
    try {
        const { folderPath } = await request.json();
        if (!folderPath) return new NextResponse('Missing folderPath', { status: 400 });

        const basePath = getBasePath();
        const fullPath = path.join(basePath, folderPath);

        // Basic security check to ensure it stays within basePath
        if (!fullPath.startsWith(basePath)) {
            return new NextResponse('Invalid path', { status: 403 });
        }

        await fs.mkdir(fullPath, { recursive: true });
        return NextResponse.json({ success: true });
    } catch (e) {
        return new NextResponse(e.message, { status: 500 });
    }
}
