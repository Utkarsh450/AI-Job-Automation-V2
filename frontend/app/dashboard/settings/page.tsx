'use client';

import { useState } from 'react';
import useAuthStore from '../../../src/store/useAuthStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Settings2, Lock, CreditCard, Users, Mail, UserCircle, FileText, Eye, EyeOff, Copy } from 'lucide-react';
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('Apply settings');
  const [showPassword, setShowPassword] = useState(false);
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

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let generated = '';
    for (let i = 0; i < 20; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateMutation.mutate({ appPasswords: [{ domain: 'workday', password: generated }] });
  };

  const resumeOpt = updateMutation.variables?.resumeOptimization ?? data?.user?.preferences?.resumeOptimization ?? 'Optimized';
  const coverOpt = updateMutation.variables?.coverLetterOpt ?? data?.user?.preferences?.coverLetterOpt ?? 'Off';
  const autoApprove = updateMutation.variables?.autoApprove ?? data?.user?.preferences?.autoApprove ?? true;

  if (isLoading || !user || isQueryLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]"><Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-slate-500" /></div>;
  }

  const sidebarLinks = [
    { name: 'Apply settings', icon: Settings2 },
    { name: 'Workday password', icon: Lock },
    { name: 'Account settings', icon: UserCircle },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-200">
      
      {/* Secondary Sidebar */}
      <div className="w-64 bg-white dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-[#2a2a2a] p-6 h-screen sticky top-0 shadow-sm z-10 transition-colors duration-300">
        <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-6">Settings</h4>
        <nav className="space-y-1">
          {sidebarLinks.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`group w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                activeTab === item.name 
                  ? 'bg-blue-50 dark:bg-[#2a2a2a] text-blue-700 dark:text-white font-bold shadow-sm' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#222]'
              }`}
            >
              <item.icon className={`w-4 h-4 transition-transform duration-200 ${activeTab === item.name ? 'text-blue-600 dark:text-white scale-110' : 'text-slate-400 dark:text-slate-500 group-hover:scale-110'}`} />
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 max-w-3xl transition-all duration-300">
        
        {activeTab === 'Apply settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-slate-200 dark:border-[#2a2a2a] pb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Apply settings</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Configure how your applications are submitted</p>
            </div>

            {/* Resume Optimisation Section */}
            <div className="mb-10">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center mb-4">
                <FileText className="w-4 h-4 mr-2 text-slate-400" /> Resume optimisation
              </h2>
              
              <div className="space-y-3">
                {[
                  { id: 'Off', label: 'Off', desc: 'Use your original resume as-is' },
                  { id: 'Optimized', label: 'Optimized', desc: 'Rewrite bullets to match JD keywords' },
                  { id: 'Aggressive', label: 'Aggressive', desc: 'Full restructure — reorder, add/remove content' }
                ].map(opt => (
                  <div 
                    key={opt.id}
                    onClick={() => updateMutation.mutate({ resumeOptimization: opt.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-start space-x-4
                      ${resumeOpt === opt.id ? 'bg-blue-50/50 dark:bg-[#222] border-blue-500 dark:border-slate-500 shadow-sm' : 'bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-[#333] hover:border-blue-300 dark:hover:border-[#444]'}`}
                  >
                    <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300
                      ${resumeOpt === opt.id ? 'border-blue-600 dark:border-white' : 'border-slate-300 dark:border-slate-500'}`}>
                      {resumeOpt === opt.id && <div className="w-2 h-2 bg-blue-600 dark:bg-white rounded-full animate-in zoom-in duration-200"></div>}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold transition-colors duration-300 ${resumeOpt === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow duration-300">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Auto-approve (skip preview steps)</span>
                <button 
                  onClick={() => updateMutation.mutate({ autoApprove: !autoApprove })}
                  className={`w-11 h-6 rounded-full transition-colors duration-300 relative flex items-center shadow-inner ${autoApprove ? 'bg-emerald-500 dark:bg-white' : 'bg-slate-300 dark:bg-[#444]'}`}
                >
                  <div className={`w-4 h-4 bg-white dark:bg-black rounded-full shadow-md transform transition-transform duration-300 absolute ${autoApprove ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>
            </div>

            {/* Cover Letter Optimisation Section */}
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center mb-4">
                <FileText className="w-4 h-4 mr-2 text-slate-400" /> Cover letter optimisation
              </h2>
              
              <div className="space-y-3">
                {[
                  { id: 'Off', label: 'Off', desc: "No cover letter" },
                  { id: 'Optimized', label: 'Optimized', desc: 'Standard cover letter' },
                  { id: 'Aggressive', label: 'Aggressive', desc: 'Highly personalized cover letter' }
                ].map(opt => (
                  <div 
                    key={opt.id}
                    onClick={() => updateMutation.mutate({ coverLetterOpt: opt.id })}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex items-start space-x-4
                      ${coverOpt === opt.id ? 'bg-blue-50/50 dark:bg-[#222] border-blue-500 dark:border-slate-500 shadow-sm' : 'bg-white dark:bg-[#1e1e1e] border-slate-200 dark:border-[#333] hover:border-blue-300 dark:hover:border-[#444]'}`}
                  >
                    <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-300
                      ${coverOpt === opt.id ? 'border-blue-600 dark:border-white' : 'border-slate-300 dark:border-slate-500'}`}>
                      {coverOpt === opt.id && <div className="w-2 h-2 bg-blue-600 dark:bg-white rounded-full animate-in zoom-in duration-200"></div>}
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold transition-colors duration-300 ${coverOpt === opt.id ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Workday password' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-slate-200 dark:border-[#2a2a2a] pb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Workday password</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage the password used for automated applications</p>
            </div>
            
            <div className="bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
               <div className="p-6 border-b border-slate-100 dark:border-[#333] flex justify-between items-center bg-slate-50/50 dark:bg-[#2a2a2a]/30">
                 <div>
                   <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workday Bot Credential</h3>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Used by our AI to securely apply on your behalf.</p>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center">
                   <Lock className="w-3 h-3 mr-1" /> AES-256 Secured
                 </div>
               </div>

               <div className="p-6">
                 {data?.user?.appPasswords?.find((app: any) => app.domain === 'workday') ? (
                   <div className="flex flex-col space-y-4">
                     <label className="text-xs font-bold tracking-wider text-slate-400 uppercase">Application Password</label>
                     <div className="flex space-x-3 items-center">
                       <div className="relative flex-1">
                         <input 
                           type={showPassword ? "text" : "password"} 
                           readOnly
                           className="w-full font-mono text-sm bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 pr-10 outline-none text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                           value={data.user.appPasswords.find((app: any) => app.domain === 'workday').encryptedPassword}
                         />
                         <button 
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 dark:hover:text-slate-200 transition-all duration-200 hover:scale-110 active:scale-95"
                         >
                           {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                         </button>
                       </div>
                       <button
                         type="button"
                         onClick={(e) => {
                           navigator.clipboard.writeText(data.user.appPasswords.find((app: any) => app.domain === 'workday').encryptedPassword);
                           const btn = e.currentTarget;
                           const originalText = btn.innerHTML;
                           btn.innerHTML = '<span class="flex items-center"><svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Copied!</span>';
                           setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                         }}
                         className="px-4 py-3 bg-white dark:bg-[#2a2a2a] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#444] rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#333] transition-all hover:shadow-sm active:scale-95 flex items-center shrink-0"
                       >
                         <Copy className="w-4 h-4 mr-2 text-slate-400" /> Copy
                       </button>
                     </div>
                     <div className="flex justify-end mt-2">
                       <button
                         type="button"
                         onClick={handleGeneratePassword}
                         disabled={updateMutation.isPending}
                         className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                       >
                         {updateMutation.isPending ? 'Generating...' : 'Regenerate Password'}
                       </button>
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm text-slate-500 dark:text-slate-400">No Workday password set.</p>
                 )}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Account settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8 border-b border-slate-200 dark:border-[#2a2a2a] pb-6">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Account settings</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account and preferences</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow duration-300">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Theme</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Toggle dark mode</p>
                </div>
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#333] text-slate-700 dark:text-white text-sm font-medium rounded-lg border border-slate-200 dark:border-[#444] transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                >
                  {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                </button>
              </div>

              <div className="bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-xl p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow duration-300">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Log out</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sign out of your account on this device</p>
                </div>
                <button 
                  onClick={() => logout()}
                  className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-md hover:scale-105 active:scale-95"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
