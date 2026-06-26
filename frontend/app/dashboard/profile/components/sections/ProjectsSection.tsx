import React from 'react';
import { Rocket, Edit2 } from 'lucide-react';

interface Props {
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function ProjectsSection({ parsedData, setEditingSection }: Props) {
  return (
    <section id="projects" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-[#222] pb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Projects</h2>
            <p className="text-xs text-slate-500">{parsedData.projects?.length || 0} projects</p>
          </div>
        </div>
        <button 
          onClick={() => setEditingSection({key: 'projects', data: parsedData.projects || [], title: 'Projects'})}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      <div className="space-y-8">
        {parsedData.projects && parsedData.projects.length > 0 ? (
          parsedData.projects.map((proj: any, idx: number) => (
            <div key={idx}>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3">{proj.name}</h3>
              
              {proj.technologies && proj.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {proj.technologies.map((tech: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/10 rounded uppercase tracking-wider">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              
              {proj.link && (
                <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mb-2 inline-block">
                  {proj.link}
                </a>
              )}

              {proj.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed mb-2">
                  {proj.description}
                </p>
              )}
              
              {proj.highlights && Array.isArray(proj.highlights) && proj.highlights.length > 0 && (
                <ul className="space-y-1.5 list-none mt-2">
                  {proj.highlights.map((highlight: string, i: number) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start">
                      <span className="mr-2 text-slate-300 dark:text-slate-600 mt-0.5">•</span>
                      <span className="leading-relaxed">{highlight}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">No projects extracted.</p>
        )}
      </div>
    </section>
  );
}
