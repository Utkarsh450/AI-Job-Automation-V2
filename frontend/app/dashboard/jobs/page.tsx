"use client";

import { useState, useEffect, Fragment } from 'react';
import useAuthStore from '../../../src/store/useAuthStore';
import { Search, MapPin, Briefcase, ExternalLink, X, Loader2, ThumbsDown, CheckCircle } from 'lucide-react';
import JobCard from '../../../components/JobCard';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useIntersectionObserver } from '../../../src/hooks/useIntersectionObserver';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const decodeHTML = (html: string) => {
  if (typeof window === 'undefined') return html;
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
 
  return txt.value;
};

export default function BrowseJobsPage() {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [passingJob, setPassing] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();

  const fetchJobsPage = async ({ pageParam = null }: { pageParam: any }) => {
    if (!token) return { jobs: [], nextCursor: null };
    let url = `${API}/api/jobs?limit=15`;
    if (pageParam) url += `&cursor=${pageParam}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ['jobs', debouncedSearch],
    queryFn: fetchJobsPage,
    initialPageParam: null,
    getNextPageParam: (lastPage: any) => lastPage.nextCursor || undefined,
    enabled: !!token
  });

  const handleApply = async (jobId: string) => {
    if (applyingTo === jobId) return;
    setApplyingTo(jobId);
    try {
      const res = await fetch(`${API}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ jobId })
      });
      if (res.ok) {
        setAppliedJobs(prev => new Set(prev).add(jobId));
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
    setPassing(jobId);
    try {
      const res = await fetch(`${API}/api/jobs/${jobId}/ignore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Pass failed:', res.status, err);
        alert(err.error || `Failed to pass job (${res.status})`);
        return;
      }
      // Only remove from local cache AFTER DB confirms save
      queryClient.setQueryData(['jobs', debouncedSearch], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            jobs: page.jobs.filter((j: any) => j.id !== jobId)
          }))
        };
      });
      setSelectedJob(null);
    } catch (err) {
      console.error('Failed to pass job:', err);
      alert('Network error — could not pass job.');
    } finally {
      setPassing(null);
    }
  };

  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.1, rootMargin: '100px' });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="flex h-full min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-200">
      
      <div className="flex-1 p-8 lg:pr-8 overflow-y-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Browse Jobs</h1>
          <p className="text-slate-500 dark:text-slate-400">Search and discover all available opportunities</p>
        </div>

        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-[#333] rounded-xl bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors shadow-sm"
            placeholder="Search by job title or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {status === 'pending' ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : status === 'error' ? (
            <div className="col-span-full py-12 text-center text-red-400">Error fetching jobs.</div>
          ) : (
            <>
              {data.pages.map((page: any, pageIndex: number) => (
                <Fragment key={pageIndex}>
                  {page.jobs.map((job: any, index: number) => {
                    const globalIndex = pageIndex * 15 + index;
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        index={globalIndex}
                        onClick={() => setSelectedJob(job)}
                        isMatch={false}
                        onApply={() => handleApply(job.id)}
                        onPass={() => handlePass(job.id)}
                        isApplying={applyingTo === job.id}
                        isPassing={passingJob === job.id}
                      />
                    );
                  })}
                </Fragment>
              ))}
            </>
          )}

          <div ref={targetRef} className="h-10 w-full col-span-full">
            {isFetchingNextPage && (
              <div className="flex justify-center pt-4">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Drawer for Job Details */}
      {selectedJob && (
        <div className="w-96 bg-white dark:bg-[#1e1e1e] border-l border-slate-200 dark:border-[#2a2a2a] overflow-y-auto flex flex-col h-screen fixed right-0 top-0 shadow-2xl z-50 text-slate-900 dark:text-slate-200">
          <div className="sticky top-0 bg-white/90 dark:bg-[#1e1e1e]/90 backdrop-blur-md z-10 border-b border-slate-100 dark:border-[#2a2a2a] p-6 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 dark:bg-slate-700 flex items-center justify-center font-bold text-2xl text-white">
                {selectedJob.company.charAt(0).toUpperCase()}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => window.open(selectedJob.url, '_blank')}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#444] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-400 transition-colors"
                  title="Open original listing"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full border border-slate-200 dark:border-[#444] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-[#2a2a2a] text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedJob.title}</h2>
            <div className="flex items-center text-sm text-slate-500 mb-5">
              <span>{selectedJob.company}</span>
              <span className="mx-2">•</span>
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" />{selectedJob.location || 'Remote'}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {/* Pass Button */}
              <button
                onClick={() => handlePass(selectedJob.id)}
                disabled={passingJob === selectedJob.id}
                className="flex-1 py-2.5 border border-slate-200 dark:border-[#444] text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {passingJob === selectedJob.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsDown className="w-4 h-4" />
                )}
                Pass
              </button>

              {/* Apply Button */}
              <button
                onClick={() => handleApply(selectedJob.id)}
                disabled={applyingTo === selectedJob.id || appliedJobs.has(selectedJob.id)}
                className="flex-2 flex-grow py-2.5 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-sm"
              >
                {applyingTo === selectedJob.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : appliedJobs.has(selectedJob.id) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Briefcase className="w-4 h-4" />
                )}
                {applyingTo === selectedJob.id
                  ? 'Starting...'
                  : appliedJobs.has(selectedJob.id)
                  ? 'Applied!'
                  : 'Apply via Tsenta'}
              </button>
            </div>
          </div>

          <div className="p-6 pt-2">
            <div className="space-y-8 mt-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Description</h3>
                {selectedJob.description ? (
                  <div
                    className="text-sm prose prose-sm prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: decodeHTML(selectedJob.description) }}
                  />
                ) : (
                  <p className="italic text-slate-400 text-sm">No description provided.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {selectedJob && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}

