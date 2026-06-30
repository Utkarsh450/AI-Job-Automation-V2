'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../../src/store/useAuthStore';
import { UploadCloud, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// --- Step Components (Moved outside to prevent React from unmounting and losing focus) --- //

const Step0 = ({ isUploading, file, referralCode, setReferralCode, handleFileUpload }: any) => (
  <div className="flex w-full max-w-[1200px] mx-auto bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333] shadow-sm overflow-hidden min-h-[600px]">
    {/* Left Sidebar */}
    <div className="w-1/3 bg-slate-50 dark:bg-[#121212] p-10 border-r border-slate-200 dark:border-[#333]">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-6 uppercase">Getting Started</h3>
      <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-8">
        Upload your resume and we'll extract your profile, draft a cover letter, and queue jobs for you — usually in under a minute.
      </p>
      <ul className="space-y-6">
        <li className="flex items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-400">AI pulls your skills, roles, and dates straight from the PDF.</span>
        </li>
        <li className="flex items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-400">A first-pass cover letter is written from your experience.</span>
        </li>
        <li className="flex items-start">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-400">Personalized matches ready by the time you finish setup.</span>
        </li>
      </ul>
    </div>

    {/* Right Content */}
    <div className="w-2/3 p-12">
      <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-4 uppercase">Resume</h3>
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-4">Upload your resume.</h1>
      <p className="text-slate-500 mb-10 text-sm">PDF only, under 10MB. We parse it, draft a cover letter, and have matches waiting by the time you finish setup.</p>

      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-slate-200 dark:border-[#333] border-dashed rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-[#222] transition-colors mb-10">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {isUploading ? (
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          ) : (
            <UploadCloud className="w-10 h-10 text-slate-400 mb-3" />
          )}
          <p className="mb-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Drop your PDF here, or browse</span>
          </p>
          <p className="text-xs text-slate-500">Resume · PDF only · up to 10MB</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="application/pdf"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
          disabled={isUploading}
        />
      </label>

      <div className="mb-8">
        <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">Referral Code · optional</label>
        <input 
          type="text" 
          placeholder="e.g. JOHN1234" 
          className="w-full bg-transparent border-b border-slate-200 dark:border-[#333] focus:border-blue-500 py-2 outline-none text-slate-900 dark:text-white"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
        />
      </div>

      <button 
        onClick={() => file && handleFileUpload(file)}
        disabled={!file || isUploading}
        className="bg-[#111827] dark:bg-white text-white dark:text-[#111827] px-6 py-3 rounded-lg font-medium flex items-center disabled:opacity-50"
      >
        {isUploading ? 'Uploading...' : 'Continue'} 
        <ArrowRight className="w-4 h-4 ml-2" />
      </button>
    </div>
  </div>
);

const MasterLayout = ({ children, stepNumber, totalSteps, step, setStep, isResumeParsed, handleFinalSubmit }: any) => (
  <div className="flex flex-col w-full max-w-[1200px] mx-auto bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-200 dark:border-[#333] shadow-sm overflow-hidden min-h-[700px]">
    {/* Top Bar */}
    <div className="px-8 py-6 border-b border-slate-200 dark:border-[#333]">
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-slate-500">Step {stepNumber} of {totalSteps}</span>
        {stepNumber > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center">
            ← Back
          </button>
        )}
      </div>
      <div className="w-full bg-slate-100 dark:bg-[#222] h-1 rounded-full overflow-hidden">
        <div className="bg-slate-900 dark:bg-white h-full transition-all duration-300" style={{ width: `${(stepNumber / totalSteps) * 100}%` }} />
      </div>
    </div>

    <div className="flex flex-1">
      {/* Left Sidebar */}
      <div className="w-64 bg-slate-50 dark:bg-[#121212] p-8 border-r border-slate-200 dark:border-[#333] shrink-0">
        <div className="mb-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Resume</span>
            <div className="flex items-center text-xs font-medium">
              <div className={`w-2 h-2 rounded-full mr-1.5 ${isResumeParsed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className={isResumeParsed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                {isResumeParsed ? 'done' : 'in progress'}
              </span>
            </div>
          </div>
          {!isResumeParsed ? (
             <div className="w-full bg-slate-200 dark:bg-[#333] h-1 rounded-full overflow-hidden mb-4">
                <div className="bg-amber-500 h-full w-2/3 animate-pulse" />
             </div>
          ) : (
             <div className="w-full bg-emerald-100 dark:bg-emerald-900/30 h-1 rounded-full overflow-hidden mb-4">
                <div className="bg-emerald-500 h-full w-full" />
             </div>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            {!isResumeParsed 
              ? "Takes 30–60 seconds. We're pulling your work history and skills while you finish these."
              : "Parsed. While you finish setup, we're matching jobs for you."}
          </p>
        </div>

        <div>
          <span className="text-xs font-bold tracking-wider text-slate-900 dark:text-white mb-2 block">Why we ask</span>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every application asks these. Answer once here, we fill the forms.
          </p>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 p-10 flex flex-col">
        <div className="flex-1">
          {children}
        </div>
        <div className="mt-10 flex items-center">
          <button 
            onClick={() => step === totalSteps ? handleFinalSubmit() : setStep(step + 1)}
            className="bg-[#111827] dark:bg-white text-white dark:text-[#111827] px-6 py-3 rounded-lg font-medium flex items-center"
          >
            {step === totalSteps ? 'Complete Setup' : 'Continue'} 
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
          <span className="text-xs text-slate-400 ml-4 flex flex-col">
            <span>Enter ↵ Continue</span>
            <span>↑ + Tab Back</span>
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default function OnboardingWizard() {
  const router = useRouter();
  const { user, token, fetchUser, dbUser } = useAuthStore();
  const [step, setStep] = useState(0);

  // Guard: redirect already-onboarded users back to dashboard
  useEffect(() => {
    if (dbUser && dbUser.isOnboarded) {
      router.push('/dashboard');
    }
  }, [dbUser, router]);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  
  // Step 1: Location
  const [location, setLocation] = useState({ address: '', city: '', zip: '', county: '', country: '', state: '' });
  
  // Step 2: Work Status
  const [visaStatus, setVisaStatus] = useState('US Citizen');
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [needsSponsorship, setNeedsSponsorship] = useState<boolean | null>(null);
  const [locatedInUS, setLocatedInUS] = useState<boolean | null>(null);
  
  // Step 3: Preferences
  const [preferences, setPreferences] = useState({
    targetSalary: '' as string | number,
    remotePreference: 'Any',
    openToInPerson: true,
    willingToRelocate: false,
    canStartImmediately: true,
    reliableTransportation: true,
    needAccommodations: 'No' as string | null,
    activeClearance: false,
    foreignTies: false,
    previouslyEmployed: false,
    enrolledInPhD: false,
    yearsInPhD: '',
    gender: ''
  });

  // Step 4: Demographics
  const [demographics, setDemographics] = useState({
    gender: 'Decline', // Male, Female, Non-binary, Decline
    pronouns: 'Decline', // she/her, he/him, they/them, Decline
    race: 'Decline', // Asian, Black, Hispanic, White, Other, Decline
    veteranStatus: 'I am not a protected veteran', // I am not a protected veteran, I am a protected veteran, Decline
    disabilityStatus: 'No', // No, Yes, Decline
    lgbtqStatus: 'Decline' // Yes, No, Decline
  });

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');

  // Step 5: Application Passwords
  const [appPasswords, setAppPasswords] = useState([{ domain: 'workday', password: '' }]);
  const [showPassword, setShowPassword] = useState(false);

  // Step 6: Optimization
  const [resumeOptimization, setResumeOptimization] = useState('Honest');
  const [coverLetterOpt, setCoverLetterOpt] = useState('Honest');
  const [autoApprove, setAutoApprove] = useState(true);

  // Background Polling for Resume Status
  const { data: profileData } = useQuery({
    queryKey: ['profile', token],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    },
    enabled: step > 0 && !!token,
    refetchInterval: (data: any) => {
      // Keep polling if there's no resume or if the latest resume isn't parsed yet
      const resumes = data?.user?.resumes || [];
      const latest = resumes[resumes.length - 1];
      if (latest && !latest.parsedData) return 3000;
      return false; // Stop polling
    }
  });

  const latestResume = profileData?.user?.resumes?.[profileData.user.resumes.length - 1];
  const isResumeParsed = latestResume && latestResume.parsedData !== null;

  const generatePassword = () => {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()-_=+';
    const all = lower + upper + numbers + special;
    // Ensure at least one of each required type
    let pwd = [
      lower[Math.floor(Math.random() * lower.length)],
      upper[Math.floor(Math.random() * upper.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      special[Math.floor(Math.random() * special.length)],
    ];
    // Fill remaining characters (total 16)
    for (let i = pwd.length; i < 16; i++) {
      pwd.push(all[Math.floor(Math.random() * all.length)]);
    }
    // Shuffle
    pwd = pwd.sort(() => Math.random() - 0.5);
    const generated = pwd.join('');
    setAppPasswords([{ domain: 'workday', password: generated }]);
  };

  const handleFileUpload = async (selectedFile: File) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      // Advance to step 1
      setStep(1);
    } catch (err) {
      console.error(err);
      alert('Failed to upload resume. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsUploading(true);
    try {
      const fullLocationString = [location.address, location.city, location.state, location.zip, location.country].filter(Boolean).join(', ');
      
      const payload = {
        location: fullLocationString,
        visaStatus,
        requiresSponsorship: needsSponsorship,
        preferences: {
            targetSalary: preferences.targetSalary ? Number(preferences.targetSalary) : null,
            remotePreference: preferences.remotePreference,
            openToInPerson: preferences.openToInPerson,
            willingToRelocate: preferences.willingToRelocate,
            canStartImmediately: preferences.canStartImmediately,
            reliableTransportation: preferences.reliableTransportation,
            needAccommodations: preferences.needAccommodations,
            activeClearance: preferences.activeClearance,
            foreignTies: preferences.foreignTies,
            authorizedToWork: isAuthorized,
            requiresVisaSponsorship: needsSponsorship,
            locatedInUS: locatedInUS,
            previouslyEmployed: preferences.previouslyEmployed,
            enrolledInPhD: preferences.enrolledInPhD,
            yearsInPhD: preferences.yearsInPhD,
            university: preferences.university,
            gender: demographics.gender,
            pronouns: demographics.pronouns,
            race: demographics.race,
            veteranStatus: demographics.veteranStatus,
            disabilityStatus: demographics.disabilityStatus,
            lgbtqStatus: demographics.lgbtqStatus
        },
        linkedinUrl,
        githubUrl,
        appPasswords: appPasswords.filter(a => a.password).map(a => ({ domain: a.domain, password: a.password })),
        resumeOptimization,
        coverLetterOpt,
        autoApprove
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save profile");
      await fetchUser(); // Update global auth store (isOnboarded = true)
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 dark:bg-[#1a1a1a] flex items-center justify-center p-4 py-12">
      {step === 0 && (
        <Step0 
          isUploading={isUploading} 
          file={file} 
          referralCode={referralCode} 
          setReferralCode={setReferralCode} 
          handleFileUpload={handleFileUpload} 
        />
      )}
      
      {step === 1 && (
        <MasterLayout stepNumber={1} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Location</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">Where do you live?</h1>
          <p className="text-slate-500 mb-10 text-sm">Most job sites need a full address. We'll fill it in automatically from here.</p>

          <div className="mb-8">
            <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">Street Address</label>
            <input 
              type="text" placeholder="123 Main St" 
              className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white text-lg shadow-sm transition-shadow"
              value={location.address} onChange={(e) => setLocation({...location, address: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">City</label>
              <input type="text" placeholder="San Francisco" className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-shadow"
                value={location.city} onChange={(e) => setLocation({...location, city: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">Zip</label>
              <input type="text" placeholder="94103" className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-shadow"
                value={location.zip} onChange={(e) => setLocation({...location, zip: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">Country</label>
              <input type="text" placeholder="United States" className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-shadow"
                value={location.country} onChange={(e) => setLocation({...location, country: e.target.value})} />
            </div>
            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-2">State</label>
              <input type="text" placeholder="CA" className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-shadow"
                value={location.state} onChange={(e) => setLocation({...location, state: e.target.value})} />
            </div>
          </div>
        </MasterLayout>
      )}

      {step === 2 && (
        <MasterLayout stepNumber={2} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Work Eligibility</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">What's your work status?</h1>
          <p className="text-slate-500 mb-10 text-sm">We use this to filter out jobs you can't apply to. Pick the closest one.</p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {['US Citizen', 'Permanent Resident', 'H-1B', 'F-1 (Student)', 'OPT', 'CPT', 'J-1', 'L-1', 'O-1', 'TN', 'E-3', 'Other'].map(status => (
              <button 
                key={status}
                onClick={() => setVisaStatus(status)}
                className={`py-3 px-4 rounded-lg border text-sm font-medium transition-all text-left ${visaStatus === status ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' : 'border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#444]'}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-[#222]">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Are you legally authorized to work in the US?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setIsAuthorized(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${isAuthorized === true ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setIsAuthorized(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${isAuthorized === false ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Will you now, or in the future, require sponsorship?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setNeedsSponsorship(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${needsSponsorship === true ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setNeedsSponsorship(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${needsSponsorship === false ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700 dark:text-slate-300">Are you currently located in the US?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setLocatedInUS(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${locatedInUS === true ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setLocatedInUS(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${locatedInUS === false ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>
          </div>
        </MasterLayout>
      )}

      {step === 3 && (
        <MasterLayout stepNumber={3} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Quick Checklist</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">A few last questions.</h1>
          <p className="text-slate-500 mb-8 text-sm">Tap through. Defaults work for most people — only change what applies.</p>

          <div className="border border-slate-200 dark:border-[#333] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-[#222]">
            <div className="bg-slate-50 dark:bg-[#121212] px-6 py-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Preferences</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">Target Salary (USD)</span>
                <span className="text-xs text-slate-400 flex items-center mt-1">Used if an application asks for expected compensation.</span>
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-blue-500 transition-colors duration-300">$</span>
                <input 
                  type="number" 
                  placeholder="120000"
                  className="w-full sm:w-48 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg pl-8 pr-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                  value={preferences.targetSalary}
                  onChange={(e) => setPreferences({...preferences, targetSalary: e.target.value})}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 gap-4 border-t border-slate-100 dark:border-[#222]">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">LinkedIn Profile</span>
                <span className="text-xs text-slate-400 mt-1">Used if not found in resume.</span>
              </div>
              <input 
                type="url" 
                placeholder="https://linkedin.com/in/..."
                className="w-full sm:w-64 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 gap-4 border-t border-slate-100 dark:border-[#222]">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">GitHub / Portfolio</span>
                <span className="text-xs text-slate-400 mt-1">Used if not found in resume.</span>
              </div>
              <input 
                type="url" 
                placeholder="https://github.com/..."
                className="w-full sm:w-64 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 gap-4 border-t border-slate-100 dark:border-[#222]">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">Work Style</span>
                <span className="text-xs text-slate-400 mt-1">Your preferred working environment.</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1 overflow-x-auto w-full sm:w-auto shadow-inner">
                {['Remote', 'Hybrid', 'On-site', 'Any'].map(pref => (
                  <button 
                    key={pref}
                    onClick={() => setPreferences({...preferences, remotePreference: pref})}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-300 flex-1 sm:flex-none ${preferences.remotePreference === pref ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-md scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#333]'}`}
                  >
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 border-t border-slate-100 dark:border-[#222]">
              <span className="text-sm text-slate-700 dark:text-slate-300">Open to in-person work?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setPreferences({...preferences, openToInPerson: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${preferences.openToInPerson ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, openToInPerson: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${!preferences.openToInPerson ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>No</button>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50">
              <span className="text-sm text-slate-700 dark:text-slate-300">Willing to relocate?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setPreferences({...preferences, willingToRelocate: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${preferences.willingToRelocate ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, willingToRelocate: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${!preferences.willingToRelocate ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>No</button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#121212] px-6 py-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Background</span>
            </div>

            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50">
              <span className="text-sm text-slate-700 dark:text-slate-300">Active government clearance?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setPreferences({...preferences, activeClearance: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${preferences.activeClearance ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, activeClearance: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium ${!preferences.activeClearance ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>No</button>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">Family ties to foreign governments?</span>
                <span className="text-xs text-slate-400">Employers are required to ask.</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setPreferences({...preferences, foreignTies: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${preferences.foreignTies ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, foreignTies: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${!preferences.foreignTies ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-[#121212] px-6 py-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Specific Details</span>
            </div>

            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50">
              <span className="text-sm text-slate-700 dark:text-slate-300">Have you ever been employed by any of the companies you are applying to before?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1 shrink-0 ml-4">
                <button onClick={() => setPreferences({...preferences, previouslyEmployed: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${preferences.previouslyEmployed ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, previouslyEmployed: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${!preferences.previouslyEmployed ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 border-t border-slate-100 dark:border-[#222]">
              <span className="text-sm text-slate-700 dark:text-slate-300">Are you currently enrolled or recently graduated from a Ph.D program?</span>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1 shrink-0 ml-4">
                <button onClick={() => setPreferences({...preferences, enrolledInPhD: true})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${preferences.enrolledInPhD ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>Yes</button>
                <button onClick={() => setPreferences({...preferences, enrolledInPhD: false})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${!preferences.enrolledInPhD ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827] shadow-sm' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-[#444]'}`}>No</button>
              </div>
            </div>

            {preferences.enrolledInPhD && (
              <div className="flex flex-col p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 border-t border-slate-100 dark:border-[#222] animate-in slide-in-from-top-2 duration-300">
                <span className="text-sm text-slate-700 dark:text-slate-300 mb-3">How many years have you been enrolled in your Ph.D program?</span>
                <input 
                  type="text" 
                  placeholder="e.g. 1-2, 3-4, 5+"
                  className="w-full sm:w-64 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                  value={preferences.yearsInPhD}
                  onChange={(e) => setPreferences({...preferences, yearsInPhD: e.target.value})}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-6 hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50 gap-4 border-t border-slate-100 dark:border-[#222]">
              <div className="flex flex-col">
                <span className="text-sm text-slate-700 dark:text-slate-300">University / School</span>
                <span className="text-xs text-slate-400 mt-1">Used if not clearly found in resume.</span>
              </div>
              <input 
                type="text" 
                placeholder="e.g. Stanford University"
                className="w-full sm:w-64 bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-700"
                value={preferences.university || ''}
                onChange={(e) => setPreferences({...preferences, university: e.target.value})}
              />
            </div>
          </div>
        </MasterLayout>
      )}

      {step === 4 && (
        <MasterLayout stepNumber={4} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Demographics</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">Self-Identification</h1>
          <p className="text-slate-500 mb-8 text-sm">Most companies ask for these. We'll fill them automatically to save you time.</p>

          <div className="space-y-6">
            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">Gender</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['Male', 'Female', 'Non-binary', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, gender: opt})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${demographics.gender === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#444] bg-white dark:bg-[#222]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">Pronouns</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {['she/her', 'he/him', 'they/them', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, pronouns: opt})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${demographics.pronouns === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#444] bg-white dark:bg-[#222]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">Race / Ethnicity</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {['Asian', 'Black', 'Hispanic', 'White', 'Other', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, race: opt})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${demographics.race === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#444] bg-white dark:bg-[#222]'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">Veteran Status</label>
              <div className="flex flex-col gap-3">
                {['I am not a protected veteran', 'I am a protected veteran', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, veteranStatus: opt})}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left flex items-center ${demographics.veteranStatus === opt ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500 shadow-sm' : 'border-slate-200 dark:border-[#333] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#444] bg-white dark:bg-[#222]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${demographics.veteranStatus === opt ? 'border-blue-600 dark:border-blue-400' : 'border-slate-300 dark:border-[#555]'}`}>
                      {demographics.veteranStatus === opt && <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />}
                    </div>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">Disability Status</label>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-xl p-1.5 w-full sm:w-fit">
                {['No', 'Yes', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, disabilityStatus: opt})}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${demographics.disabilityStatus === opt ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-3">LGBTQ+ Community</label>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-xl p-1.5 w-full sm:w-fit">
                {['No', 'Yes', 'Decline'].map(opt => (
                  <button 
                    key={opt} onClick={() => setDemographics({...demographics, lgbtqStatus: opt})}
                    className={`px-6 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 ${demographics.lgbtqStatus === opt ? 'bg-white dark:bg-[#333] text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </MasterLayout>
      )}

      {step === 5 && (
        <MasterLayout stepNumber={5} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Application Password</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">Set a password for sites that ask</h1>
          <p className="text-slate-500 mb-8 text-sm max-w-md">Some applications (Workday, iCIMS, Oracle) require you to create an account mid-flow. We use this to sign you up automatically.</p>

          <div className="flex space-x-2 mb-8">
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#222] text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#333]">Workday</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#222] text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#333]">iCIMS</span>
            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-[#222] text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#333]">Oracle</span>
            <span className="px-3 py-1 text-xs font-medium text-slate-400 self-center">+ more</span>
          </div>

          <div className="border border-slate-200 dark:border-[#333] rounded-xl overflow-hidden mb-6">
            <div className="bg-slate-50 dark:bg-[#121212] px-6 py-3 flex justify-between items-center border-b border-slate-200 dark:border-[#333]">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Password</span>
          <button className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline" onClick={generatePassword}>
              Generate strong password
            </button>
            </div>
            <div className="p-6">
              <div className="relative mb-6">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your application password" 
                  className="w-full bg-white dark:bg-[#222] border border-slate-200 dark:border-[#333] rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white shadow-sm transition-shadow"
                  value={appPasswords[0].password}
                  onChange={(e) => setAppPasswords([{domain: 'workday', password: e.target.value}])}
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <ul className="space-y-2">
                <li className={`text-sm flex items-center ${appPasswords[0].password.length >= 12 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-3 h-3 rounded-full border mr-2 flex-shrink-0 ${appPasswords[0].password.length >= 12 ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-[#444]'}`} />
                  At least 12 characters
                </li>
                <li className={`text-sm flex items-center ${/[a-z]/.test(appPasswords[0].password) ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-3 h-3 rounded-full border mr-2 flex-shrink-0 ${/[a-z]/.test(appPasswords[0].password) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-[#444]'}`} />
                  At least one lowercase letter
                </li>
                <li className={`text-sm flex items-center ${/[A-Z]/.test(appPasswords[0].password) ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-3 h-3 rounded-full border mr-2 flex-shrink-0 ${/[A-Z]/.test(appPasswords[0].password) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-[#444]'}`} />
                  At least one uppercase letter
                </li>
                <li className={`text-sm flex items-center ${/[0-9]/.test(appPasswords[0].password) ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-3 h-3 rounded-full border mr-2 flex-shrink-0 ${/[0-9]/.test(appPasswords[0].password) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-[#444]'}`} />
                  At least one number
                </li>
                <li className={`text-sm flex items-center ${/[^A-Za-z0-9]/.test(appPasswords[0].password) ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <div className={`w-3 h-3 rounded-full border mr-2 flex-shrink-0 ${/[^A-Za-z0-9]/.test(appPasswords[0].password) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-[#444]'}`} />
                  At least one special character
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
            Encrypted before save
          </div>
        </MasterLayout>
      )}

      {step === 6 && (
        <MasterLayout stepNumber={6} totalSteps={6} step={step} setStep={setStep} isResumeParsed={isResumeParsed} handleFinalSubmit={handleFinalSubmit}>
          <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-2 uppercase">Application Settings</h3>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">How should we apply?</h1>
          <p className="text-slate-500 mb-8 text-sm">You can change these anytime from settings.</p>

          <div className="border border-slate-200 dark:border-[#333] rounded-xl overflow-hidden mb-6 divide-y divide-slate-100 dark:divide-[#222]">
            <div className="bg-slate-50 dark:bg-[#121212] px-6 py-3">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Resume Optimization</span>
            </div>
            
            <div className={`p-5 cursor-pointer flex items-start transition-colors ${resumeOptimization === 'Off' ? 'bg-blue-50 dark:bg-blue-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50'}`} onClick={() => setResumeOptimization('Off')}>
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-4 flex-shrink-0 flex items-center justify-center ${resumeOptimization === 'Off' ? 'border-[#111827] dark:border-white' : 'border-slate-300 dark:border-[#444]'}`}>
                 {resumeOptimization === 'Off' && <div className="w-2.5 h-2.5 rounded-full bg-[#111827] dark:bg-white" />}
               </div>
               <div>
                 <span className="block font-medium text-slate-900 dark:text-white text-sm mb-1">Off</span>
                 <span className="block text-xs text-slate-500">Send your resume exactly as uploaded.</span>
               </div>
            </div>

            <div className={`p-5 cursor-pointer flex items-start transition-colors ${resumeOptimization === 'Honest' ? 'bg-slate-100 dark:bg-[#222]' : 'hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50'}`} onClick={() => setResumeOptimization('Honest')}>
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-4 flex-shrink-0 flex items-center justify-center ${resumeOptimization === 'Honest' ? 'border-[#111827] dark:border-white' : 'border-slate-300 dark:border-[#444]'}`}>
                 {resumeOptimization === 'Honest' && <div className="w-2.5 h-2.5 rounded-full bg-[#111827] dark:bg-white" />}
               </div>
               <div>
                 <span className="block font-medium text-slate-900 dark:text-white text-sm mb-1">Honest</span>
                 <span className="block text-xs text-slate-500">Reorder and emphasize experience that's relevant to each job.</span>
               </div>
            </div>

            <div className={`p-5 cursor-pointer flex items-start transition-colors ${resumeOptimization === 'Aggressive' ? 'bg-slate-100 dark:bg-[#222]' : 'hover:bg-slate-50/50 dark:hover:bg-[#1a1a1a]/50'}`} onClick={() => setResumeOptimization('Aggressive')}>
               <div className={`w-5 h-5 rounded-full border-2 mt-0.5 mr-4 flex-shrink-0 flex items-center justify-center ${resumeOptimization === 'Aggressive' ? 'border-[#111827] dark:border-white' : 'border-slate-300 dark:border-[#444]'}`}>
                 {resumeOptimization === 'Aggressive' && <div className="w-2.5 h-2.5 rounded-full bg-[#111827] dark:bg-white" />}
               </div>
               <div>
                 <span className="block font-medium text-slate-900 dark:text-white text-sm mb-1">Aggressive</span>
                 <span className="block text-xs text-slate-500">Rewrite content to match the job description closely.</span>
               </div>
            </div>

            <div className="p-5 flex justify-between items-center bg-white dark:bg-[#1a1a1a]">
              <div>
                 <span className="block font-medium text-slate-900 dark:text-white text-sm mb-1">Auto-approve edits?</span>
                 <span className="block text-xs text-slate-500">Skip the preview step and send optimized files straight through.</span>
              </div>
              <div className="flex bg-slate-100 dark:bg-[#222] rounded-lg p-1">
                <button onClick={() => setAutoApprove(true)} className={`px-4 py-1.5 rounded-md text-sm font-medium ${autoApprove ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>Yes</button>
                <button onClick={() => setAutoApprove(false)} className={`px-4 py-1.5 rounded-md text-sm font-medium ${!autoApprove ? 'bg-[#111827] dark:bg-white text-white dark:text-[#111827]' : 'text-slate-500'}`}>No</button>
              </div>
            </div>
          </div>
        </MasterLayout>
      )}

    </div>
  );
}

