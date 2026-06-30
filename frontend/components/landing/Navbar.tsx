'use client';
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="w-full flex items-center justify-between px-6 lg:px-12 py-5 bg-[#0f0f11] text-white sticky top-0 z-50 border-b border-white/5 font-mono">
        <div className="flex items-center gap-2">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180 text-white">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          <span className="text-2xl font-bold tracking-tight">Tsenta</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#how-it-works" className="hover:text-white transition-colors">How it works</Link>
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
            Log in
          </Link>
          <Link href="/login" className="px-5 py-2.5 text-sm font-medium bg-white text-black rounded-full hover:bg-slate-200 transition-all shadow-sm active:scale-95">
            Sign up
          </Link>
        </div>

        <button 
          className="md:hidden p-2 text-slate-300 hover:text-white transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden fixed top-[77px] inset-x-0 bg-[#0f0f11] border-b border-white/10 p-6 flex flex-col gap-6 z-40 shadow-xl animate-in slide-in-from-top-2 font-mono text-white">
          <div className="flex flex-col gap-4 text-base font-medium text-slate-300">
            <Link href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">How it works</Link>
            <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">Features</Link>
            <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-white">FAQ</Link>
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/10">
            <Link href="/login" className="w-full py-3.5 text-center text-sm font-bold border border-white/20 rounded-xl hover:bg-white/5">
              Log in
            </Link>
            <Link href="/login" className="w-full py-3.5 text-center text-sm font-bold bg-white text-black rounded-xl hover:bg-slate-200">
              Sign up
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
