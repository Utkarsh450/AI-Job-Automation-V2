import Link from "next/link";

export function CtaSection() {
  return (
    <section className="w-full py-24 px-6 text-center bg-[#0f0f11] border-t border-white/5">
      <h2 className="text-4xl md:text-5xl font-bold text-white font-roboto mb-6 tracking-tight">Ready to stop applying manually?</h2>
      <p className="text-slate-400 mb-10 max-w-xl mx-auto text-lg leading-relaxed">
        Join hundreds of engineers who let Tsenta handle the repetitive work while they prep for interviews.
      </p>
      <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-full font-bold text-base hover:bg-slate-200 transition-all font-mono">
        Start free trial
      </Link>
      <p className="text-sm text-slate-500 mt-6 font-mono">25 applications free • No credit card required</p>
    </section>
  );
}
