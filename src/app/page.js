import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from 'next/link';
import FileExplorer from "@/components/FileExplorer";
import { listAllFilesFtp } from "@/lib/ftp";

export default async function Dashboard({ searchParams }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  let allFiles = [];
  try {
     allFiles = await listAllFilesFtp();
  } catch(e) {
      console.error("FTP Error:", e);
  }

  const rootDirs = Array.from(new Set(allFiles.map(f => {
      const parts = f.path.split('/');
      return parts.length > 1 ? parts[0] : (f.isDirectory ? f.path : null);
  }))).filter(Boolean);

  const navItems = ['', ...rootDirs]; // '' is Root (Drive của tôi)
  const currentPath = searchParams.folder || '';

  return (
    <div className="h-screen bg-[#f8fafd] flex flex-col overflow-hidden text-[#1f1f1f]">
      {/* Header Container */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4">
         <div className="flex items-center gap-2 w-64 shrink-0">
            <svg className="w-8 h-8 text-[#0b57d0]" viewBox="0 0 48 48"><path fill="#FFC107" d="M17 34L24 22H41L34 34z"/><path fill="#1976D2" d="M17 34L7 17H21L31 34z"/><path fill="#4CAF50" d="M24 22L14 39H28L38 22z"/></svg>
            <h1 className="text-[22px] font-normal text-[#444746] tracking-tight">Drive DMS</h1>
         </div>

         {/* Right actions */}
         <div className="flex items-center gap-4">
            <Link href="/api/auth/signout" className="p-2 hover:bg-[#e8eaed] rounded-full transition-colors text-[#444746]" title="Đăng xuất">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </Link>
            <div className="w-10 h-10 rounded-full bg-[#0b57d0] text-white flex items-center justify-center font-medium text-lg uppercase cursor-pointer" title={`${session.user.name} (${session.user.role})`}>
               {session.user.name.charAt(0)}
            </div>
         </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex flex-row md:flex-col shrink-0 px-3 py-2 overflow-x-auto md:overflow-y-auto custom-scrollbar md:border-none border-b border-[#e0e0e0] bg-[#f8fafd]">
              <nav className="flex flex-row md:flex-col flex-1 gap-2 md:gap-0.5 items-center md:items-stretch">
                  {navItems.map(nav => {
                      const isActive = currentPath === nav || (nav !== '' && currentPath.startsWith(nav));
                      const isExactActive = currentPath === nav;
                      const label = nav === '' ? 'Drive của tôi' : (nav === '_chung' ? 'Thư mục chung' : nav);

                      return (
                         <Link 
                            key={nav} 
                            href={nav === '' ? '/' : `/?folder=${encodeURIComponent(nav)}`}
                            className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${isExactActive ? 'bg-[#c2e7ff] text-[#001d35]' : (isActive ? 'bg-[#e8eaed] text-[#1f1f1f]' : 'text-[#444746] hover:bg-[#e8eaed] bg-white md:bg-transparent border md:border-transparent border-[#dadce0]')}`}
                         >
                            {nav === '' ? (
                               <svg className="w-4 h-4 md:w-5 md:h-5 shrink-0" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? '0' : '2'} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                            ) : (
                               <svg className={`w-4 h-4 md:w-5 md:h-5 shrink-0 ${isActive ? 'text-[#001d35]' : 'text-[#444746]'}`} fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? '0' : '2'} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                            )}
                            <span className="truncate">{label}</span>
                         </Link>
                      )
                  })}
              </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-white md:rounded-t-[1.5rem] md:mr-4 md:mb-4 shadow-sm border border-gray-200 overflow-hidden">
             <FileExplorer files={allFiles} selectedFolder={currentPath} />
          </main>
      </div>
    </div>
  );
}
