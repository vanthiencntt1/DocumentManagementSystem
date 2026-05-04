import fs from 'fs/promises';
import path from 'path';
import { getBasePath } from '@/lib/ftp';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const relativePath = searchParams.get('path');
    if (!relativePath) return new NextResponse('Missing path', { status: 400 });

    const basePath = getBasePath();
    const fullPath = path.join(basePath, relativePath);
    const dir = path.dirname(fullPath);
    const ext = path.extname(fullPath);
    const name = path.basename(fullPath, ext);

    const relativeDir = path.relative(basePath, dir);
    // Trỏ vào thư mục .history tập trung ở root
    const historyDir = path.join(basePath, '.history', relativeDir);
    
    try {
        const files = await fs.readdir(historyDir);
        // filter versions
        const versions = [];
        for (const file of files) {
             if (file.startsWith(`${name}_v`) && file.endsWith(ext)) {
                 const stat = await fs.stat(path.join(historyDir, file));
                 versions.push({
                     name: file,
                     path: path.relative(basePath, path.join(historyDir, file)).split(path.sep).join('/'),
                     date: stat.mtime
                 });
             }
        }
        
        // sort desc
        versions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return NextResponse.json({ history: versions });
    } catch(e) {
        return NextResponse.json({ history: [] }); // Thư mục chưa tồn tại
    }
}
