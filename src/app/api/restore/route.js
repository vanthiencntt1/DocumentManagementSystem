import fs from 'fs/promises';
import path from 'path';
import { getBasePath } from '@/lib/ftp';
import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Quản lý phiên bản tự động
async function backupExistingFile(fullPath) {
    try {
        await fs.access(fullPath); // Kiểm tra file tồn tại
        const ext = path.extname(fullPath);
        const dir = path.dirname(fullPath);
        const name = path.basename(fullPath, ext);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const basePath = getBasePath();
        
        const relativeDir = path.relative(basePath, dir);
        const historyDir = path.join(basePath, '.history', relativeDir);
        await fs.mkdir(historyDir, { recursive: true });
        
        const backupPath = path.join(historyDir, `${name}_v${timestamp}${ext}`);
        await fs.copyFile(fullPath, backupPath); // Copy file hiện tại vào lịch sử (khác với rename ở ftp.js)
    } catch (e) {
        // File không tồn tại, bỏ qua
    }
}

export async function POST(request) {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
        return new NextResponse('Không có quyền khôi phục', { status: 403 });
    }

    try {
        const { historyPath, originalPath } = await request.json();
        if (!historyPath || !originalPath) return new NextResponse('Thiếu thông tin', { status: 400 });

        const basePath = getBasePath();
        const absoluteHistoryPath = path.join(basePath, historyPath);
        const absoluteOriginalPath = path.join(basePath, originalPath);

        // 1. Backup file original hiện tại (nếu có) vào lịch sử trước khi đè
        await backupExistingFile(absoluteOriginalPath);

        // 2. Chép đè lịch sử lên original
        await fs.copyFile(absoluteHistoryPath, absoluteOriginalPath);

        return NextResponse.json({ success: true, message: 'Đã khôi phục thành công' });
    } catch (err) {
        console.error(err);
        return new NextResponse('Lỗi khôi phục: ' + err.message, { status: 500 });
    }
}
