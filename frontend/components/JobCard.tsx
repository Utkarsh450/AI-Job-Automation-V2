import { Briefcase, Sparkles, Loader2 } from 'lucide-react';

const bgColors = [
  'bg-[#e0f2fe] dark:bg-[#1e1e1e]', // light blue
  'bg-[#ffe4e6] dark:bg-[#1e1e1e]', // light pink
  'bg-[#ffedd5] dark:bg-[#1e1e1e]', // light orange
  'bg-[#f3e8ff] dark:bg-[#1e1e1e]', // light purple
  'bg-[#fef9c3] dark:bg-[#1e1e1e]'  // light yellow
];

export default function JobCard({ 
  job, 
  index, 
  onClick, 
  layout = 'grid', 
  isMatch = false, 
  fitScore = 0,
  onApply,
  onPass,
  isApplying = false,
  isPassing = false
}: { 
  job: any; 
  index: number; 
  onClick: () => void; 
  layout?: 'grid' | 'scroll';
  isMatch?: boolean;
  fitScore?: number;
  onApply?: () => void;
  onPass?: () => void;
  isApplying?: boolean;
  isPassing?: boolean;
}) {
  const containerClasses = [
    "bg-white dark:bg-[#1a1a1a] p-1.5 rounded-3xl border border-slate-200 dark:border-[#333] hover:border-slate-300 dark:hover:border-[#555] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-[280px]",
    layout === 'scroll' ? "min-w-[280px] w-[280px] snap-start flex-shrink-0" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={containerClasses} onClick={onClick}>
      {/* Top Colored Section */}
      <div className={`flex-1 rounded-2xl ${bgColors[index % bgColors.length]} p-5 flex flex-col relative overflow-hidden text-slate-900 dark:text-slate-200`}>
        
        {/* Top Tags Row */}
        <div className="flex flex-wrap gap-2 mb-3 pr-10">
          {isMatch ? (
            <>
              <span className="bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold flex items-center shadow-sm text-slate-900 dark:text-white">
                <Sparkles className="w-3 h-3 mr-1 text-yellow-600" /> Match
              </span>
              {fitScore > 0 && (
                <span className="bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold flex items-center shadow-sm text-green-700 dark:text-green-400">
                  {fitScore}%
                </span>
              )}
            </>
          ) : (
            <span className="bg-white/60 dark:bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold flex items-center shadow-sm text-slate-900 dark:text-white">
              <Briefcase className="w-3 h-3 mr-1" /> New
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold leading-tight mb-1 line-clamp-2 pr-8 text-slate-900 dark:text-white">
          {job.title}
        </h3>
        
        {/* Location */}
        <div className="text-sm font-semibold opacity-70 mb-4 text-slate-900 dark:text-slate-400">
          {job.location || 'Remote'}
        </div>

        {/* Bottom Info Pills */}
        <div className="mt-auto flex flex-wrap gap-2">
          <span className="bg-white/40 dark:bg-white/5 px-2 py-1 rounded border border-white/20 dark:border-white/10 text-[11px] font-bold flex items-center text-slate-900 dark:text-slate-300">
            {job.atsPlatform ? job.atsPlatform.charAt(0).toUpperCase() + job.atsPlatform.slice(1) : 'Direct'}
          </span>
          {!isMatch && (
            <span className="bg-white/40 dark:bg-white/5 px-2 py-1 rounded border border-white/20 dark:border-white/10 text-[11px] font-bold flex items-center text-slate-900 dark:text-slate-300">
              {job.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24))) : 0} days ago
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 px-4 flex justify-between items-center bg-white dark:bg-[#1a1a1a] rounded-b-2xl mt-1">
        <div className="flex items-center space-x-2.5">
          <img 
            src={`https://www.google.com/s2/favicons?domain=${job.company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.com&sz=128`} 
            alt={job.company}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random&color=fff&rounded=true&bold=true`;
            }}
            className="w-7 h-7 rounded-full bg-slate-100 object-contain border border-slate-200 dark:border-[#333] p-0.5 shrink-0"
          />
          <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[90px]">{job.company}</span>
        </div>
        <div className="flex space-x-1.5 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onPass?.(); }}
            disabled={isPassing || isApplying}
            className="px-4 py-1.5 border border-slate-200 dark:border-[#444] bg-slate-50 dark:bg-[#222] rounded-full text-[11px] font-bold text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-[#333] transition-colors flex items-center justify-center min-w-[60px]"
          >
            {isPassing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Pass'}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onApply?.(); }}
            disabled={isPassing || isApplying}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full text-[11px] font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm flex items-center justify-center min-w-[65px]"
          >
            {isApplying ? <Loader2 className="w-3 h-3 animate-spin text-white dark:text-black" /> : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
