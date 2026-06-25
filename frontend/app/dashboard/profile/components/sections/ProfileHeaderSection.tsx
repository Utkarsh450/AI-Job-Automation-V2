import React from 'react';
import { MapPin, Mail, Phone, Link as LinkIcon, Plus, Edit2 } from 'lucide-react';

interface Props {
  profile: any;
  parsedData: any;
  setEditingSection: (section: any) => void;
}

export default function ProfileHeaderSection({ profile, parsedData, setEditingSection }: Props) {
  const calculateCompleteness = () => {
    const fields = [
      !!(profile?.email),
      !!(profile?.name || parsedData?.personal_info?.name),
      !!(profile?.phone || parsedData?.personal_info?.phone),
      !!(profile?.location || parsedData?.personal_info?.location),
      !!(profile?.linkedinUrl || parsedData?.personal_info?.linkedin || profile?.githubUrl || parsedData?.personal_info?.github),
      !!(parsedData?.professional_summary),
      !!(parsedData?.experience?.length > 0),
      !!(parsedData?.education?.length > 0),
      !!(parsedData?.skills?.length > 0),
      !!(parsedData?.projects?.length > 0),
      !!(parsedData?.certifications?.length > 0 && parsedData.certifications[0] !== "")
    ];
    
    const fulfilled = fields.filter(Boolean).length;
    return Math.round((fulfilled / fields.length) * 100);
  };

  return (
    <section id="profile" className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-slate-200 dark:border-[#333] shadow-sm p-8">
      <div className="flex justify-between items-start">
        <div className="flex gap-6">
          <div className="w-20 h-20 bg-slate-100 dark:bg-[#222] rounded-xl flex items-center justify-center text-3xl font-bold text-slate-400 dark:text-slate-500 overflow-hidden shrink-0">
            {(profile.name || profile.email || 'U').substring(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
              {profile.name || parsedData.personal_info?.name || 'User'}
              <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-[#444] rounded-full"></span>
            </h1>
            
            {parsedData.professional_summary ? (
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-3">
                {parsedData.professional_summary}
              </p>
            ) : (
              <button 
                onClick={() => setEditingSection({key: 'professional_summary', data: parsedData.professional_summary, title: 'Professional Summary'})}
                className="text-slate-400 dark:text-slate-500 text-sm italic mb-3 flex items-center gap-2 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3 h-3" /> Add a 1-2 line summary about yourself...
              </button>
            )}
            
            {profile.location && (
              <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3">
                <MapPin className="w-4 h-4 mr-1.5" />
                {profile.location}
              </div>
            )}

            <div className="flex items-center gap-2 mb-6">
              <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-[#222] text-slate-600 dark:text-slate-300 rounded-md">Default</span>
              <button className="px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-md transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> New profile
              </button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{profile.email}</div>
              {(profile.phone || parsedData.personal_info?.phone) && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" />{profile.phone || parsedData.personal_info?.phone}</div>}
              {(profile.linkedinUrl || parsedData.personal_info?.linkedin) && <a href={profile.linkedinUrl || parsedData.personal_info?.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"><LinkIcon className="w-4 h-4" />LinkedIn</a>}
              {(profile.githubUrl || parsedData.personal_info?.github) && <a href={profile.githubUrl || parsedData.personal_info?.github} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"><LinkIcon className="w-4 h-4" />GitHub</a>}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-[3px] border-emerald-500 text-slate-900 dark:text-white font-bold text-sm shrink-0">
            <div className="flex flex-col items-center leading-none">
              <span>{calculateCompleteness()}%</span>
              <span className="text-[8px] text-slate-400 font-medium uppercase mt-1">Complete</span>
            </div>
          </div>
          <button 
            onClick={() => setEditingSection({key: 'personal_info', data: parsedData.personal_info, title: 'Personal Info'})}
            className="flex items-center gap-1.5 px-4 py-1.5 border border-slate-200 dark:border-[#333] hover:bg-slate-50 dark:hover:bg-[#222] rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>
      </div>
    </section>
  );
}
