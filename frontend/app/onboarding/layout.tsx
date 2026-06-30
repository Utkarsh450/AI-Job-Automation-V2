export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f11] flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-white/5 bg-white dark:bg-[#141414] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xl">T</div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">Tsenta</span>
        </div>
        <div className="text-sm font-medium text-slate-500">
          Setup Profile
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}

