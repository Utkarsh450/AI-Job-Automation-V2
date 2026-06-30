'use client';
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export function FaqSection() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does Tsenta find jobs?",
      a: "Our engine scans millions of listings across major job boards and career pages, matching them against your specific profile, skills, and preferences."
    },
    {
      q: "How do I know if Tsenta applied correctly?",
      a: "We provide a detailed dashboard showing exactly which jobs were applied to, including timestamps and screenshots of the confirmation screens for full transparency."
    },
    {
      q: "Will recruiters know I used Tsenta?",
      a: "No. Our agent uses your actual resume and answers application questions just like you would. There is no 'Tsenta' watermark or signature on your applications."
    },
    {
      q: "How does résumé tailoring work?",
      a: "For every application, our AI analyzes the job description and subtly tweaks your resume's bullet points and summary to highlight the most relevant experience you already have."
    },
    {
      q: "I'm on OPT or need sponsorship — does Tsenta help?",
      a: "Yes! You can set strict preferences regarding your visa status. Tsenta will only apply to companies that sponsor visas or accept OPT/CPT candidates, and will answer the sponsorship questions correctly."
    },
    {
      q: "Is there a free plan?",
      a: "You start with 25 free applications. After that, you can upgrade to a premium plan for unlimited applications and priority processing."
    }
  ];

  return (
    <section id="faq" className="w-full bg-[#0f0f11] py-24 md:py-32 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row gap-16 lg:gap-24">
        
        {/* Left Column */}
        <div className="md:w-1/3 flex flex-col items-start">
          <span className="text-sm font-semibold text-slate-500 mb-2">Frequently asked.</span>
          <h2 className="text-4xl lg:text-5xl font-medium tracking-tight text-white font-roboto mb-6 leading-[1.1]">
            What people ask before signing up.
          </h2>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
            Have something else on your mind? Write to <a href="mailto:founders@tsenta.com" className="text-white underline underline-offset-4 font-medium hover:text-slate-300">founders@tsenta.com</a> — a real founder will reply.
          </p>
        </div>

        {/* Right Column */}
        <div className="md:w-2/3">
          <div className="border-t border-white/10">
            {faqs.map((faq, i) => {
              const isActive = activeFaq === i;
              return (
                <div 
                  key={i} 
                  className={`transition-all duration-200 ${isActive ? 'border border-white/10 rounded-lg my-2 shadow-sm bg-[#1a1a1a]' : 'border-b border-white/10'}`}
                >
                  <button 
                    className={`w-full text-left font-medium text-white font-roboto flex items-center justify-between transition-colors ${isActive ? 'px-6 py-5 rounded-t-lg' : 'py-5 hover:bg-white/5 px-2'}`}
                    onClick={() => setActiveFaq(isActive ? null : i)}
                  >
                    <span className="pr-8">{faq.q}</span>
                    <div className="w-5 h-5 rounded-full border border-white/20 flex items-center justify-center shrink-0 bg-transparent">
                      {isActive ? <Minus className="w-3 h-3 text-slate-400" /> : <Plus className="w-3 h-3 text-slate-400" />}
                    </div>
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? 'max-h-48 pb-5 px-6 rounded-b-lg' : 'max-h-0 py-0 px-2'}`}>
                    <p className="text-slate-400 leading-relaxed text-sm">{faq.a}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
