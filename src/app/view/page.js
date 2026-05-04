import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import * as XLSX from "xlsx";
import { listAllFilesFtp, getFileBufferFtp } from "@/lib/ftp";
import EditorComponent from "@/components/EditorComponent";

export default async function ViewPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pathParam = searchParams.path;
  if (!pathParam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
           <h2 className="text-2xl font-bold text-gray-800">Không tìm thấy file</h2>
           <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">Quay lại trang chủ</Link>
        </div>
      </div>
    );
  }

  const parts = pathParam.split('/');
  const fileName = parts.pop();
  const folderName = parts.length > 0 ? parts[0] : 'Tài Liệu Gốc';
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';

  const streamUrl = `/api/files?path=${encodeURIComponent(pathParam)}`;

  // ======== SERVER SIDE RENDERING CHO DOCX VÀ XLSX TỪ FTP ========
  let docHtml = null;

  try {
     const fileBuffer = await getFileBufferFtp(pathParam);
     
     if (ext === 'xlsx' || ext === 'xls') {
         // Convert EXCEL sang HTML Table
         const workbook = XLSX.read(fileBuffer);
         const sheetName = workbook.SheetNames[0];
         docHtml = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]);
     }
  } catch(e) {
      console.error("View Error:", e);
  }

  const canEdit = session.user.role === 'admin' || session.user.role === 'editor';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header Bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 -ml-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-gray-800 leading-tight truncate max-w-xl" title={fileName}>
                        {fileName}
                    </h1>
                    <span className="text-xs text-gray-500 font-medium">Thư mục: {folderName}</span>
                </div>
            </div>
            
            <a 
               href={streamUrl} 
               download={fileName}
               className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm transition"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Tải Xuống Bảng Gốc
            </a>
        </div>
      </header>

      {/* Viewer Frame */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-5xl bg-white shadow-lg rounded-2xl border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: '75vh' }}>
              
              {/* PDF VIEWER */}
              {ext === 'pdf' && (
                  <iframe 
                      src={`${streamUrl}#toolbar=0`} 
                      className="w-full h-full flex-1 min-h-[75vh]" 
                      title={fileName}
                  />
              )}

              {/* IMAGE VIEWER */}
              {(ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') && (
                  <div className="flex-1 flex items-center justify-center p-8 bg-gray-100 min-h-[75vh]">
                      <img src={streamUrl} alt={fileName} className="max-w-full max-h-full rounded shadow" />
                  </div>
              )}

              {/* VIDEO VIEWER */}
              {(ext === 'mp4' || ext === 'webm') && (
                  <div className="flex-1 flex items-center justify-center bg-black min-h-[75vh]">
                      <video controls className="w-full h-full max-h-[75vh]">
                          <source src={streamUrl} type={`video/${ext}`} />
                          Trình duyệt của bạn không hỗ trợ phát thẻ video.
                      </video>
                  </div>
              )}

              {/* DOCX RENDERER VIEWER */}
              {ext === 'docx' && (
                 <EditorComponent 
                   filePath={pathParam} 
                   fileName={fileName}
                   canEdit={canEdit}
                   streamUrl={streamUrl}
                 />
              )}

              {(ext === 'xlsx' || ext === 'xls') && (
                <div className="flex-1 flex flex-col bg-white min-h-[75vh] p-8 sm:p-12 overflow-y-auto max-h-[75vh]">
                     {docHtml ? (
                         <div 
                            className="office-viewer max-w-none w-full mx-auto"
                            dangerouslySetInnerHTML={{ __html: docHtml }} 
                         />
                     ) : (
                         <div className="text-center text-red-500 py-10 my-auto">
                            <p className="font-bold">Lỗi khi phân tích nội dung file Excel.</p>
                         </div>
                     )}
                </div>
              )}

              {/* UNSUPPORTED FILES */}
              {(!['pdf', 'png', 'jpg', 'jpeg', 'webp', 'mp4', 'webm', 'docx', 'xlsx', 'xls'].includes(ext)) && (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 min-h-[75vh] bg-gray-50">
                      <div className="bg-indigo-100 text-indigo-500 rounded-full p-6 mb-6">
                         <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Không thể xem trước định dạng .{ext?.toUpperCase()}</h3>
                  </div>
              )}
          </div>
      </main>
    </div>
  );
}
