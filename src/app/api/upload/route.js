import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { uploadToFtp, deleteFromFtp } from "@/lib/ftp";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  
  if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
    return new NextResponse('Không có quyền tải lên', { status: 403 });
  }

  const formData = await request.formData();
  
  const file = formData.get('file');
  const hospital = formData.get('hospital');
  const type = formData.get('type');
  const desc = formData.get('desc');
  const date = formData.get('date');
  const isUpdate = formData.get('isUpdate') === 'true';
  const updatePath = formData.get('updatePath');

  if (!file || !hospital || !type || !desc || !date) {
    return new NextResponse('Thiếu thông tin bắt buộc', { status: 400 });
  }

  // Format desc: chữ thường, không dấu, không ký tự đặc biệt, gạch ngang thay khoảng trắng
  const formatDesc = desc.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const ext = file.name.split('.').pop();
  
  // Quy tắc đặt tên: [loai]_[mô-tả-ngắn]_[dd-mm-yyyy].[đuôi]
  const finalFileName = `${type}_${formatDesc}_${date}.${ext}`;

  // Nếu là chế độ update, xóa file cũ trên FTP trước
  if (isUpdate && updatePath) {
    try {
      await deleteFromFtp(updatePath);
    } catch(e) { console.error("Update Delete Error:", e); }
  }

  // Xử lý buffer
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
      await uploadToFtp(buffer, finalFileName, hospital, type);
      return NextResponse.json({ success: true, message: 'Upload lên FTP thành công', fileName: finalFileName });
  } catch (err) {
      console.error(err);
      return new NextResponse('Lỗi kĩ thuật khi tải lên FTP: ' + err.message, { status: 500 });
  }
}
