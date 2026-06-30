import { Check, User, Building2 } from "lucide-react";
import Link from "next/link";

export function PricingSection() {
  const plans = [
    {
      name: "Free",
      desc: "Best for trying out Tsenta",
      price: "$0",
      period: "/ month",
      btnText: "Get Free >",
      features: [
        "Limited access to standard AI matching",
        "Limited automated applications (25/mo)",
        "Limited and slower resume extraction",
        "Limited custom cover letters",
        "Limited dashboard history",
        "Limited email support"
      ],
      footerText: "Have an existing plan? See billing help"
    },
    {
      name: "Starter",
      desc: "Best for casual job seekers",
      price: "$15",
      period: "/ month",
      btnText: "Get Starter ↗",
      highlight: "Everything in Free and:",
      features: [
        "More access to AI matching algorithms",
        "More automated applications (100/mo)",
        "More precise resume extraction",
        "More cover letter generations",
        "Longer dashboard history"
      ],
      footerText: "Cancel anytime. Learn more"
    },
    {
      name: "Plus",
      desc: "Best for active job search",
      price: "$29",
      period: "/ month",
      btnText: "Get Plus >",
      highlight: "Everything in Starter and:",
      features: [
        "Advanced reasoning with GPT-4 matching",
        "More complex and accurate resume tailoring",
        "Expanded auto-apply and agent mode",
        "Expanded dashboard memory and tracking",
        "Projects, folders, and custom job preferences",
        "Expanded ATS question auto-fill",
        "Early access to new features"
      ],
      footerText: "Limits apply"
    },
    {
      name: "Pro",
      desc: "Best for maximum volume",
      prefix: "From",
      price: "$99",
      period: "/ month",
      btnText: "Get Pro >",
      highlight: "Everything in Plus and:",
      features: [
        "5x or 20x more application usage",
        "Pro reasoning with dedicated AI Agents",
        "Maximum concurrent application tasks",
        "Unlimited custom job preferences",
        "Unlimited and faster resume tailoring",
        "Maximum deep research and matching mode",
        "Maximum dashboard memory and context",
        "Expanded projects, analytics, and exports",
        "Research preview of new features"
      ],
      footerText: "Unlimited subject to abuse guardrails. Learn more"
    }
  ];

  return (
    <section id="pricing" className="w-full bg-[#0f0f11] py-24 px-6 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header matching the screenshot */}
        <div className="text-center mb-12">
          <p className="text-[13px] text-slate-300 font-medium mb-4">Tsenta</p>
          <h2 className="text-4xl md:text-[44px] font-semibold text-white mb-6">Pricing</h2>
          <p className="text-slate-300 text-[15px]">See pricing for our individual, business, and enterprise plans.</p>
        </div>

        {/* Toggle Switch */}
        <div className="flex justify-center mb-14">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-full p-1 flex items-center">
            <button className="px-8 py-2 bg-[#2a2a2a] text-white rounded-full text-[13px] font-medium flex items-center gap-2 shadow-sm">
              <User className="w-[14px] h-[14px]" /> Individual
            </button>
            <button className="px-8 py-2 text-slate-400 hover:text-white rounded-full text-[13px] font-medium flex items-center gap-2 transition-colors">
              <Building2 className="w-[14px] h-[14px]" /> Business & Enterprise
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid - increased height */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {plans.map((plan, i) => (
            <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-5 flex flex-col min-h-[520px] hover:bg-[#1c1c1c] transition-colors relative">
              <div className="mb-8">
                <h3 className="text-[26px] font-semibold text-white mb-2 leading-none">{plan.name}</h3>
                <p className="text-slate-300 text-[13px] font-medium leading-relaxed max-w-[200px]">{plan.desc}</p>
              </div>

              <div className="mb-6 flex flex-col justify-end h-[70px]">
                {plan.prefix && <span className="text-slate-400 text-[13px] mb-1">{plan.prefix}</span>}
                <div className="flex items-baseline">
                  <span className="text-[44px] font-bold text-white leading-none tracking-tight">{plan.price}</span>
                  <span className="text-slate-400 ml-1.5 text-[13px]">{plan.period}</span>
                </div>
              </div>

              <Link href="/login" className="w-full py-2.5 rounded-full bg-white text-black text-[13px] font-semibold text-center hover:bg-slate-200 transition-colors mb-8">
                {plan.btnText}
              </Link>

              <div className="space-y-4 flex-1">
                {plan.highlight && (
                  <div className="flex items-start gap-2.5 mb-2">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0 mt-0.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    <span className="text-white font-medium text-[13px]">{plan.highlight}</span>
                  </div>
                )}
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <Check className="w-[14px] h-[14px] text-white shrink-0 mt-0.5" strokeWidth={3} />
                    <span className="text-slate-300 text-[13px] leading-relaxed pr-2">{feature}</span>
                  </div>
                ))}
              </div>
              
              {/* Footer text below the features list just like the screenshot */}
              {plan.footerText && (
                <div className="mt-8 pt-4">
                  <p className="text-[11px] text-slate-400 underline underline-offset-2 decoration-slate-600 hover:decoration-slate-400 cursor-pointer">{plan.footerText}</p>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
