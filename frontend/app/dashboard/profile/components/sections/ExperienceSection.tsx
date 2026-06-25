import React from 'react';
import { Briefcase, Edit2 } from 'lucide-react';

interface Props {
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function ExperienceSection({ parsedData, setEditingSection }: Props) {
  return (
    <section id="experience" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Experience</h2>
            <p className="text-xs text-slate-500">{parsedData.experience?.length || 0} role{(parsedData.experience?.length === 1) ? '' : 's'}</p>
          </div>
        </div>
        <button 
          onClick={() => setEditingSection({key: 'experience', data: parsedData.experience || [], title: 'Experience'})}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      <div className="space-y-6">
        {parsedData.experience && parsedData.experience.length > 0 ? (
          parsedData.experience.map((exp: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="w-10 h-10 rounded bg-slate-100 dark:bg-[#222] flex flex-col items-center justify-center shrink-0 border border-slate-200 dark:border-[#333] font-bold text-slate-400">
                {(exp.company || 'C').substring(0,2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{exp.role}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-0.5">{exp.company}</p>
                <p className="text-xs text-slate-400 font-medium">{exp.duration}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No experience data available.</p>
        )}
      </div>
    </section>
  );
}
