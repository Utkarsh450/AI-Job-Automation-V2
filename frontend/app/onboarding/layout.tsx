export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121212] flex flex-col font-sans">
      <header className="border-b border-slate-200 dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl">A</div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">Autojob</span>
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

