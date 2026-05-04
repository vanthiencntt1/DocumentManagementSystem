import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteFromFtp } from "@/lib/ftp";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return new NextResponse('Không có quyền thao tác', { status: 403 });
  }

  const { filePath } = await request.json();
  if (!filePath) return new NextResponse('Missing part', { status: 400 });

  try {
     await deleteFromFtp(filePath);
     return NextResponse.json({ success: true });
  } catch(e) {
     return new NextResponse('Lỗi FTP khi xóa: ' + e.message, { status: 500 });
  }
}
