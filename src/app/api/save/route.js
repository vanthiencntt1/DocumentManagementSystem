import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { saveToFtp } from "@/lib/ftp";
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return new NextResponse('Không có quyền chỉnh sửa', { status: 403 });
  }

  try {
    const formData = await request.formData();
    const relativePath = formData.get('path');
    const file = formData.get('file');
    const html = formData.get('html');
    
    if (!relativePath) {
      return new NextResponse('Thiếu đường dẫn file', { status: 400 });
    }

    let buffer;

    if (html) {
       // Convert HTML to DOCX buffer
       buffer = await HTMLtoDOCX(html, null, {
          table: { row: { cantSplit: true } },
          footer: true,
          pageNumber: true,
       });
    } else if (file) {
       const bytes = await file.arrayBuffer();
       buffer = Buffer.from(bytes);
    } else {
       return new NextResponse('Thiếu nội dung file hoặc html', { status: 400 });
    }

    await saveToFtp(buffer, relativePath);
    return NextResponse.json({ success: true, message: 'Đã lưu thay đổi thành công' });

  } catch (err) {
    console.error(err);
    return new NextResponse('Lỗi khi lưu: ' + err.message, { status: 500 });
  }
}
