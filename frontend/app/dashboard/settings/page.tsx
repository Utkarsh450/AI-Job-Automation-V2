'use client';

import { useState } from 'react';
import useAuthStore from '../../../src/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings2, Lock, CreditCard, Users, Mail, UserCircle, FileText } from 'lucide-react';

export default function SettingsPage() {
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Apply settings');
  const queryClient = useQueryClient();

  const { data, isLoading: isQueryLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = await user?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const token = await user?.getIdToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  const resumeOpt = updateMutation.variables?.resumeOptimization ?? data?.user?.preferences?.resumeOptimization ?? 'Honest';
  const coverOpt = updateMutation.variables?.coverLetterOpt ?? data?.user?.preferences?.coverLetterOpt ?? 'Off';
  const autoApprove = updateMutation.variables?.autoApprove ?? data?.user?.preferences?.autoApprove ?? true;

  if (isLoading || !user || isQueryLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-[#1a1a1a]"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  const sidebarLinks = [
    { name: 'Apply settings', icon: Settings2 },
   
   
    { name: 'Workday password', icon: Lock },
    { name: 'Account settings', icon: UserCircle },
  ];

  return (
    <div className="flex min-h-screen bg-[#1a1a1a] text-slate-200">
      
      {/* Secondary Sidebar */}
      <div className="w-64 border-r border-[#2a2a2a] p-6 h-screen sticky top-0">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-6">Settings</h4>
        <nav className="space-y-1">
          {sidebarLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.name 
                  ? 'bg-[#2a2a2a] text-white font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#222]'
              }`}
            >
              <item.icon className={`w-4 h-4 ${activeTab === item.name ? 'text-white' : 'text-slate-500'}`} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 max-w-3xl">
        
        <div className="mb-8 border-b border-[#2a2a2a] pb-6">
          <h1 className="text-2xl font-bold text-white mb-1">Apply settings</h1>
          <p className="text-slate-400 text-sm">Configure how your applications are submitted</p>
        </div>

        {/* Resume Optimisation Section */}
        <div className="mb-10">
          <h2 className="text-base font-bold text-white flex items-center mb-4">
            <FileText className="w-4 h-4 mr-2 text-slate-400" /> Resume optimisation
          </h2>
          
          <div className="space-y-3">
            {[
              { id: 'Off', label: 'Off', desc: 'Use your original resume as-is' },
              { id: 'Honest', label: 'Honest', desc: 'Reorder and highlight relevant experience for each job' },
              { id: 'Aggressive', label: 'Aggressive', desc: 'Rewrite and tailor content to match the job description' }
            ].map(opt => (
              <div 
                key={opt.id}
                onClick={() => updateMutation.mutate({ resumeOptimization: opt.id })}
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start space-x-4
                  ${resumeOpt === opt.id ? 'bg-[#222] border-slate-500' : 'bg-[#1e1e1e] border-[#333] hover:border-[#444]'}`}
              >
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${resumeOpt === opt.id ? 'border-white' : 'border-slate-500'}`}>
                  {resumeOpt === opt.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${resumeOpt === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[#222] border border-[#333] rounded-xl flex items-center justify-between">
            <span className="text-sm font-bold text-white">Auto-approve (skip preview steps)</span>
            <button 
              onClick={() => updateMutation.mutate({ autoApprove: !autoApprove })}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${autoApprove ? 'bg-white' : 'bg-[#444]'}`}
            >
              <div className={`w-4 h-4 bg-black rounded-full shadow-md transform transition-transform absolute ${autoApprove ? 'translate-x-6' : 'translate-x-1'}`}></div>
            </button>
          </div>
        </div>

        {/* Cover Letter Optimisation Section */}
        <div>
          <h2 className="text-base font-bold text-white flex items-center mb-4">
            <FileText className="w-4 h-4 mr-2 text-slate-400" /> Cover letter optimisation
          </h2>
          
          <div className="space-y-3">
            {[
              { id: 'Off', label: 'Off', desc: "Don't generate a cover letter" },
              { id: 'Honest', label: 'Honest', desc: 'Generate a highly relevant cover letter based on facts' },
            ].map(opt => (
              <div 
                key={opt.id}
                onClick={() => updateMutation.mutate({ coverLetterOpt: opt.id })}
                className={`p-4 rounded-xl border cursor-pointer transition-colors flex items-start space-x-4
                  ${coverOpt === opt.id ? 'bg-[#222] border-slate-500' : 'bg-[#1e1e1e] border-[#333] hover:border-[#444]'}`}
              >
                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0
                  ${coverOpt === opt.id ? 'border-white' : 'border-slate-500'}`}>
                  {coverOpt === opt.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${coverOpt === opt.id ? 'text-white' : 'text-slate-300'}`}>{opt.label}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
