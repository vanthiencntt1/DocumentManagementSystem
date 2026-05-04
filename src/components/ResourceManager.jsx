"use client";
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function ResourceManager({ files, rootDirs, role }) {
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [currentPage, setCurrentPage] = useState(1);
   
   // Form States
   const [hospital, setHospital] = useState('_chung');
   const [type, setType] = useState('hop-dong');
   const [desc, setDesc] = useState('');
   const [selectedFile, setSelectedFile] = useState(null);
   const [isUpdateMode, setIsUpdateMode] = useState(false);
   const [updatePath, setUpdatePath] = useState('');

   const [msg, setMsg] = useState({ text:'', type:'' });

   const currentMonthStr = useMemo(() => {
      const d = new Date();
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
   }, []);

   const handleUpload = async (e) => {
       e.preventDefault();
       if (!selectedFile) return alert("Vui lòng chọn tệp");
       
       setLoading(true);
       setMsg({text: '', type: ''});
       
       const formData = new FormData();
       formData.append('hospital', hospital);
       formData.append('type', type);
       formData.append('desc', desc);
       formData.append('date', currentMonthStr); // Tự động sinh tháng/năm
       formData.append('file', selectedFile);
       formData.append('isUpdate', isUpdateMode);
       formData.append('updatePath', updatePath);

       const res = await fetch('/api/upload', {
           method: 'POST',
           body: formData
       });

       if (res.ok) {
           const json = await res.json();
           setMsg({ text: isUpdateMode ? 'Đã cập nhật phiên bản mới.' : 'Đã tải tệp lên: ' + json.fileName, type: 'success' });
           // Reset form
           setDesc('');
           setSelectedFile(null);
           setIsUpdateMode(false);
           setUpdatePath('');
           document.getElementById("fileInput").value = "";
           router.refresh();
       } else {
           const err = await res.text();
           setMsg({ text: err, type: 'error' });
       }
       setLoading(false);
   }

   const handlePrepareUpdate = (f) => {
       setIsUpdateMode(true);
       setUpdatePath(f.path);
       setHospital(f.hospital === 'Tài Liệu Gốc' ? '_chung' : f.hospital);
       
       const parts = f.name.replace(/\.[^/.]+$/, "").split('_');
       if (parts.length >= 3) {
           setType(parts[0]);
           setDesc(parts[1]);
       }
       window.scrollTo({ top: 0, behavior: 'smooth' });
   };

   const handleDelete = async (filePath) => {
       if (!confirm("Chuyển tệp này vào thùng rác?")) return;
       
       const res = await fetch('/api/delete', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ filePath })
       });

       if (res.ok) {
           router.refresh();
       } else {
           alert(await res.text());
       }
   };

   const DOC_TYPES = ['hop-dong', 'bien-ban', 'huong-dan-rieng', 'bao-cao', 'quy-trinh', 'bao-gia', 'dao-tao', 'mau-bieu', 'cong-van', 'HIS', 'PHIS', 'LIS', 'PACS', 'RIS', 'BIS', 'API', 'CKS', 'EMR'];

   return (
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Upload Form Area */}
           <div className="lg:col-span-4 bg-white rounded-[1rem] p-6 shadow-elevation-1 border border-[#dadce0] self-start sticky top-24 transition-all">
               <div className="mb-6">
                  <h2 className="text-xl font-normal text-[#1f1f1f]">
                     {isUpdateMode ? 'Cập nhật tệp' : 'Tải lên Drive'}
                  </h2>
               </div>

               {isUpdateMode && (
                 <div className="mb-6 p-4 bg-[#fff8e1] text-[#b06000] rounded-lg border border-[#ffecb3] flex flex-col gap-2">
                    <span className="text-sm font-medium">Đang cập nhật phiên bản mới cho tệp:</span>
                    <span className="truncate text-sm font-bold">{updatePath.split('/').pop()}</span>
                    <button onClick={() => setIsUpdateMode(false)} className="mt-2 text-sm font-medium text-[#b06000] hover:text-[#e65100] underline w-max">Hủy</button>
                 </div>
               )}

               {msg.text && (
                  <div className={`mb-6 p-4 rounded-lg text-sm font-medium border ${msg.type === 'success' ? 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]' : 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'}`}>
                     {msg.text}
                  </div>
               )}

               <form onSubmit={handleUpload} className="space-y-6">
                   <div className="space-y-1">
                       <label className="block text-sm font-medium text-[#444746]">Vị trí tải lên</label>
                       <select value={hospital} onChange={e => setHospital(e.target.value)} className="w-full bg-transparent border-b border-[#747775] px-2 py-2 text-[#1f1f1f] text-sm focus:outline-none focus:border-[#0b57d0] focus:border-b-2 hover:bg-[#f8fafd] transition-colors">
                           <option value="_chung">Thư mục chung</option>
                           {rootDirs.filter(r => r !== '_chung').map(dir => (
                               <option key={dir} value={dir}>{dir}</option>
                           ))}
                       </select>
                   </div>

                   <div className="space-y-1">
                       <label className="block text-sm font-medium text-[#444746]">Loại tài liệu</label>
                       <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-transparent border-b border-[#747775] px-2 py-2 text-[#1f1f1f] text-sm focus:outline-none focus:border-[#0b57d0] focus:border-b-2 hover:bg-[#f8fafd] transition-colors">
                           {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ').toUpperCase()}</option>)}
                       </select>
                   </div>

                   <div className="space-y-1">
                       <label className="block text-sm font-medium text-[#444746]">Mô tả</label>
                       <input required type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nhập mô tả tệp" className="w-full bg-transparent border-b border-[#747775] px-2 py-2 text-[#1f1f1f] text-sm focus:outline-none focus:border-[#0b57d0] focus:border-b-2 hover:bg-[#f8fafd] transition-colors" />
                   </div>

                   <div className="space-y-1">
                       <label className="block text-sm font-medium text-[#444746]">{isUpdateMode ? 'Chọn tệp mới' : 'Chọn tệp'}</label>
                       <input id="fileInput" required type="file" onChange={e => setSelectedFile(e.target.files[0])} className="w-full text-sm text-[#444746] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-[#e9eef6] file:text-[#0b57d0] hover:file:bg-[#d3e3fd] transition-colors cursor-pointer" />
                   </div>

                   <div className="pt-4 flex items-center justify-end">
                       <button disabled={loading} type="submit" className={`rounded-full px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${isUpdateMode ? 'bg-[#b3261e] hover:bg-[#8c1d18]' : 'bg-[#0b57d0] hover:bg-[#0842a0]'}`}>
                           {loading ? 'Đang tải lên...' : (isUpdateMode ? 'Cập nhật' : 'Tải lên')}
                       </button>
                   </div>
               </form>
           </div>
            
           {/* Files List Area */}
           <div className="lg:col-span-8 bg-white rounded-[1rem] shadow-elevation-1 border border-[#dadce0] overflow-hidden flex flex-col h-fit">
               <div className="px-6 py-4 border-b border-[#e0e0e0] flex justify-between items-center bg-white">
                   <h2 className="text-xl font-normal text-[#1f1f1f]">Tất cả tệp</h2>
                   <div className="text-sm font-medium text-[#444746]">
                      {files.length} tệp
                   </div>
               </div>
               
               <div className="max-h-[700px] overflow-y-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                       <thead className="bg-white sticky top-0 border-b border-[#e0e0e0] z-10">
                           <tr>
                               <th className="px-6 py-3 text-sm font-medium text-[#444746]">Tên</th>
                               <th className="px-6 py-3 text-sm font-medium text-[#444746]">Vị trí</th>
                               <th className="px-6 py-3 text-sm font-medium text-[#444746] text-right">Hành động</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-[#e0e0e0]">
                           {files.slice((currentPage - 1) * 30, currentPage * 30).map(f => (
                               <tr key={f.path} className="hover:bg-[#e8eaed] transition-colors group">
                                   <td className="px-6 py-3">
                                       <div className="flex items-center gap-3 max-w-[300px]">
                                          <svg className="w-5 h-5 shrink-0 text-[#0b57d0]" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                                          <a href={`/view?path=${encodeURIComponent(f.path)}`} className="text-sm font-medium text-[#1f1f1f] truncate hover:underline" title={f.name}>
                                             {f.name}
                                          </a>
                                       </div>
                                   </td>
                                   <td className="px-6 py-3">
                                       <span className="text-sm text-[#444746]">
                                           {f.hospital === '_chung' ? 'Thư mục chung' : f.hospital}
                                       </span>
                                   </td>
                                   <td className="px-6 py-3 text-right">
                                       <div className="flex gap-4 justify-end">
                                          <button onClick={() => handlePrepareUpdate(f)} className="text-sm font-medium text-[#0b57d0] hover:text-[#0842a0]">
                                             Sửa
                                          </button>
                                          <button onClick={() => handleDelete(f.path)} className="text-sm font-medium text-[#b3261e] hover:text-[#8c1d18]">
                                             Xóa
                                          </button>
                                       </div>
                                   </td>
                               </tr>
                           ))}
                           {files.length === 0 && (
                               <tr><td colSpan="3" className="text-center py-16 text-[#444746]">
                                   Không có tệp nào.
                               </td></tr>
                           )}
                       </tbody>
                   </table>
               </div>
               
               {files.length > 30 && (
                   <div className="px-6 py-3 border-t border-[#e0e0e0] bg-white flex items-center justify-between">
                       <span className="text-sm text-[#444746]">
                           {((currentPage - 1) * 30) + 1}-{Math.min(currentPage * 30, files.length)} của {files.length}
                       </span>
                       <div className="flex gap-2">
                           <button 
                               onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                               disabled={currentPage === 1}
                               className="p-2 hover:bg-[#e8eaed] rounded-full disabled:opacity-50 text-[#444746]"
                           >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                           </button>
                           <button 
                               onClick={() => setCurrentPage(p => Math.min(Math.ceil(files.length / 30), p + 1))} 
                               disabled={currentPage >= Math.ceil(files.length / 30)}
                               className="p-2 hover:bg-[#e8eaed] rounded-full disabled:opacity-50 text-[#444746]"
                           >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                           </button>
                       </div>
                   </div>
               )}
           </div>
       </div>
    )
}
