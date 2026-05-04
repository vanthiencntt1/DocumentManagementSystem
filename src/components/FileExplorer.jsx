"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function FileExplorer({ files, selectedFolder }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [deepSearchPaths, setDeepSearchPaths] = useState(null); // null means not deep searching
  const [isDeepSearching, setIsDeepSearching] = useState(false);

  const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  };

  const handleDeepSearch = async () => {
    if (!searchQuery.trim()) {
       setDeepSearchPaths(null);
       return;
    }
    setIsDeepSearching(true);
    setDeepSearchPaths(null); // Xóa kết quả cũ để load lại
    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
            const data = await res.json();
            setDeepSearchPaths(data.results);
        }
    } catch (e) {
        console.error(e);
        alert('Lỗi tìm kiếm xuyên thấu!');
    }
    setIsDeepSearching(false);
  };

  const handleClearSearch = () => {
      setSearchQuery('');
      setDeepSearchPaths(null);
  };

  const filteredFiles = useMemo(() => {
    const query = removeAccents(searchQuery.trim());
    
    // Nếu có kết quả deep search, chỉ hiển thị các file nằm trong list deepSearchPaths
    if (deepSearchPaths !== null) {
       return files.filter(f => deepSearchPaths.includes(f.path));
    }

    if (!query) return files;

    return files.filter(f => {
      const fileName = removeAccents(f.name);
      const hospitalName = removeAccents(f.hospital);
      
      const keywords = query.split(' ').filter(k => k.length > 0);
      return keywords.every(kw => 
        fileName.includes(kw) || 
        hospitalName.includes(kw)
      );
    });
  }, [files, searchQuery, deepSearchPaths]);

  // Trong Google Drive, thường hiển thị list file thay vì group quá rõ rệt, 
  // nhưng nếu đang ở "Trang Tổng Quan" ta có thể hiện Folders trước, sau đó Files
  const folders = useMemo(() => {
     if (selectedFolder !== 'Trang Tổng Quan') return [];
     const uniqueHospitals = Array.from(new Set(filteredFiles.map(f => f.hospital)));
     return uniqueHospitals;
  }, [filteredFiles, selectedFolder]);

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      
      {/* Search Bar */}
      <div className="w-full px-4 md:px-6 pt-4 pb-2 flex justify-center">
         <div className="w-full max-w-[800px] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 group">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#444746]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm tài liệu..."
                  className="block w-full pl-12 pr-12 py-3 bg-[#e9eef6] border border-transparent rounded-full focus:bg-white focus:shadow-elevation-1 focus:outline-none transition-all text-[#1f1f1f] placeholder:text-[#444746] text-sm md:text-base"
                  value={searchQuery}
                  onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (deepSearchPaths !== null) setDeepSearchPaths(null);
                  }}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDeepSearch();
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={handleClearSearch}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#444746] hover:text-[#1f1f1f]"
                  >
                    <div className="hover:bg-[#e8eaed] p-1.5 rounded-full transition-colors">
                       <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                       </svg>
                    </div>
                  </button>
                )}
            </div>
            
            <button 
               onClick={handleDeepSearch}
               disabled={isDeepSearching || !searchQuery.trim()}
               className={`shrink-0 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all shadow-sm ${deepSearchPaths !== null ? 'bg-[#0b57d0] text-white' : 'bg-[#e9eef6] text-[#0b57d0] hover:bg-[#d3e3fd]'} disabled:opacity-50 w-full sm:w-auto`}
               title="Quét xuyên thấu nội dung file Word"
            >
               {isDeepSearching ? (
                   <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
               ) : (
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               )}
               {isDeepSearching ? 'Đang Quét...' : (deepSearchPaths !== null ? 'Đang Lọc Nội Dung' : 'Tìm Xuyên Thấu')}
            </button>
         </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 md:px-6 py-3 md:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#e0e0e0] gap-3 sm:gap-0">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
             <h2 className="text-[20px] md:text-[22px] font-normal text-[#1f1f1f]">
                {selectedFolder === 'Trang Tổng Quan' ? 'Drive của tôi' : (selectedFolder === '_chung' ? 'Thư mục chung' : selectedFolder)}
             </h2>
             {deepSearchPaths !== null && (
                 <span className="text-xs font-bold text-white bg-green-600 px-3 py-1 rounded-full animate-pulse shadow-sm">
                     Tìm thấy {filteredFiles.length} file
                 </span>
             )}
         </div>
         <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-full hover:bg-[#e8eaed] transition-colors ${viewMode === 'list' ? 'bg-[#e8eaed] text-[#1f1f1f]' : 'text-[#444746]'}`} title="Chế độ danh sách">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-full hover:bg-[#e8eaed] transition-colors ${viewMode === 'grid' ? 'bg-[#e8eaed] text-[#1f1f1f]' : 'text-[#444746]'}`} title="Chế độ lưới">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            </button>
         </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 custom-scrollbar">
         {filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#444746]">
               <svg className="w-24 h-24 md:w-32 md:h-32 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
               <h3 className="text-lg md:text-xl font-normal text-center">Không có mục nào</h3>
               <p className="text-xs md:text-sm mt-2 text-center">
                   {deepSearchPaths !== null ? `Không tìm thấy từ khóa "${searchQuery}" bên trong tài liệu.` : 'Thử thay đổi từ khóa tìm kiếm'}
               </p>
            </div>
         ) : (
            <div className="pb-8">
               
               {/* Folders Section (Only in Overview and NOT deep searching) */}
               {folders.length > 0 && deepSearchPaths === null && (
                  <div className="mb-6 md:mb-8">
                     <h3 className="text-sm font-medium text-[#444746] mb-3 md:mb-4">Thư mục</h3>
                     <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                        {folders.map(hosp => (
                           <Link key={hosp} href={`/?folder=${encodeURIComponent(hosp)}`} className="flex items-center gap-3 p-3 rounded-xl border border-[#dadce0] bg-[#f8fafd] hover:bg-[#e9eef6] transition-colors w-full overflow-hidden">
                              <svg className="w-6 h-6 shrink-0 text-[#444746]" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                              <span className="font-medium text-sm text-[#1f1f1f] truncate">{hosp === '_chung' ? 'Thư mục chung' : hosp}</span>
                           </Link>
                        ))}
                     </div>
                  </div>
               )}

               {/* Files Section */}
               <div>
                  <h3 className="text-sm font-medium text-[#444746] mb-4">Tệp {deepSearchPaths !== null && '(Kết quả tìm kiếm sâu)'}</h3>
                  
                  {viewMode === 'grid' ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredFiles.map(f => (
                           <Link key={f.path} href={`/view?path=${encodeURIComponent(f.path)}`} className="flex flex-col rounded-xl border border-[#dadce0] bg-[#f8fafd] hover:bg-[#e9eef6] transition-colors w-full overflow-hidden h-[180px]">
                              <div className="flex-1 bg-white flex items-center justify-center p-4 border-b border-[#dadce0]">
                                  {f.name.endsWith('.docx') ? (
                                      <svg className="w-16 h-16 text-[#0b57d0]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                  ) : (
                                      <svg className="w-16 h-16 text-[#444746]" viewBox="0 0 24 24" fill="currentColor"><path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6H6zm7 7V3.5L18.5 9H13z"/></svg>
                                  )}
                              </div>
                              <div className="p-3 flex items-center gap-3">
                                 <svg className="w-5 h-5 shrink-0 text-[#0b57d0]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                 <div className="flex flex-col min-w-0">
                                     <span className="font-medium text-[13px] text-[#1f1f1f] truncate leading-tight">{f.name}</span>
                                     <span className="text-[11px] text-[#444746] truncate">{f.hospital}</span>
                                 </div>
                              </div>
                           </Link>
                        ))}
                     </div>
                  ) : (
                     <div className="flex flex-col">
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-[#dadce0] text-sm font-medium text-[#444746]">
                           <div className="col-span-6 md:col-span-7">Tên</div>
                           <div className="col-span-6 md:col-span-5">Vị trí</div>
                        </div>
                        {filteredFiles.map(f => (
                           <Link key={f.path} href={`/view?path=${encodeURIComponent(f.path)}`} className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#dadce0] hover:bg-[#e8eaed] transition-colors items-center group">
                              <div className="col-span-6 md:col-span-7 flex items-center gap-3 min-w-0">
                                 <svg className="w-5 h-5 shrink-0 text-[#0b57d0]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                 <span className="font-medium text-sm text-[#1f1f1f] truncate">{f.name}</span>
                              </div>
                              <div className="col-span-6 md:col-span-5 text-sm text-[#444746] truncate">
                                 {f.hospital}
                              </div>
                           </Link>
                        ))}
                     </div>
                  )}
               </div>

            </div>
         )}
      </div>
    </div>
  );
}
