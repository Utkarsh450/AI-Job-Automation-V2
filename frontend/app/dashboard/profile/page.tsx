'use client';

import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import EditModal from './components/EditModal';
import { useProfileData } from './hooks/useProfileData';

// Sections
import ProfileHeaderSection from './components/sections/ProfileHeaderSection';
import DocumentsSection from './components/sections/DocumentsSection';
import ExperienceSection from './components/sections/ExperienceSection';
import EducationSection from './components/sections/EducationSection';
import SkillsSection from './components/sections/SkillsSection';
import CertificationsSection from './components/sections/CertificationsSection';
import ProjectsSection from './components/sections/ProjectsSection';
import ApplicationDefaultsSection from './components/sections/ApplicationDefaultsSection';

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [editingSection, setEditingSection] = useState<{key: string, data: any, title: string} | null>(null);

  const { 
    profile, 
    latestResume, 
    parsedData, 
    isLoading, 
    uploadMutation, 
    saveMutation 
  } = useProfileData();

  if (isLoading) {
    return <div className="h-full w-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>;
  }

  if (!profile) {
    return <div className="p-8 text-slate-500">Failed to load profile.</div>;
  }

  const handleScroll = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setActiveSection(id);
  };

  const navItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'documents', label: 'Documents' },
    { id: 'experience', label: 'Experience' },
    { id: 'education', label: 'Education' },
    { id: 'skills', label: 'Skills' },
    { id: 'certifications', label: 'Certifications' },
    { id: 'projects', label: 'Projects' },
    { id: 'application-defaults', label: 'Application defaults' },
  ];

  const handleSaveSection = async (sectionKey: string, newValue: any) => {
    await saveMutation.mutateAsync({ sectionKey, newValue });
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-12 items-start relative">
        
        {/* Main Content Area */}
        <div className="space-y-6">
          <ProfileHeaderSection profile={profile} parsedData={parsedData} setEditingSection={setEditingSection} />
          <DocumentsSection latestResume={latestResume} uploadMutation={uploadMutation} />
          <ExperienceSection parsedData={parsedData} setEditingSection={setEditingSection} />
          <EducationSection parsedData={parsedData} setEditingSection={setEditingSection} />
          <SkillsSection parsedData={parsedData} setEditingSection={setEditingSection} />
          <CertificationsSection parsedData={parsedData} setEditingSection={setEditingSection} />
          <ProjectsSection parsedData={parsedData} setEditingSection={setEditingSection} />
          <ApplicationDefaultsSection profile={profile} setEditingSection={setEditingSection} />

          {/* Add Section Button */}
          <button className="w-full flex items-center justify-center gap-2 px-6 py-4 border border-dashed border-slate-300 dark:border-[#444] rounded-2xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#222] transition-colors text-sm font-medium">
            <Plus className="w-4 h-4" /> Add custom section
          </button>
        </div>

        {/* Right Sticky Sidebar */}
        <div className="hidden lg:block relative">
          <div className="sticky top-10 w-full space-y-1">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => handleScroll(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${activeSection === item.id ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-[#222] hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                <div className={`w-1 h-1 rounded-full ${activeSection === item.id ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-[#555]'}`}></div>
                {item.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-slate-100 dark:border-[#222]">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-left">
                <Plus className="w-3 h-3" /> Add section
              </button>
            </div>
          </div>
        </div>

      </div>
      
      {/* Edit Modal */}
      {editingSection && (
        <EditModal 
          isOpen={true}
          onClose={() => setEditingSection(null)}
          onSave={handleSaveSection}
          section={editingSection.key}
          initialData={editingSection.data}
          title={editingSection.title}
        />
      )}
    </div>
  );
}

