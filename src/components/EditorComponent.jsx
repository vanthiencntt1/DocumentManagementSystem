"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import mammoth from 'mammoth';

// Dynamic import ReactQuill to prevent SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false, loading: () => <div className="h-[800px] w-full bg-slate-50 animate-pulse flex items-center justify-center font-bold text-slate-400">Đang tải bộ soạn thảo...</div> });
import 'react-quill/dist/quill.snow.css';

export default function EditorComponent({ streamUrl, filePath, fileName, canEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [editHtml, setEditHtml] = useState('');
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();

  // Tải nội dung DOCX qua mammoth khi component mount
  useEffect(() => {
    const loadDocx = async () => {
       try {
           const res = await fetch(streamUrl);
           const blob = await res.blob();
           const arrayBuffer = await blob.arrayBuffer();
           
           const result = await mammoth.convertToHtml({ arrayBuffer });
           setHtmlContent(result.value);
           setEditHtml(result.value);
       } catch (error) {
           console.error("Mammoth convert error", error);
       }
    };
    loadDocx();
  }, [streamUrl]);

  // Load Lịch sử phiên bản
  useEffect(() => {
     const fetchHistory = async () => {
         try {
             const res = await fetch(`/api/history?path=${encodeURIComponent(filePath)}`);
             if (res.ok) {
                 const data = await res.json();
                 setHistory(data.history || []);
             }
         } catch(e) {}
     };
     fetchHistory();
  }, [filePath]);

  const handleSave = async () => {
    setLoading(true);
    try {
       const formData = new FormData();
       formData.append('path', filePath);
       formData.append('html', editHtml); // Gửi HTML lên server

       const res = await fetch('/api/save', {
           method: 'POST',
           body: formData
       });
       
       if (res.ok) {
           alert('Lưu tài liệu thành công! (Hệ thống đã tự động sao lưu bản cũ vào lịch sử)');
           setIsEditing(false);
           setHtmlContent(editHtml);
           router.refresh(); // Sẽ reload lại dữ liệu lịch sử
       } else {
           alert('Lỗi: ' + await res.text());
       }
    } catch(e) {
       console.error(e);
       alert('Lỗi khởi tạo lưu file: ' + e.message);
    }
    setLoading(false);
  };

  const fileInputRef = useRef(null);
  
  const handleFileUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      setLoading(true);
      try {
          const formData = new FormData();
          formData.append('path', filePath);
          formData.append('file', file);
          
          const res = await fetch('/api/save', {
              method: 'POST',
              body: formData
          });
          
          if (res.ok) {
              alert('Cập nhật file thành công! Bản cũ đã được đưa vào lịch sử.');
              window.location.reload();
          } else {
              alert('Lỗi: ' + await res.text());
          }
      } catch (e) {
          alert('Lỗi upload: ' + e.message);
      }
      setLoading(false);
  };

  const handleRestore = async (historyPath) => {
     if (!confirm('Bạn có chắc muốn khôi phục phiên bản này? Phiên bản hiện tại sẽ được tự động sao lưu.')) return;
     try {
         const res = await fetch('/api/restore', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ historyPath, originalPath: filePath })
         });
         if (res.ok) {
             alert('Khôi phục thành công!');
             window.location.reload();
         } else {
             alert('Lỗi: ' + await res.text());
         }
     } catch (e) {
         alert('Lỗi khôi phục: ' + e.message);
     }
  };

  const handleExportPdf = () => {
      const element = document.getElementById('document-content-container');
      if (!element) return;
      
      setLoading(true);
      
      if (window.html2pdf) {
          generatePdf(element);
          return;
      }

      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => generatePdf(element);
      script.onerror = () => {
          alert("Lỗi tải thư viện PDF");
          setLoading(false);
      };
      document.body.appendChild(script);
  };

  const generatePdf = (element) => {
      const opt = {
          margin:       [15, 15, 15, 15],
          filename:     fileName.replace(/\.[^/.]+$/, "") + '.pdf', // Remove extension and add .pdf
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      window.html2pdf().set(opt).from(element).save().then(() => {
          setLoading(false);
      }).catch((e) => {
          console.error(e);
          alert("Lỗi xuất PDF: " + e.message);
          setLoading(false);
      });
  };

  const modules = {
      toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered'}, { 'list': 'bullet' }],
          [{ 'align': [] }],
          ['clean']
      ]
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full relative">
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".docx,.xlsx,.pdf" />
      {/* Editor / Viewer Area */}
      <div className={`flex-1 flex flex-col bg-white border border-slate-200 shadow-sm lg:rounded-xl overflow-hidden ${showHistory ? 'lg:mr-4 mb-4 lg:mb-0' : ''} transition-all`}>
        <div className="border-b border-slate-200 px-4 md:px-6 py-4 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10 sticky top-0 relative">
          <div className="flex items-center gap-3">
             <div className={`w-3 h-3 rounded-full shadow-sm ${isEditing ? 'bg-orange-500 animate-pulse' : 'bg-emerald-500'}`} />
             <span className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest">
               {isEditing ? 'Chế độ soạn thảo' : 'Xem trước (Preview)'}
             </span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
            <button
               onClick={() => setShowHistory(!showHistory)}
               className="flex-1 sm:flex-none justify-center text-slate-600 bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 transition shadow-sm flex items-center gap-2"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Lịch sử ({history.length})
            </button>

            {fileName.toLowerCase().endsWith('.docx') && !isEditing && (
                <button
                   onClick={handleExportPdf}
                   disabled={loading}
                   className="flex-1 sm:flex-none justify-center bg-red-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-red-700 transition shadow-md flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                   title="Xuất file ra định dạng PDF"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                   Xuất PDF
                </button>
            )}

            {canEdit && !isEditing && (
              <>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={loading}
                  className="flex-1 sm:flex-none justify-center bg-white text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-50 transition shadow-sm flex items-center gap-2 whitespace-nowrap"
                  title="Tải lên một file .docx từ máy tính để đè lên file hiện tại"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {loading ? 'Đang tải...' : 'Upload Mới'}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 sm:flex-none justify-center bg-blue-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 transition shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Sửa Nhanh
                </button>
              </>
            )}
            {isEditing && (
              <>
                <button
                  disabled={loading}
                  onClick={() => { setIsEditing(false); setEditHtml(htmlContent); }}
                  className="flex-1 sm:flex-none justify-center text-slate-600 bg-white border border-slate-300 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  disabled={loading}
                  onClick={handleSave}
                  className="flex-1 sm:flex-none justify-center bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 transition shadow-md disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  {loading ? 'Đang lưu...' : 'Lưu Version'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 w-full bg-slate-100/50 overflow-y-auto" style={{height: '800px'}}>
           <div className="max-w-[900px] mx-auto bg-white min-h-[1056px] my-4 md:my-8 shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-200">
               {isEditing ? (
                  <div className="h-full">
                      <ReactQuill 
                         theme="snow" 
                         value={editHtml} 
                         onChange={setEditHtml} 
                         modules={modules}
                         className="h-full border-none [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[1000px] [&_.ql-editor]:text-[14px] md:[&_.ql-editor]:text-[16px] [&_.ql-editor]:font-['Inter'] [&_.ql-editor]:p-4 md:[&_.ql-editor]:p-12"
                      />
                  </div>
               ) : (
                  <div 
                      id="document-content-container"
                      className="p-4 md:p-12 text-[14px] md:text-[16px] font-['Inter'] leading-relaxed text-slate-800 prose max-w-none [&_table]:border-collapse [&_table]:w-full [&_table]:overflow-x-auto [&_td]:border [&_td]:border-slate-300 [&_td]:p-2 [&_img]:max-w-full"
                      dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
               )}
           </div>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
         <div className="w-full lg:w-[350px] shrink-0 bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col transition-all">
             <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-700 uppercase tracking-widest text-sm flex justify-between items-center">
                 <span>Phiên bản cũ</span>
                 <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 p-1">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
             </div>
             <div className="flex-1 overflow-y-auto p-2 lg:max-h-[800px] max-h-[300px]">
                 {history.length === 0 ? (
                     <div className="text-center p-8 text-slate-400 text-sm">Chưa có phiên bản nào.</div>
                 ) : (
                     history.map((ver, idx) => (
                         <div key={ver.path} className="p-4 mb-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors group">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="font-bold text-slate-700 text-sm truncate">{ver.name}</div>
                                   <div className="text-xs text-slate-500">{new Date(ver.date).toLocaleString('vi-VN')}</div>
                                </div>
                             </div>
                             {canEdit && (
                                <button onClick={() => handleRestore(ver.path)} className="w-full mt-2 py-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 rounded-lg transition-colors">
                                   Khôi phục bản này
                                </button>
                             )}
                         </div>
                     ))
                 )}
             </div>
         </div>
      )}
    </div>
  );
}
