import React from 'react';
import { ClipboardList, Edit2, CheckCircle2 } from 'lucide-react';

interface Props {
  profile: any;
  setEditingSection: (section: any) => void;
}

export default function ApplicationDefaultsSection({ profile, setEditingSection }: Props) {
  const prefs = profile?.preferences || {};

  return (
    <section id="application-defaults" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-6">
      <div className="flex justify-between items-start mb-6 border-b border-slate-100 dark:border-[#222] pb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Application defaults</h2>
            <p className="text-xs text-slate-500">What we auto-fill on every ATS form.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors">
          <Edit2 className="w-3 h-3" /> Edit
        </button>
      </div>
      
      <div className="space-y-6">
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Work Authorization</h4>
          <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-[#222] pb-3">
            <span className="text-slate-500">Visa type</span>
            <span>{profile.visaStatus || 'US Citizen'}</span>
          </div>
          <div className="flex gap-3">
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${profile.requiresSponsorship === false ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400' : 'border-slate-200 text-slate-400 dark:border-[#333]'}`}>
              {profile.requiresSponsorship === false && <CheckCircle2 className="w-3.5 h-3.5" />} Authorized to work
            </span>
            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${profile.requiresSponsorship === true ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/10 dark:text-amber-400' : 'border-slate-200 text-slate-400 dark:border-[#333]'}`}>
              Needs sponsorship
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Work Preferences</h4>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'openToInPerson', label: 'In-person OK' },
              { key: 'willingToRelocate', label: 'Can relocate' },
              { key: 'canStartImmediately', label: 'Start immediately' },
              { key: 'reliableTransportation', label: 'Has transport' },
              { key: 'needAccommodations', label: 'Needs accommodations', inverseMatch: true }
            ].map((p, i) => {
              const isSet = p.inverseMatch ? prefs[p.key] === true : prefs[p.key] !== false;
              return (
                <span key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${isSet ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-emerald-400' : 'border-slate-200 text-slate-400 dark:border-[#333] opacity-60'}`}>
                  {isSet && <CheckCircle2 className="w-3 h-3" />} {p.label}
                </span>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Background</h4>
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 text-slate-400 dark:border-[#333] opacity-60`}>
              Prior employee
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${prefs.activeClearance ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 dark:border-[#333] opacity-60'}`}>
              Gov clearance
            </span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${prefs.foreignTies ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 dark:border-[#333] opacity-60'}`}>
              Gov ties
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

