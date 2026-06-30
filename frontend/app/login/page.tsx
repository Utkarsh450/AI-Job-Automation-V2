'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../src/store/useAuthStore';
import { Loader2, Check } from 'lucide-react';

// Using standard HTML elements temporarily while Shadcn finishes installing
export default function LoginPage() {
  const { loginWithGoogle, loginWithEmail, dbUser } = useAuthStore();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (dbUser) {
      if (dbUser.isOnboarded) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }
  }, [dbUser, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      await loginWithGoogle();
      // Routing is handled by the useEffect watching dbUser
    } catch (error: any) {
      setErrorMsg(error.message || 'Google login failed');
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please enter both email and password");
      return;
    }
    setIsEmailLoading(true);
    setErrorMsg('');
    try {
      await loginWithEmail(email, password);
      // Routing is handled by the useEffect watching dbUser
    } catch (error: any) {
      setErrorMsg(error.message || 'Authentication failed. Please check your credentials.');
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0f0f11] font-sans text-white">
      {/* Left Side - Marketing & Features */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 lg:p-20 relative overflow-hidden bg-[#141414] border-r border-white/10">
        {/* Removed mesh gradient background for a cleaner look */}

        <div className="relative z-10 w-full max-w-xl mx-auto">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-24">
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="rotate-180">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span className="text-xl font-bold tracking-tight">Tsenta</span>
            </div>
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <p className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Intelligent Job Applications
            </p>
            <h1 className="text-5xl lg:text-6xl font-medium tracking-tight leading-[1.05] text-white">
              Your autonomous<br/>job search agent.
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-md mt-4">
              We automate the entire job search process so you can focus on preparing for interviews.
            </p>

            {/* Checklist */}
            <div className="space-y-4 mt-8 pt-8 border-t border-white/10">
              {[
                "Find jobs that match your exact profile",
                "Automatically optimize your resume for each application",
                "Apply on your behalf and track everything in one place"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-slate-300 leading-relaxed font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#0f0f11] relative">
        <div className="w-full max-w-[400px] space-y-8">
          
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-medium tracking-tight text-white">Welcome to Tsenta</h2>
            <p className="text-slate-400 font-medium">Start with 25 free applications. No card required.</p>
          </div>

          <div className="space-y-4">
            <button 
              className="w-full flex items-center justify-center gap-3 h-12 rounded-full bg-[#111] border border-white/10 hover:bg-white/5 hover:border-white/20 text-white text-base font-medium shadow-sm relative transition-all active:scale-[0.98] disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-white absolute left-6" />
              ) : (
                <svg className="w-5 h-5 absolute left-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l2.85-2.22.83-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <div className="relative pt-2 pb-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0f0f11] px-3 text-slate-500 font-medium">Or continue with email</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEmailLogin} className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 block">Email address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent text-white shadow-sm transition-all duration-300 hover:border-white/20" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 block">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent text-white shadow-sm transition-all duration-300 hover:border-white/20" 
                />
              </div>
              <button 
                type="submit"
                disabled={isEmailLoading || isLoggingIn}
                className="w-full h-12 rounded-full bg-white text-black hover:bg-slate-200 text-base font-medium transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : <>Continue <span className="ml-2 font-light">›</span></>}
              </button>
            </form>
          </div>

          <div className="text-center space-y-5 pt-6">
            <button className="text-[13px] font-semibold text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">
              Sign in with messaging (WhatsApp / iMessage)
            </button>
            <p className="text-[11px] text-slate-500 font-medium">
              By continuing you agree to Tsenta's <a href="#" className="underline decoration-slate-600 hover:text-slate-400">Terms of Service</a> and <a href="#" className="underline decoration-slate-600 hover:text-slate-400">Privacy Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

