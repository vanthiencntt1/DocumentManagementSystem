import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getFtpStream } from "@/lib/ftp";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');

  if (!filePath) {
    return new NextResponse('File path missing', { status: 400 });
  }
  
  try {
     const { ftp, stream } = await getFtpStream(filePath);
     
     // Sau khi stream kết thúc, đóng connection
     stream.on('end', () => ftp.end());
     stream.on('error', () => ftp.end());

     const ext = filePath.split('.').pop().toLowerCase();
     let contentType = 'application/octet-stream';
     if (ext === 'pdf') contentType = 'application/pdf';
     else if (ext === 'png') contentType = 'image/png';
     else if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
     else if (ext === 'mp4') contentType = 'video/mp4';

     return new NextResponse(stream, {
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${encodeURIComponent(filePath.split('/').pop())}"`,
        }
     });

  } catch (err) {
      console.error("FTP Stream Error:", err);
      return new NextResponse('File Server Error: ' + err.message, { status: 500 });
  }
}
