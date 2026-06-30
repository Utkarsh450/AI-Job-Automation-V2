import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full px-6 py-16 border-t border-white/5 bg-[#0f0f11]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180 text-white">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span className="text-xl font-bold tracking-tight font-roboto text-white">tsenta</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-medium">
              The AI agent that finds, tailors, and applies to jobs for you automatically.
            </p>
          </div>
          <div className="col-span-1">
            <h4 className="font-bold text-sm text-white mb-6 font-roboto uppercase tracking-wider">Product</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          <div className="col-span-1">
            <h4 className="font-bold text-sm text-white mb-6 font-roboto uppercase tracking-wider">Legal</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-medium">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium font-mono">
          <p>© 2026 Tsenta, Inc. All rights reserved.</p>
          <p className="mt-4 md:mt-0">founders@tsenta.com</p>
        </div>
      </div>
    </footer>
  );
}
