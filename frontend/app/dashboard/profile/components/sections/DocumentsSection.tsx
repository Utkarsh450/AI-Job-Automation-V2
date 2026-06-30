import React, { useRef, useState } from 'react';
import { FileText, Eye, Plus, Loader2, Download, Edit2 } from 'lucide-react';
import useAuthStore from '../../../../../src/store/useAuthStore';

interface Props {
  latestResume: any;
  uploadMutation: any;
}

export default function DocumentsSection({ latestResume, uploadMutation }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuthStore();
  const [isFetchingPdf, setIsFetchingPdf] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  const handlePdfAction = async (action: 'preview' | 'download') => {
    if (!latestResume?.id || !token) return;
    
    try {
      setIsFetchingPdf(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/${latestResume.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch PDF link');
      
      const data = await res.json();
      
      if (action === 'preview') {
        if (data.url.startsWith('data:')) {
          const win = window.open();
          if (win) {
            win.document.write('<iframe src="' + data.url + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
          }
        } else {
          window.open(data.url, '_blank');
        }
      } else {
        const link = document.createElement('a');
        link.href = data.url;
        link.target = '_blank';
        link.download = 'resume.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load resume PDF.');
    } finally {
      setIsFetchingPdf(false);
    }
  };

  return (
    <section id="documents" className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6 flex flex-col justify-between">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">Resume</h2>
            <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#222] text-slate-500 text-[10px] font-bold rounded uppercase">PDF</span>
          </div>
          <p className="text-xs text-slate-500">What we submit on every application.</p>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-[#222] hover:bg-slate-100 dark:hover:bg-[#333] border border-slate-200 dark:border-[#444] text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} 
            {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
          </button>
          <button 
            onClick={() => handlePdfAction('download')}
            disabled={!latestResume?.id || isFetchingPdf}
            className="flex justify-center items-center px-3 py-2 bg-slate-50 dark:bg-[#222] hover:bg-slate-100 dark:hover:bg-[#333] border border-slate-200 dark:border-[#444] text-slate-700 dark:text-slate-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetchingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6 flex flex-col justify-between">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">Cover letter</h2>
          </div>
          <p className="text-xs text-slate-500">Customize the letter we attach by default.</p>
        </div>
        <div className="flex">
          <button className="flex-1 flex justify-center items-center gap-1.5 px-3 py-2 bg-[#111827] dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-[#111827] rounded-lg text-xs font-medium transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview & edit
          </button>
        </div>
      </div>
    </section>
  );
}

