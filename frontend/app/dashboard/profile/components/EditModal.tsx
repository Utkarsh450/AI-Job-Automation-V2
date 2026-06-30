import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Plus, Trash2 } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sectionKey: string, newValue: any) => Promise<void>;
  section: string;
  initialData: any;
  title: string;
}

export default function EditModal({ isOpen, onClose, onSave, section, initialData, title }: EditModalProps) {
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (section === 'skills' && Array.isArray(initialData)) {
        setFormData(initialData.join(', '));
      } else if (Array.isArray(initialData)) {
        setFormData([...initialData]); // Deep copy for arrays (Experience, Education, Projects)
      } else if (typeof initialData === 'object' && initialData !== null) {
        setFormData({ ...initialData }); // Deep copy for objects (Personal Info)
      } else {
        setFormData(initialData || ''); // Strings (Summary)
      }
      setError(null);
    }
  }, [isOpen, initialData, section]);

  if (!isOpen || formData === null) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      let finalValue: any = formData;
      if (section === 'skills' && typeof formData === 'string') {
        finalValue = formData.split(',').map(s => s.trim()).filter(Boolean);
      }
      await onSave(section, finalValue);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Array Updaters ---
  const updateArrayItem = (index: number, field: string, value: any) => {
    const newArray = [...formData];
    newArray[index] = { ...newArray[index], [field]: value };
    setFormData(newArray);
  };

  const removeArrayItem = (index: number) => {
    const newArray = [...formData];
    newArray.splice(index, 1);
    setFormData(newArray);
  };

  const addArrayItem = (template: any) => {
    setFormData([...(Array.isArray(formData) ? formData : []), template]);
  };

  // --- Renderers ---
  const renderPersonalInfo = () => (
    <div className="space-y-4">
      <div><label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
        <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
      <div><label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
        <input type="email" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.email || ''} onChange={(e) => setFormData({...formData, email: e.target.value})} /></div>
      <div><label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
        <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.phone || ''} onChange={(e) => setFormData({...formData, phone: e.target.value})} /></div>
      <div><label className="block text-xs font-bold text-slate-500 mb-1">Location</label>
        <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.location || ''} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
      <div><label className="block text-xs font-bold text-slate-500 mb-1">LinkedIn URL</label>
        <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.linkedin || ''} onChange={(e) => setFormData({...formData, linkedin: e.target.value})} /></div>
      <div><label className="block text-xs font-bold text-slate-500 mb-1">GitHub URL</label>
        <input type="text" className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={formData?.github || ''} onChange={(e) => setFormData({...formData, github: e.target.value})} /></div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      {Array.isArray(formData) && formData.map((item: any, idx: number) => (
        <div key={idx} className="p-4 border border-slate-200 dark:border-[#333] rounded-xl bg-slate-50/50 dark:bg-[#111]/50 relative group">
          <button onClick={() => removeArrayItem(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.role || ''} onChange={(e) => updateArrayItem(idx, 'role', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Company</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.company || ''} onChange={(e) => updateArrayItem(idx, 'company', e.target.value)} /></div>
            <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Duration</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" placeholder="e.g. Jan 2020 - Present" value={item.duration || ''} onChange={(e) => updateArrayItem(idx, 'duration', e.target.value)} /></div>
            <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
              <textarea className="w-full h-24 p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.description || ''} onChange={(e) => updateArrayItem(idx, 'description', e.target.value)} /></div>
          </div>
        </div>
      ))}
      <button onClick={() => addArrayItem({ role: '', company: '', duration: '', description: '' })} className="w-full py-3 border border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
        <Plus className="w-4 h-4" /> Add Experience
      </button>
    </div>
  );

  const renderEducation = () => (
    <div className="space-y-6">
      {Array.isArray(formData) && formData.map((item: any, idx: number) => (
        <div key={idx} className="p-4 border border-slate-200 dark:border-[#333] rounded-xl bg-slate-50/50 dark:bg-[#111]/50 relative group">
          <button onClick={() => removeArrayItem(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Institution</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.institution || ''} onChange={(e) => updateArrayItem(idx, 'institution', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Degree</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.degree || ''} onChange={(e) => updateArrayItem(idx, 'degree', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Year / Expected</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.year || ''} onChange={(e) => updateArrayItem(idx, 'year', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">GPA (Optional)</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.gpa || ''} onChange={(e) => updateArrayItem(idx, 'gpa', e.target.value)} /></div>
          </div>
        </div>
      ))}
      <button onClick={() => addArrayItem({ institution: '', degree: '', year: '', gpa: '' })} className="w-full py-3 border border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
        <Plus className="w-4 h-4" /> Add Education
      </button>
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-6">
      {Array.isArray(formData) && formData.map((item: any, idx: number) => (
        <div key={idx} className="p-4 border border-slate-200 dark:border-[#333] rounded-xl bg-slate-50/50 dark:bg-[#111]/50 relative group">
          <button onClick={() => removeArrayItem(idx)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
          <div className="grid grid-cols-1 gap-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Project Name</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.name || ''} onChange={(e) => updateArrayItem(idx, 'name', e.target.value)} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Technologies (comma separated)</label>
              <input type="text" className="w-full p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={(item.technologies || []).join(', ')} onChange={(e) => updateArrayItem(idx, 'technologies', e.target.value.split(',').map(s=>s.trim()))} /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
              <textarea className="w-full h-24 p-2 border border-slate-200 dark:border-[#333] rounded-lg text-sm dark:bg-[#1a1a1a]" value={item.description || ''} onChange={(e) => updateArrayItem(idx, 'description', e.target.value)} /></div>
          </div>
        </div>
      ))}
      <button onClick={() => addArrayItem({ name: '', technologies: [], description: '' })} className="w-full py-3 border border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
        <Plus className="w-4 h-4" /> Add Project
      </button>
    </div>
  );

  const renderCertifications = () => (
    <div className="space-y-4">
      {Array.isArray(formData) && formData.map((cert: string, idx: number) => (
        <div key={idx} className="flex gap-2 items-center">
          <input type="text" className="flex-1 p-2 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm" value={cert || ''} onChange={(e) => {
            const newArr = [...formData];
            newArr[idx] = e.target.value;
            setFormData(newArr);
          }} />
          <button onClick={() => removeArrayItem(idx)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
        </div>
      ))}
      <button onClick={() => addArrayItem('')} className="w-full py-3 border border-dashed border-emerald-500/50 text-emerald-600 dark:text-emerald-500 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors">
        <Plus className="w-4 h-4" /> Add Certification
      </button>
    </div>
  );

  const renderApplicationDefaults = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Work Authorization</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Visa Type</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm"
              value={formData?.visaStatus || 'US Citizen'}
              onChange={(e) => setFormData({...formData, visaStatus: e.target.value})}
            >
              <option value="US Citizen">US Citizen</option>
              <option value="Green Card">Green Card</option>
              <option value="H1B">H1B</option>
              <option value="F1 OPT">F1 OPT</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Requires Sponsorship</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm"
              value={formData?.preferences?.requiresVisaSponsorship ? 'Yes' : 'No'}
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, requiresVisaSponsorship: e.target.value === 'Yes'}})}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-[#333]" />

      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Work Preferences</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.openToInPerson !== false} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, openToInPerson: e.target.checked}})} 
            />
            <span className="text-sm">In-person OK</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.willingToRelocate === true} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, willingToRelocate: e.target.checked}})} 
            />
            <span className="text-sm">Can relocate</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.canStartImmediately !== false} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, canStartImmediately: e.target.checked}})} 
            />
            <span className="text-sm">Can start immediately</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.reliableTransportation !== false} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, reliableTransportation: e.target.checked}})} 
            />
            <span className="text-sm">Has reliable transportation</span>
          </label>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-500 mb-1">Needs Accommodations?</label>
            <select 
              className="w-full p-2.5 bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-lg text-sm"
              value={formData?.preferences?.needAccommodations || 'No'}
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, needAccommodations: e.target.value}})}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-slate-100 dark:border-[#333]" />

      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Background</h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.activeClearance === true} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, activeClearance: e.target.checked}})} 
            />
            <span className="text-sm">Has Gov clearance</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
              checked={formData?.preferences?.foreignTies === true} 
              onChange={(e) => setFormData({...formData, preferences: {...formData.preferences, foreignTies: e.target.checked}})} 
            />
            <span className="text-sm">Has Gov ties</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#333] rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-[#222]">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit {title}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222] rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 dark:text-slate-200">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>}
          
          {section === 'personal_info' && renderPersonalInfo()}
          {section === 'experience' && renderExperience()}
          {section === 'education' && renderEducation()}
          {section === 'projects' && renderProjects()}
          {section === 'certifications' && renderCertifications()}
          {section === 'application-defaults' && renderApplicationDefaults()}
          
          {section === 'professional_summary' && (
            <textarea
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full h-40 p-4 text-sm bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-xl outline-none resize-none"
            />
          )}

          {section === 'skills' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Comma separated skills</label>
              <textarea
                value={formData}
                onChange={(e) => setFormData(e.target.value)}
                className="w-full h-40 p-4 text-sm bg-slate-50 dark:bg-[#111] border border-slate-200 dark:border-[#333] rounded-xl outline-none resize-none"
                placeholder="React, Node.js, Python, AWS..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-[#222] flex justify-end gap-3 bg-slate-50/50 dark:bg-[#111]/50">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222] rounded-lg transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}

