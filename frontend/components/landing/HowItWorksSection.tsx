import { FileText, Briefcase, CheckCircle2 } from "lucide-react";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="w-full bg-[#0f0f11] py-32 px-6 border-t border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-5xl font-bold text-white font-roboto mb-6 tracking-tight">How Tsenta Works</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">Set it up once, and let our AI agents tirelessly hunt for your next role in the background.</p>
        </div>

        <div className="space-y-32">
          
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-xl shadow-lg">1</div>
              <h3 className="text-3xl font-bold text-white tracking-tight">Create your profile</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Upload your latest resume. Tsenta's language models instantly parse your skills, career history, and education. You just set your target roles, salary, and preferred locations.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-transparent blur-3xl rounded-full"></div>
              <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-medium text-sm">resume_2026.pdf</span>
                  </div>
                  <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full font-medium border border-emerald-400/20">Parsed</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-3/4 bg-white/10 rounded"></div>
                  <div className="h-2 w-full bg-white/5 rounded"></div>
                  <div className="h-2 w-5/6 bg-white/5 rounded"></div>
                  <div className="h-2 w-2/3 bg-white/5 rounded"></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['React', 'Node.js', 'TypeScript', 'System Design'].map((skill, i) => (
                    <span key={i} className="text-xs font-mono text-slate-300 bg-white/5 border border-white/10 px-2 py-1 rounded-md">{skill}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-xl shadow-lg">2</div>
              <h3 className="text-3xl font-bold text-white tracking-tight">AI Agent Matches Roles</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Our autonomous agents scan over 15+ ATS platforms (Greenhouse, Lever, Workday) every hour. When a job drops that matches your profile, Tsenta flags it immediately.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-transparent blur-3xl rounded-full"></div>
              <div className="relative space-y-4">
                {[
                  { title: "Senior Frontend Engineer", company: "Vercel", match: "98%" },
                  { title: "Full Stack Developer", company: "Stripe", match: "94%" },
                  { title: "React Engineer", company: "Netflix", match: "89%" },
                ].map((job, i) => (
                  <div key={i} className={`bg-[#141414] border border-white/10 rounded-xl p-5 flex items-center justify-between shadow-lg transform transition-transform hover:-translate-y-1 ${i === 1 ? 'ml-8' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium text-sm">{job.title}</h4>
                        <p className="text-slate-500 text-xs">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-emerald-400 font-bold text-sm">{job.match}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Match</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white font-mono font-bold text-xl shadow-lg">3</div>
              <h3 className="text-3xl font-bold text-white tracking-tight">Tailors & Auto-Applies</h3>
              <p className="text-slate-400 text-lg leading-relaxed">
                Before applying, Tsenta rewrites your resume slightly to highlight relevant keywords for the specific job, generates a bespoke cover letter, and fills out the ATS form—even answering custom questions.
              </p>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/20 to-transparent blur-3xl rounded-full"></div>
              <div className="relative bg-[#141414] border border-white/10 rounded-2xl p-6 font-mono text-sm shadow-2xl">
                <div className="flex gap-2 mb-4 border-b border-white/5 pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="space-y-3 text-slate-300">
                  <div className="flex gap-3">
                    <span className="text-emerald-400">➜</span>
                    <p>Tailoring resume for <span className="text-white">Vercel</span>...</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-400">➜</span>
                    <p>Generating personalized cover letter...</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-emerald-400">➜</span>
                    <p>Answering: <span className="text-slate-500">"Why Vercel?"</span></p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <p className="text-white font-bold">Application submitted successfully.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
