import React from 'react';
import { Code2, Edit2 } from 'lucide-react';

interface Props {
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function SkillsSection({ parsedData, setEditingSection }: Props) {
  // Group skills helper
  const groupSkills = (skills: string[] = []) => {
    const categories: Record<string, string[]> = {
      'PROGRAMMING LANGUAGES': ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'php'],
      'FRAMEWORKS & LIBRARIES': ['react', 'next', 'tailwind', 'redux', 'node', 'express', 'django', 'spring', 'vue', 'angular', 'framer'],
      'DATABASES': ['postgres', 'mongo', 'redis', 'mysql', 'sqlite', 'dynamo', 'supabase', 'firebase', 'chroma', 'pinecone'],
      'TOOLS & SOFTWARE': ['git', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'vercel', 'nginx', 'linux', 'figma'],
      'AI & GENERATIVE AI': ['ai', 'llm', 'rag', 'langchain', 'openai', 'prompt', 'generative'],
      'WEB PERFORMANCE & OPTIMIZATION': ['ssr', 'ssg', 'performance', 'optimization', 'accessibility']
    };

    const grouped: Record<string, string[]> = {};
    const unmapped: string[] = [];

    skills.forEach(skill => {
      const lower = skill.toLowerCase();
      let matched = false;
      for (const [cat, keywords] of Object.entries(categories)) {
        if (keywords.some(k => lower.includes(k))) {
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(skill);
          matched = true;
          break;
        }
      }
      if (!matched) unmapped.push(skill);
    });

    if (unmapped.length > 0) grouped['OTHER SKILLS'] = unmapped;
    return grouped;
  };

  const groupedSkills = groupSkills(parsedData.skills || []);
  const totalSkills = parsedData.skills?.length || 0;
  const numCategories = Object.keys(groupedSkills).length;

  return (
    <section id="skills" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-8 border-b border-slate-100 dark:border-[#222] pb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Skills</h2>
            <p className="text-xs text-slate-500">{totalSkills} skills across {numCategories} categories</p>
          </div>
        </div>
        <button 
          onClick={() => setEditingSection({key: 'skills', data: parsedData.skills || [], title: 'Skills'})}
          className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
        >
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      <div className="space-y-6">
        {Object.entries(groupedSkills).map(([category, skills]) => (
          <div key={category} className="grid grid-cols-[160px_1fr] gap-4 items-start">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed pt-1.5">
              {category}
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg whitespace-nowrap">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
        {totalSkills === 0 && <p className="text-sm text-slate-500 italic">No skills extracted yet.</p>}
      </div>
    </section>
  );
}

