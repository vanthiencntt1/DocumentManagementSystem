import { NextResponse } from 'next/server';
import { listAllFilesFtp, getBasePath } from '@/lib/ftp';
import path from 'path';
import fs from 'fs/promises';
import mammoth from 'mammoth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
        return NextResponse.json({ results: [] });
    }

    try {
        const allFiles = await listAllFilesFtp();
        const basePath = getBasePath();
        const matchedPaths = [];
        
        const qLower = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Chạy qua tất cả các file để lấy nội dung
        for (const file of allFiles) {
            if (file.name.toLowerCase().endsWith('.docx')) {
                try {
                    const fullPath = path.join(basePath, file.path);
                    const buffer = await fs.readFile(fullPath);
                    const result = await mammoth.extractRawText({ buffer });
                    const text = result.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    
                    if (text.includes(qLower)) {
                        matchedPaths.push(file.path);
                    }
                } catch (e) {
                    console.error("Lỗi extract raw text", file.path, e);
                }
            }
        }

        return NextResponse.json({ results: matchedPaths });
    } catch (e) {
        console.error(e);
        return new NextResponse('Lỗi server', { status: 500 });
    }
}
