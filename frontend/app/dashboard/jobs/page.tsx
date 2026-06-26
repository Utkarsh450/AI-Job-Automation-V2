"use client";

import { useState, useEffect, Fragment } from 'react';
import useAuthStore from '../../../src/store/useAuthStore';
import { Search, MapPin, BuildingIcon, Briefcase, ExternalLink, X, Loader2, Plus, BookmarkIcon, FileTextIcon } from 'lucide-react';
import JobCard from '../../../components/JobCard';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '../../../src/hooks/useDebounce';
import { useIntersectionObserver } from '../../../src/hooks/useIntersectionObserver';

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

export default function BrowseJobsPage() {
  const { token } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  const fetchJobsPage = async ({ pageParam = null }) => {
    if (!token) return { jobs: [], nextCursor: null };
    
    let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/jobs?limit=15`;
    if (pageParam) url += `&cursor=${pageParam}`;
    if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['jobs', debouncedSearch],
    queryFn: fetchJobsPage,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    enabled: !!token
  });

  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
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
          
          {/* Static Add Link Card */}
          <div className="bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] border-dashed rounded-xl p-5 flex flex-col h-[280px] text-slate-900 dark:text-slate-200 hover:border-slate-300 dark:hover:border-[#555] transition-all cursor-pointer group shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="text-xs font-medium text-slate-500">Workday, Greenhouse<br/>etc.</div>
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2a2a2a] group-hover:bg-slate-200 dark:group-hover:bg-[#333] transition-colors flex items-center justify-center">
                <Plus className="w-5 h-5 text-slate-900 dark:text-white" />
              </div>
            </div>
            <div className="flex-1 flex items-center justify-start">
              <h2 className="text-3xl font-light text-slate-900 dark:text-white tracking-tight">Add Your<br/>Own Link</h2>
            </div>
            <div className="text-[11px] text-slate-500 mb-4 font-medium">Paste a URL and optional job description</div>
            <div className="bg-slate-50 dark:bg-[#2a2a2a] rounded-xl p-3 flex justify-between items-center border border-slate-200 dark:border-[#333]">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white">Quick Apply</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">Any supported job board</span>
              </div>
              <button className="bg-slate-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors shadow-sm">+ Add</button>
            </div>
          </div>

          {status === 'pending' ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : status === 'error' ? (
            <div className="col-span-full py-12 text-center text-red-400">
              Error fetching jobs.
            </div>
          ) : (
            <>
              {data.pages.map((page, pageIndex) => (
                <Fragment key={pageIndex}>
                  {page.jobs.map((job: any, index: number) => {
                    const globalIndex = pageIndex * 15 + index;
                    return (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        index={globalIndex} 
                        onClick={() => setSelectedJob(job)} 
                      />
                    );
                  })}
                </Fragment>
              ))}
            </>
          )}

          {/* Invisible target for intersection observer */}
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
        <div className="w-96 bg-white border-l border-slate-200 overflow-y-auto flex flex-col h-screen fixed right-0 top-0 shadow-2xl z-50 animate-in slide-in-from-right text-slate-900">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 p-6 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center font-bold text-2xl text-white">
                {selectedJob.company.charAt(0).toUpperCase()}
              </div>
              <div className="flex space-x-2">
                <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedJob(null)} className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{selectedJob.title}</h2>
            <div className="flex items-center text-sm text-slate-500 mb-6">
              <span>{selectedJob.company}</span>
              <span className="mx-2">•</span>
              <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" />{selectedJob.location || 'Remote'}</span>
            </div>
            
            <button 
              onClick={() => alert('Apply functionality is currently disabled.')}
              className="w-full py-3 bg-black text-white font-bold rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center shadow-sm"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Apply via Tsenta
            </button>
          </div>
          
          <div className="p-6 pt-2">
            <div className="space-y-8 mt-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Description</h3>
                {selectedJob.description ? (
                  <div 
                    className="text-sm prose prose-sm prose-slate max-w-none text-slate-700"
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

      {/* Backdrop for drawer */}
      {selectedJob && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setSelectedJob(null)}
        />
      )}

    </div>
  );
}
