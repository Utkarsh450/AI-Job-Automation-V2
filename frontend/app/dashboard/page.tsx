'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../src/store/useAuthStore';
import { Search, MapPin, Loader2, ArrowRight, Briefcase, Plus, Link as LinkIcon, ExternalLink, Calendar, Send, Clock, Inbox, ChevronRight, X, BuildingIcon, FileTextIcon, BookmarkIcon, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import JobCard from '../../components/JobCard';

const decodeHTML = (html: string) => {
  if (typeof window === 'undefined') return html;
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const bgColors = [
  'bg-[#e0f2fe] dark:bg-[#1e1e1e]', // light blue
  'bg-[#ffe4e6] dark:bg-[#1e1e1e]', // light pink
  'bg-[#ffedd5] dark:bg-[#1e1e1e]', // light orange
  'bg-[#f3e8ff] dark:bg-[#1e1e1e]', // light purple
  'bg-[#fef9c3] dark:bg-[#1e1e1e]'  // light yellow
];

export default function DashboardPage() {
  const { user, token, isLoading } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Fetch real jobs from the database for "Top matches"
  const { data: jobs = [], isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs', token],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      return data.jobs || [];
    },
    enabled: !!token,
  });

  // Fetch applications for "All applications" section
  const { data: rawApplications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications', token],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.applications || [];
    },
    enabled: !!token,
    refetchInterval: 5000,
  });



  const { data: jobMatches = [], isLoading: isLoadingMatches, refetch: refetchMatches } = useQuery({
    queryKey: ['jobMatches', token],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/job-matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      return data.matches || [];
    },
    enabled: !!token,
    refetchInterval: 5000,
  });

  const appsMap = new Map();
  jobMatches.forEach((match: any) => {
    appsMap.set(match.jobId, { ...match, status: 'QUEUED', isMatch: true });
  });
  rawApplications.forEach((app: any) => {
    const existing = appsMap.get(app.jobId) || {};
    appsMap.set(app.jobId, { ...existing, ...app });
  });
  const applications = Array.from(appsMap.values());

  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [passingJob, setPassingJob] = useState<string | null>(null);

  const handleApply = async (jobId: string) => {
    if (applyingTo === jobId) return;
    setApplyingTo(jobId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        queryClient.invalidateQueries({ queryKey: ['matches'] });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to apply');
      }
    } catch (err) {
      console.error('Failed to apply:', err);
    } finally {
      setApplyingTo(null);
    }
  };

  const handlePass = async (jobId: string) => {
    if (passingJob === jobId) return;
    setPassingJob(jobId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/job-matches/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        refetchMatches();
      }
    } catch (err) {
      console.error('Failed to pass job:', err);
    } finally {
      setPassingJob(null);
    }
  };

  const [retryingApp, setRetryingApp] = useState<string | null>(null);
  
  const handleRetry = async (applicationId: string) => {
    if (retryingApp === applicationId) return;
    setRetryingApp(applicationId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/applications/${applicationId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to retry');
      }
    } catch (err) {
      console.error('Failed to retry:', err);
    } finally {
      setRetryingApp(null);
    }
  };

  if (isLoading || !user) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  // Top matches are AI evaluated JobMatches sorted by fitScore > 60
  const topMatches = jobMatches.filter((m: any) => m.fitScore > 60).slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-200 overflow-x-hidden relative">
      
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 dark:border-[#2a2a2a] mt-10 flex items-center px-6 sticky top-0 bg-white/80 dark:bg-[#1a1a1a]/80 backdrop-blur-md z-30">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mr-8 hidden md:block">Dashboard</h1>
        
        <div className="flex-1 flex justify-end items-center space-x-4">
          {/* Header controls removed as requested */}
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
        
        {/* Banner */}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <FileTextIcon className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Submitted</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white leading-none mb-1">{applications.filter((a: any) => a.status === 'APPLIED').length}</div>
              <div className="text-xs text-green-600 dark:text-green-400 font-medium">recently applied</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">In flight</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white leading-none mb-1">{applications.filter((a: any) => a.status === 'QUEUED').length}</div>
              <div className="text-xs text-slate-500">awaiting response</div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
            <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Interviews</span>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white leading-none mb-1">0</div>
              <div className="text-xs text-slate-500">scheduled</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 dark:from-[#1e1e1e] dark:to-[#1a1a1a] dark:border dark:border-[#333] rounded-xl p-5 flex flex-col justify-between h-28 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2 text-blue-100 dark:text-slate-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">AI Matches</span>
              </div>
              <div className="text-3xl font-bold leading-none mb-1">{topMatches.length}</div>
              <div className="text-xs text-blue-100 dark:text-slate-500">new highly matched jobs</div>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 dark:bg-white/5 rounded-full blur-xl"></div>
          </div>
        </div>

        {/* Top Matches */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
              Top Matches <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs rounded-full">For you</span>
            </h2>
           
          </div>

          <div className="flex overflow-x-auto scrollbar-hidden pb-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {topMatches.length === 0 ? (
              <div className="w-full py-12 text-center border border-[#333] border-dashed rounded-xl text-slate-500">
                {isLoadingMatches ? <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> : "No matches found yet. Upload a resume to start sourcing jobs!"}
              </div>
            ) : (
              topMatches.map((app: any, index: number) => {
                const job = app.job;
                const fitScore = app.fitScore || 0;
                
                return (
                  <JobCard 
                    key={app.id} 
                    job={job} 
                    index={index} 
                    onClick={() => setSelectedJob(job)} 
                    layout="scroll" 
                    isMatch={true} 
                    fitScore={fitScore}
                    onApply={() => handleApply(job.id)}
                    onPass={() => handlePass(job.id)}
                    isApplying={applyingTo === job.id}
                    isPassing={passingJob === job.id}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* All Applications Section */}
        <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] rounded-xl p-1 overflow-hidden shadow-sm">
          <div className="flex flex-col border-b border-slate-200 dark:border-[#333] px-5 pt-5 pb-0 gap-4">
            
            {/* Top row: Title and Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-none">All applications</h2>
            </div>

            {/* Bottom row: Tabs */}
            <div className="flex items-center space-x-6 overflow-x-auto w-full scrollbar-hidden">
              <button onClick={() => setActiveTab('All')} className={`whitespace-nowrap pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'All' ? 'border-blue-600 text-blue-600 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                All <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs ${activeTab === 'All' ? 'bg-blue-100 text-blue-700 dark:bg-white/20 dark:text-white' : 'bg-slate-100 text-slate-500 dark:bg-[#333] dark:text-slate-400'}`}>{applications.length}</span>
              </button>
              <button onClick={() => setActiveTab('Submitted')} className={`whitespace-nowrap pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Submitted' ? 'border-blue-600 text-blue-600 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                Submitted
              </button>
              <button onClick={() => setActiveTab('In flight')} className={`whitespace-nowrap pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'In flight' ? 'border-blue-600 text-blue-600 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                In flight
              </button>
              <button onClick={() => setActiveTab('Needs you')} className={`whitespace-nowrap pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Needs you' ? 'border-blue-600 text-blue-600 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                Needs you
              </button>
              <button onClick={() => setActiveTab('Failed')} className={`whitespace-nowrap pb-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'Failed' ? 'border-blue-600 text-blue-600 dark:border-white dark:text-white' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-300'}`}>
                Failed
              </button>
            </div>
            
          </div>
          
          <div className="p-6 bg-slate-50 dark:bg-[#1a1a1a]">
            {(() => {
              const filtered = applications.filter((app: any) => {
                if (activeTab === 'All') return true;
                if (activeTab === 'In flight') return app.status === 'QUEUED';
                if (activeTab === 'Submitted') return app.status === 'APPLIED';
                if (activeTab === 'Needs you') return app.status === 'MANUAL_REVIEW';
                if (activeTab === 'Failed') return app.status === 'FAILED';
                return false;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <div className="w-10 h-10 mb-4 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-slate-500" />
                    </div>
                    <p className="text-sm font-medium">No applications match this filter. Start applying to jobs!</p>
                  </div>
                );
              }

              return (
                <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl overflow-hidden border border-slate-200 dark:border-[#333] shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-[10px] uppercase text-slate-500 font-bold tracking-wider border-b border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-transparent">
                      <tr>
                        <th className="px-6 py-4 font-bold">Position</th>
                        <th className="px-6 py-4 font-bold">Score</th>
                        <th className="px-6 py-4 font-bold">Resume</th>
                        <th className="px-6 py-4 font-bold">Cover Letter</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#333]">
                      {filtered.map((app: any) => {
                        const job = app.job;
                        
                        let statusPill = <span className="text-slate-400">Unknown</span>;
                        if (app.status === 'APPLIED') {
                          statusPill = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-[#1a2e1f]/50 text-green-700 dark:text-[#4ade80]"><span className="w-1.5 h-1.5 rounded-full bg-green-500 dark:bg-[#4ade80] mr-1.5"></span>Submitted</span>;
                        } else if (app.status === 'QUEUED') {
                          statusPill = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-[#422006]/50 text-yellow-700 dark:text-[#facc15]"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-[#facc15] mr-1.5"></span>Queued</span>;
                        } else if (app.status === 'FAILED') {
                          statusPill = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-[#450a0a]/50 text-red-700 dark:text-[#f87171]"><span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-[#f87171] mr-1.5"></span>Failed</span>;
                        } else if (app.status === 'MANUAL_REVIEW') {
                          statusPill = <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-[#172554]/50 text-blue-700 dark:text-[#60a5fa]"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-[#60a5fa] mr-1.5"></span>Needs you</span>;
                        }

                        // Fix: read from dbUser.preferences
                        const prefs = useAuthStore.getState().dbUser?.preferences || {};
                        let resumeStatus = 'Default';
                        if (prefs.resumeOptimization === 'Honest') resumeStatus = 'Honest Fit';
                        else if (prefs.resumeOptimization === 'Aggressive') resumeStatus = 'Aggressive Match';

                        let coverLetterStatus = 'Off';
                        if (prefs.coverLetterOpt === 'Honest') coverLetterStatus = 'Generated';
                        else if (prefs.coverLetterOpt === 'Aggressive') coverLetterStatus = 'Aggressive';
                        
                        return (
                          <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-[#222] transition-colors cursor-pointer" onClick={() => setSelectedJob(job)}>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <img 
                                  src={`https://www.google.com/s2/favicons?domain=${job.company.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}.com&sz=128`} 
                                  alt={job.company}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random&color=fff&rounded=true&bold=true`;
                                  }}
                                  className="w-8 h-8 rounded-full bg-slate-100 object-contain border border-slate-200 dark:border-[#333] shrink-0 mr-3 p-0.5"
                                />
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 dark:text-slate-200 text-sm">{job.title}</span>
                                  <span className="text-xs text-slate-500">{job.company}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-xs font-bold ${app.fitScore > 60 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                {app.fitScore ? `${app.fitScore}%` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-900 dark:text-slate-200 text-xs font-medium">{resumeStatus}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-slate-400 text-xs">{coverLetterStatus}</span>
                            </td>
                            <td className="px-6 py-4">
                              {statusPill}
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {app.status === 'MANUAL_REVIEW' ? (
                                  <>
                                    <button 
                                      onClick={(e) => e.stopPropagation()} 
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                      Apply
                                    </button>
                                    <button 
                                      onClick={(e) => e.stopPropagation()} 
                                      className="px-3 py-1.5 bg-slate-200 dark:bg-[#333] hover:bg-slate-300 dark:hover:bg-[#444] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors shadow-sm"
                                    >
                                      Ignore
                                    </button>
                                  </>
                                ) : app.isMatch ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApply(job.id);
                                    }}
                                    disabled={applyingTo === job.id}
                                    className="px-3 py-1.5 border border-slate-200 dark:border-[#444] bg-white dark:bg-[#1a1a1a] hover:bg-slate-50 dark:hover:bg-[#222] text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                  >
                                    {applyingTo === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply Now'}
                                  </button>
                                ) : app.status === 'QUEUED' || app.status === 'READY_TO_APPLY' || app.status === 'APPLYING' ? (
                                  <button disabled className="px-3 py-1.5 border border-transparent bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg flex items-center justify-center min-w-[80px] opacity-70">
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" /> Processing
                                  </button>
                                ) : app.status === 'FAILED' ? (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRetry(app.id);
                                    }}
                                    disabled={retryingApp === app.id}
                                    className="px-3 py-1.5 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                                  >
                                    {retryingApp === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Retry'}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
        
      </div>

      {/* Right Sidebar Drawer for Job Details */}
      <>
        {/* Backdrop */}
        {selectedJob && (
          <div 
            className="fixed inset-0 bg-black/40 z-40 transition-opacity backdrop-blur-sm"
            onClick={() => setSelectedJob(null)}
          />
        )}
        
        {/* Drawer */}
        <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-200 z-50 transform transition-transform duration-300 shadow-2xl flex flex-col ${selectedJob ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedJob && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-[#333]">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight mb-1">{selectedJob.title}</h2>
                  <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                    <span>{selectedJob.company}</span>
                    <CheckCircleIcon className="w-4 h-4 ml-1 text-slate-400" />
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="p-2 text-slate-400 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#333] rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Meta details grid */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {selectedJob.location || 'Remote'}</div>
                  <div className="flex items-center"><BuildingIcon className="w-4 h-4 mr-2" /> {selectedJob.company}</div>
                  <div className="flex items-center"><Briefcase className="w-4 h-4 mr-2" /> {selectedJob.atsPlatform ? selectedJob.atsPlatform.charAt(0).toUpperCase() + selectedJob.atsPlatform.slice(1) : 'Direct'}</div>
                  <div className="flex items-center"><Calendar className="w-4 h-4 mr-2" /> Scraped {new Date(selectedJob.createdAt || Date.now()).toLocaleDateString()}</div>
                </div>
                
                {/* Description */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Description</h3>
                  {selectedJob.description ? (
                    <div 
                      className="text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: decodeHTML(selectedJob.description) }}
                    />
                  ) : (
                    <p className="italic text-slate-400 text-sm">No description provided.</p>
                  )}
                </div>
              </div>
              
              {/* Bottom Sticky Bar */}
              <div className="p-5 border-t border-slate-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] flex items-center justify-between">
                <a href={selectedJob.url} target="_blank" rel="noreferrer" className="flex items-center text-sm font-bold text-slate-500 hover:text-black dark:hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4 mr-2" /> View original posting
                </a>
                {(() => {
                  const appStatus = applications.find((a: any) => a.jobId === selectedJob.id);
                  const isProcessing = appStatus && !appStatus.isMatch && ['QUEUED', 'READY_TO_APPLY', 'APPLYING'].includes(appStatus.status);
                  
                  if (isProcessing) {
                    return (
                      <button disabled className="px-8 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-full flex items-center justify-center min-w-[120px] opacity-70 cursor-not-allowed">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                      </button>
                    );
                  }

                  return (
                    <button 
                      onClick={() => handleApply(selectedJob.id)}
                      disabled={applyingTo === selectedJob.id}
                      className="px-8 py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-full hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                    >
                      {applyingTo === selectedJob.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                    </button>
                  );
                })()}
              </div>
            </>
          )}
        </div>
      </>

    </div>
  );
}

function CheckCircleIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

