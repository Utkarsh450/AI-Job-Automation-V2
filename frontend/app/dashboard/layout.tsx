'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import useAuthStore from '../../src/store/useAuthStore';
import { ThemeToggle } from '../../components/theme-toggle';
import {
  Rocket,
  LayoutGrid,
  Briefcase,
  Mail,
  LineChart,
  User,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, dbUser } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Browse jobs', href: '/dashboard/jobs', icon: Briefcase },
    { name: 'Inbox', href: '/dashboard/inbox', icon: Mail },
    { name: 'Tracker', href: '/dashboard/tracker', icon: LineChart },
  ];

  const bottomNavItems = [
    { name: 'Profile', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const userInitials = (dbUser?.name || dbUser?.email || user?.email || 'U').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-300 flex font-sans overflow-hidden">

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-sm border border-slate-200 dark:border-[#333]"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-900 dark:text-slate-300" /> : <Menu className="w-5 h-5 text-slate-900 dark:text-slate-300" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 bg-white dark:bg-[#1a1a1a] border-r border-slate-200 dark:border-[#2a2a2a] flex flex-col py-6 transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-56' : 'w-16'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>

        {/* Logo */}
        <div className={`mb-8 flex items-center cursor-pointer px-4 ${isExpanded ? 'justify-start' : 'justify-center'}`} onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-8 h-8 shrink-0 bg-blue-600 dark:bg-slate-800 rounded-lg flex items-center justify-center transform hover:scale-105 transition-transform shadow-sm">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          {isExpanded && (
            <span className="ml-3 text-slate-900 dark:text-white font-bold text-lg whitespace-nowrap">Jobr</span>
          )}
        </div>

        {/* Main Nav */}
        <div className="flex-1 flex flex-col px-3 space-y-1 w-full overflow-hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isExpanded ? item.name : undefined}
                className={`
                  flex items-center rounded-xl transition-all duration-200 group relative
                  ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                  ${isActive
                    ? 'bg-slate-100 dark:bg-[#2a2a2a] text-blue-600 dark:text-white font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#222] font-medium'}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} strokeWidth={isActive ? 2.5 : 2} />
                {isExpanded && (
                  <span className="ml-3 whitespace-nowrap text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Nav */}
        <div className="flex flex-col px-3 space-y-1 w-full mb-4 overflow-hidden">
          <div className={`h-px bg-slate-200 dark:bg-[#2a2a2a] mb-2 mx-2 ${isExpanded ? 'block' : 'hidden'}`}></div>
          <div className={`w-8 h-px bg-slate-200 dark:bg-[#2a2a2a] mb-2 mx-auto ${isExpanded ? 'hidden' : 'block'}`}></div>

          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                title={!isExpanded ? item.name : undefined}
                className={`
                  flex items-center rounded-xl transition-all duration-200
                  ${isExpanded ? 'px-3 py-2.5' : 'p-2.5 justify-center'}
                  ${isActive
                    ? 'bg-slate-100 dark:bg-[#2a2a2a] text-blue-600 dark:text-white font-medium'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#222] font-medium'}
                `}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`} strokeWidth={2} />
                {isExpanded && (
                  <span className="ml-3 whitespace-nowrap text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Toggle & Avatar Area */}
        <div className={`px-4 flex items-center mt-auto ${isExpanded ? 'justify-between' : 'flex-col space-y-4'}`}>
          <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 dark:bg-[#2a2a2a] border border-slate-200 dark:border-[#333] flex items-center justify-center text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-[#333] transition-colors">
            {userInitials}
          </div>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222] transition-colors"
              title="Toggle sidebar"
            >
              {isExpanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-h-screen bg-white dark:bg-[#1a1a1a] transition-all duration-300 ease-in-out ${isExpanded ? 'lg:ml-56' : 'lg:ml-16'}`}>
        {children}
      </main>
    </div>
  );
}
