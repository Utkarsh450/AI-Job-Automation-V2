'use client';

import { useState } from 'react';
import useAuthStore from '../../../src/store/useAuthStore';
import { Search, MailX, ArrowRight, Loader2, Maximize2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function InboxPage() {
  const { user, token, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('All');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: emails = [], isLoading: isLoadingEmails } = useQuery({
    queryKey: ['emails', token],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/emails`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch emails');
      const data = await res.json();
      return data.emails || [];
    },
    enabled: !!token,
  });

  if (isLoading || !user) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#1a1a1a]"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  return (
    <div className="flex flex-col h-screen max-h-screen bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-200 overflow-hidden">
      
      {/* Top Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-[#2a2a2a] shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inbox</h1>
        
        <div className="flex items-center space-x-4">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 dark:text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full bg-white dark:bg-[#1e1e1e] border border-slate-200 dark:border-[#333] text-slate-900 dark:text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-slate-500 transition-colors shadow-sm"
            />
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-slate-200 dark:border-[#444] rounded-lg text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-[#2a2a2a] transition-colors shadow-sm bg-white dark:bg-transparent">
            <span>Use your own email</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-[#2a2a2a] flex space-x-2 shrink-0 overflow-x-auto scrollbar-hide">
        <button 
          className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-transform shadow-sm bg-white text-black dark:bg-white dark:text-black"
        >
          All
        </button>
      </div>

      {/* Info Banner */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-[#2a2a2a] text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <strong className="text-slate-900 dark:text-slate-300 font-medium">utkarsh.barnwal@my-privateemail.com</strong> forwards to <strong className="text-slate-900 dark:text-slate-300 font-medium">{user.email}</strong> · Auto-fill OTPs automatically. Your connected mail doesn't appear here.
      </div>

      {/* Split Pane Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane: Message List */}
        <div className="w-1/3 md:w-2/5 border-r border-slate-200 dark:border-[#2a2a2a] overflow-y-auto bg-slate-50 dark:bg-[#1a1a1a]">
          {isLoadingEmails ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
          ) : emails.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 mt-20">
              <MailX className="w-12 h-12 text-slate-400 dark:text-slate-500 mb-4" strokeWidth={1.5} />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-300 mb-1">No messages</h3>
              <p className="text-sm text-slate-500 text-center max-w-xs">
                Messages sent to your inbox address will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#2a2a2a]">
              {emails.map((email: any) => (
                <div 
                  key={email.id} 
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#222] transition-colors ${selectedEmail?.id === email.id ? 'bg-white dark:bg-[#222] border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`font-bold text-sm ${!email.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {email.fromName || email.fromEmail}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(email.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={`text-xs mb-1 truncate ${!email.isRead ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-500 truncate">
                    {email.bodyText.substring(0, 60)}...
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Message Viewer */}
        <div className="flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden">
          {!selectedEmail ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <Maximize2 className="w-6 h-6 text-slate-400 dark:text-slate-600 mb-4 transform rotate-45" strokeWidth={2} />
              <p className="text-sm text-slate-500">Select a message to read</p>
            </div>
          ) : (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-[#2a2a2a]">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{selectedEmail.subject}</h2>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {(selectedEmail.fromName || selectedEmail.fromEmail).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedEmail.fromName || selectedEmail.fromEmail}</div>
                      <div className="text-xs text-slate-500">&lt;{selectedEmail.fromEmail}&gt;</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(selectedEmail.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                <div 
                  className="prose dark:prose-invert prose-sm max-w-none prose-p:text-slate-700 dark:prose-p:text-slate-300"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || selectedEmail.bodyText.replace(/\n/g, '<br/>') }}
                />
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
