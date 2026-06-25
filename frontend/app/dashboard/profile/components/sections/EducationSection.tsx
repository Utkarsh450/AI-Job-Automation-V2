import React from 'react';
import { GraduationCap, Edit2 } from 'lucide-react';

interface Props {
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function EducationSection({ parsedData, setEditingSection }: Props) {
  return (
    <section id="education" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Education</h2>
            <p className="text-xs text-slate-500">{parsedData.education?.length || 0} entry</p>
          </div>
        </div>
        <button 
          onClick={() => setEditingSection({key: 'education', data: parsedData.education || [], title: 'Education'})}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      <div className="space-y-6">
        {parsedData.education && parsedData.education.length > 0 ? (
          parsedData.education.map((edu: any, idx: number) => (
            <div key={idx} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center shrink-0 font-bold text-lg">
                🎓
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{edu.institution}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-0.5">{edu.degree}</p>
                <div className="text-xs text-slate-400 font-medium flex gap-2">
                  <span>{edu.year}</span>
                  {edu.gpa && <span>• GPA: {edu.gpa}</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No education data available.</p>
        )}
      </div>
    </section>
  );
}
