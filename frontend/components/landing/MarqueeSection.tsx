export function MarqueeSection() {
  return (
    <section className="w-full py-10 bg-[#0f0f11] overflow-hidden flex flex-col items-center">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 font-roboto text-center">
        Our agents successfully apply to top companies
      </p>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}} />
      <div className="w-full max-w-5xl mx-auto overflow-hidden relative mask-image-edges">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#0f0f11] to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#0f0f11] to-transparent z-10"></div>
        <div className="flex w-[200%] animate-marquee">
          {/* Group 1 */}
          <div className="flex w-1/2 justify-around items-center px-4">
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Google</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">META</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Netflix</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Apple</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Stripe</span>
          </div>
          {/* Group 2 (Duplicate for smooth scroll) */}
          <div className="flex w-1/2 justify-around items-center px-4">
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Google</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">META</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Netflix</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Apple</span>
            <span className="text-xl md:text-3xl font-black text-slate-700 font-roboto">Stripe</span>
          </div>
        </div>
      </div>
    </section>
  );
}
