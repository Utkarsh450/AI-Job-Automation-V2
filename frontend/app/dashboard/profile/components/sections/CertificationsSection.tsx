import React from 'react';
import { Award, Edit2 } from 'lucide-react';

interface Props {
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function CertificationsSection({ parsedData, setEditingSection }: Props) {
  return (
    <section id="certifications" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Certifications</h2>
          </div>
        </div>
        <button 
          onClick={() => setEditingSection({key: 'certifications', data: parsedData.certifications || [], title: 'Certifications'})}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      {parsedData.certifications && parsedData.certifications.length > 0 ? (
        <ul className="space-y-3">
          {parsedData.certifications.map((cert: string, idx: number) => (
            <li key={idx} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
              <span className="text-orange-500 mt-1">✓</span> {cert}
            </li>
          ))}
        </ul>
      ) : (
        <div className="border border-dashed border-slate-200 dark:border-[#444] rounded-xl p-6 text-center text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-[#222] cursor-pointer transition-colors" onClick={() => setEditingSection({key: 'certifications', data: [], title: 'Certifications'})}>
          Add credentials, badges, or licenses
        </div>
      )}
    </section>
  );
}

