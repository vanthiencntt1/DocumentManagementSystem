import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import ResourceManager from "@/components/ResourceManager";
import { listAllFilesFtp } from "@/lib/ftp";

export default async function ManagePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/login");
  
  if (session.user.role === 'viewer') {
    return <div className="p-8 text-center text-red-500 font-bold text-xl mt-20">Tài khoản Viewer không có quyền truy cập.</div>
  }

  let allFiles = [];
  try {
     allFiles = await listAllFilesFtp();
  } catch(e) {
      console.error("FTP List Error:", e);
  }

  const rootDirs = Array.from(new Set(allFiles.map(f => f.hospital))).filter(h => h !== 'Tài Liệu Gốc');

  return (
    <div className="min-h-screen bg-[#f8fafd] flex flex-col text-[#1f1f1f]">
       <header className="h-16 shrink-0 flex items-center justify-between px-4 bg-white border-b border-[#e0e0e0] sticky top-0 z-50">
          <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-[#e8eaed] rounded-full transition-colors text-[#444746]" title="Quay lại">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </Link>
              <div className="flex items-center gap-2">
                 <svg className="w-8 h-8 text-[#0b57d0]" viewBox="0 0 48 48"><path fill="#FFC107" d="M17 34L24 22H41L34 34z"/><path fill="#1976D2" d="M17 34L7 17H21L31 34z"/><path fill="#4CAF50" d="M24 22L14 39H28L38 22z"/></svg>
                 <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Drive Quản Trị</h1>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <div className="text-sm font-medium bg-[#e8eaed] text-[#1f1f1f] px-3 py-1 rounded-full">
                  Quyền hạn: {session.user.role}
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-medium text-lg uppercase cursor-pointer" title={`${session.user.name}`}>
                 {session.user.name.charAt(0)}
              </div>
          </div>
       </header>

       <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-6">
           <ResourceManager files={allFiles} rootDirs={rootDirs} role={session.user.role} />
       </main>
    </div>
  )
}
