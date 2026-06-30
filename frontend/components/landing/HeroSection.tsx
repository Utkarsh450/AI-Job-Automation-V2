'use client';
import Link from "next/link";
import { Search, FileText, Clock, Calendar, Sparkles } from "lucide-react";
import JobCard from "../JobCard";

export function HeroSection() {
  return (
    <>
      <section className="w-full bg-[#0f0f11] text-white pt-24 pb-16 md:pt-32 md:pb-24 flex flex-col items-center relative overflow-hidden">
        {/* Subtle dark blurs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-900/20 via-blue-900/10 to-transparent rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/4"></div>

        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 flex flex-col lg:flex-row justify-between gap-12 lg:gap-24 mb-20 md:mb-32">
          {/* Left: Huge Text */}
          <div className="flex-1 lg:max-w-2xl">
            <h1 className="text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[1.05] text-white font-roboto">
              Apply
              without<br/>
              applying.
            </h1>
          </div>

          {/* Right: Description & CTA */}
          <div className="flex-1 flex flex-col justify-center lg:max-w-md pt-4 lg:pt-0">
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed mb-8 font-roboto">
              Tsenta watches 50,000+ career pages across Workday, Greenhouse, Lever, Ashby and 15+ more ATSes, and submits a tailored resume the moment a fitting role goes up. Hundreds of applications a week.
            </p>
            <div className="flex flex-col gap-3 font-mono">
              <div className="flex items-center gap-4">
                <Link href="/login" className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-slate-200 transition-all border border-transparent">
                  Get started
                </Link>
                <Link href="#how-it-works" className="px-6 py-3 bg-transparent border border-slate-600 text-white rounded-full font-bold text-sm hover:bg-white/5 transition-colors">
                  See how it works
                </Link>
              </div>
              <p className="text-sm text-slate-500">Free to start — no card required.</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 border-t border-white/10 pt-10 pb-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="flex flex-col border-r border-white/10 pr-4">
            <span className="text-3xl md:text-4xl font-bold font-roboto text-white tracking-tight mb-2">50,000+</span>
            <span className="text-xs md:text-sm text-slate-500 font-mono lowercase">career pages watched</span>
          </div>
          <div className="flex flex-col md:border-r border-white/10 pr-4">
            <span className="text-3xl md:text-4xl font-bold font-roboto text-white tracking-tight mb-2">15+</span>
            <span className="text-xs md:text-sm text-slate-500 font-mono lowercase">ATS platforms supported</span>
          </div>
          <div className="flex flex-col border-r border-white/10 pr-4">
            <span className="text-3xl md:text-4xl font-bold font-roboto text-white tracking-tight mb-2">100s</span>
            <span className="text-xs md:text-sm text-slate-500 font-mono lowercase">applications sent weekly</span>
          </div>
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-bold font-roboto text-white tracking-tight mb-2">Free</span>
            <span className="text-xs md:text-sm text-slate-500 font-mono lowercase">to start, no card required</span>
          </div>
        </div>

        {/* Dashboard Mockup - Dark Theme */}
        <div className="w-full px-6 lg:px-12 flex justify-center relative z-20">
          <div className="w-full max-w-[1200px] bg-[#1a1a1a] border border-white/10 rounded-2xl mt-28 shadow-2xl overflow-hidden transform transition-transform duration-700 hover:scale-[1.02] text-left flex h-[700px]">
            
            {/* Sidebar */}
            <div className="w-64 border-r border-white/5 flex flex-col bg-[#111111]">
              <div className="p-6 flex items-center gap-2">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                  <span className="text-black font-bold text-xs">T</span>
                </div>
                <span className="text-lg font-bold tracking-tight text-white">tsenta</span>
              </div>

              <div className="px-4 pb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Dashboard</p>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 bg-white/10 rounded-lg text-white font-medium text-sm">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    Dashboard
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <Search className="w-4 h-4" />
                    Browse jobs
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4" />
                      Applications
                    </div>
                    <span className="text-[10px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded">47</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      Inbox
                    </div>
                    <span className="text-[10px] font-bold bg-white/10 text-white px-1.5 py-0.5 rounded">3</span>
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                    Tracker
                  </div>
                </div>
              </div>

              <div className="px-4 py-4 mt-auto space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Profile
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg font-medium text-sm transition-colors">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                    Settings
                  </div>
                </div>
                
                <div className="p-3 border border-white/10 rounded-xl flex items-center gap-3 bg-white/5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Help & support</p>
                    <p className="text-[10px] text-slate-400">Send feedback</p>
                  </div>
                </div>

                <div className="p-3 bg-emerald-500/10 rounded-xl flex items-center gap-3 text-white border border-emerald-500/20">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">AM</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Alex Morgan</p>
                    <p className="text-[10px] text-emerald-400/80">500 credits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-[#1a1a1a] overflow-hidden">
              {/* Header */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#111111]">
                <h1 className="text-lg font-bold text-white">Dashboard</h1>
                <div className="flex-1 max-w-md mx-8 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="Search by title, company..." className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none placeholder:text-slate-500" disabled />
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10"></div>
                </div>
              </div>

              {/* Scrollable Area */}
              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#222] border border-white/5 rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
                    <div className="flex items-center space-x-2 text-slate-400 mb-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Submitted</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">12</div>
                      <div className="text-xs text-green-400 font-medium">recently applied</div>
                    </div>
                  </div>
                  <div className="bg-[#222] border border-white/5 rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
                    <div className="flex items-center space-x-2 text-slate-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">In flight</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">3</div>
                      <div className="text-xs text-slate-400">awaiting response</div>
                    </div>
                  </div>
                  <div className="bg-[#222] border border-white/5 rounded-xl p-5 flex flex-col justify-between h-28 shadow-sm">
                    <div className="flex items-center space-x-2 text-slate-400 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-semibold uppercase tracking-wider">Interviews</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">1</div>
                      <div className="text-xs text-slate-400">scheduled</div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-xl p-5 flex flex-col justify-between h-28 text-white shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center space-x-2 mb-2 text-blue-400">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">AI Matches</span>
                      </div>
                      <div className="text-3xl font-bold text-white leading-none mb-1">8</div>
                      <div className="text-xs text-blue-300">new highly matched jobs</div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
                  </div>
                </div>

                {/* Top Job Matches */}
                <div>
                  <div className="flex justify-between items-end mb-4">
                    <h2 className="text-sm font-bold text-white">Top Job matches</h2>
                    <span className="text-xs text-slate-400 font-medium hover:text-white cursor-pointer">Browse jobs ›</span>
                  </div>
                  <div className="flex gap-4">
                    
                    {/* Card 1 */}
                    <div className="flex-1 bg-[#2a261a] rounded-2xl p-4 flex flex-col justify-between border border-[#3d3725] relative h-36">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rocket Companies</p>
                        <h3 className="font-bold text-white text-sm mt-1 leading-tight">Software Developer II - RIGHT</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <span className="text-[8px] font-bold text-red-500">R</span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-300">Rocket Companies</span>
                        </div>
                        <button className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full">Apply</button>
                      </div>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white">71%</span>
                         <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-emerald-400" strokeDasharray="71, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                         </svg>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="flex-1 bg-[#1a2e26] rounded-2xl p-4 flex flex-col justify-between border border-[#234235] relative h-36">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stripe</p>
                        <h3 className="font-bold text-white text-sm mt-1 leading-tight">Software Engineer</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm text-indigo-600 font-bold text-[8px]">S</div>
                          <span className="text-[10px] font-bold text-slate-300">Stripe</span>
                        </div>
                        <button className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full">Apply</button>
                      </div>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white">60%</span>
                         <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-emerald-400" strokeDasharray="60, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                         </svg>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="flex-1 bg-[#231d33] rounded-2xl p-4 flex flex-col justify-between border border-[#332a4a] relative h-36">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vercel</p>
                        <h3 className="font-bold text-white text-sm mt-1 leading-tight">Backend Developer I</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm text-black font-bold text-[10px]">▲</div>
                          <span className="text-[10px] font-bold text-slate-300">Vercel</span>
                        </div>
                        <button className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-bold rounded-full">Apply</button>
                      </div>
                      <div className="absolute top-4 right-4 w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center">
                         <span className="text-[10px] font-bold text-white">44%</span>
                         <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <path className="text-emerald-400" strokeDasharray="44, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" />
                         </svg>
                      </div>
                    </div>

                  </div>
                </div>

                {/* All Applications */}
                <div className="bg-[#222] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white mb-3">All applications</h2>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full">All</span>
                        <span className="px-3 py-1 bg-transparent border border-white/10 text-slate-400 text-[10px] font-bold rounded-full">In flight</span>
                        <span className="px-3 py-1 bg-transparent border border-white/10 text-slate-400 text-[10px] font-bold rounded-full">Needs you</span>
                        <span className="px-3 py-1 bg-transparent border border-white/10 text-slate-400 text-[10px] font-bold rounded-full">Failed</span>
                        <span className="px-3 py-1 bg-transparent border border-white/10 text-slate-400 text-[10px] font-bold rounded-full">Skipped</span>
                      </div>
                    </div>
                    <div className="flex gap-2 self-start">
                       <button className="px-4 py-1.5 border border-white/10 rounded-full text-xs font-bold text-slate-300">Open Tracker</button>
                       <button className="px-4 py-1.5 bg-white text-black rounded-full text-xs font-bold">Submit all</button>
                    </div>
                  </div>
                  
                  {/* Table */}
                  <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a]">
                      <tr>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Position</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Resume</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cover Letter</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Applied</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">B</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Blue Origin</p>
                            <p className="text-[10px] text-slate-400">Software Development Engineer II</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">Ready</td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">Ready</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold text-emerald-400">● Submitted</span>
                        </td>
                        <td className="px-5 py-4 text-[10px] font-medium text-slate-500 text-right">2 days ago</td>
                      </tr>

                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">L</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Linktree</p>
                            <p className="text-[10px] text-slate-400">Software Engineer, Backend</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[10px] font-medium text-slate-400">Default</td>
                        <td className="px-5 py-4 text-[10px] font-medium text-slate-500">Off</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold text-emerald-400">● Submitted</span>
                        </td>
                        <td className="px-5 py-4 text-[10px] font-medium text-slate-500 text-right">2 days ago</td>
                      </tr>

                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="px-5 py-4 flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-blue-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">A</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Atlassian</p>
                            <p className="text-[10px] text-slate-400">Senior Frontend Engineer</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">Ready</td>
                        <td className="px-5 py-4 text-xs font-bold text-emerald-400">Ready</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] font-bold text-blue-400">● Tailoring résumé</span>
                        </td>
                        <td className="px-5 py-4 text-[10px] font-medium text-blue-500/70 italic text-right">● Reading job description...</td>
                      </tr>

                    </tbody>
                  </table>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      </section>
    </>
  );
}
