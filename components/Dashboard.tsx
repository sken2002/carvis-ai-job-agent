
import React, { useState } from 'react';
import { User, Job } from '../types';
import Card from './common/Card';
import { generateFollowUpEmail } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import BackButton from './common/BackButton';

interface DashboardProps {
  user: User;
  onUpdateUser: (user: User) => void;
  jobs: Job[];
  appliedJobIds: Set<string>;
  applicationDates: Record<string, string>;
  onBack: () => void;
  onDebugBackdate: (jobId: string, daysAgo: number) => void;
  onAddExternalJob: (job: Job) => void;
  onSimulateEmailScan: (updateStatus: (status: string) => void) => Promise<void>;
  followUpLog: Record<string, string>;
}

const AppliedJobCard: React.FC<{ job: Job, date: string, user: User, onDebugBackdate: (jobId: string, daysAgo: number) => void, followUpDate?: string }> = ({ job, date, user, onDebugBackdate, followUpDate }) => {
    const [followUpEmail, setFollowUpEmail] = useState('');
    const [loadingEmail, setLoadingEmail] = useState(false);

    const daysAgo = date ? Math.round((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const handleGenerateEmail = async () => {
        setLoadingEmail(true);
        setFollowUpEmail('');
        const email = await generateFollowUpEmail(user, job);
        setFollowUpEmail(email);
        setLoadingEmail(false);
    }
    
    return (
        <Card>
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div>
                    <div className="flex items-center gap-2">
                         <h4 className="font-bold text-lg text-primary-700 dark:text-primary-400">{job.title}</h4>
                         {job.isExternal && <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full dark:bg-purple-900 dark:text-purple-200">External</span>}
                         {followUpDate && <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full dark:bg-blue-900 dark:text-blue-200 font-bold">Followed Up: {followUpDate}</span>}
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{job.company}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {job.isExternal ? `Added: ${date}` : `Applied: ${date}`} ({daysAgo} {daysAgo === 1 ? 'day' : 'days'} ago)
                    </p>
                    {job.stage && <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mt-1">Stage: {job.stage}</p>}
                    {job.applicationStatus && job.applicationStatus !== 'Applied' && job.applicationStatus !== 'In Progress' && (
                        <p className={`text-sm font-bold mt-1 ${
                            job.applicationStatus === 'Rejected' ? 'text-red-600' : 
                            job.applicationStatus === 'Offer' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                            Status: {job.applicationStatus}
                        </p>
                    )}
                </div>
                <button 
                    onClick={handleGenerateEmail}
                    disabled={loadingEmail}
                    className="px-4 py-2 text-sm bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                    {loadingEmail ? 'Drafting...' : 'Draft Follow-up'}
                </button>
            </div>
            {loadingEmail && (
                <div className="mt-4 flex justify-center items-center h-20">
                    <LoadingSpinner />
                </div>
            )}
            {followUpEmail && (
                <div className="mt-4">
                    <h5 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">Suggested Email Draft:</h5>
                    <pre className="whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-slate-800 dark:text-slate-300">{followUpEmail}</pre>
                </div>
            )}
            
            {/* Developer Tools for Testing (Only for internal jobs for now) */}
            {!job.isExternal && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Developer Tools: Simulate Time Passed</p>
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => onDebugBackdate(job.id, 0)} className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 transition-colors">Today</button>
                        <button onClick={() => onDebugBackdate(job.id, 7)} className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 transition-colors">7 Days</button>
                        <button onClick={() => onDebugBackdate(job.id, 14)} className="px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800 transition-colors">14 Days</button>
                        <button onClick={() => onDebugBackdate(job.id, 21)} className="px-2 py-1 text-xs bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded border border-yellow-200 dark:border-yellow-800 transition-colors">21 Days</button>
                        <button onClick={() => onDebugBackdate(job.id, 28)} className="px-2 py-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800 transition-colors">28 Days</button>
                    </div>
                </div>
            )}
        </Card>
    )
}

const ConnectionsSection: React.FC<{ user: User, onUpdateUser: (u: User) => void, onSimulateScan: (cb: (s: string) => void) => Promise<void> }> = ({ user, onUpdateUser, onSimulateScan }) => {
    const [showInfo, setShowInfo] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('');

    const isGoogleConnected = user.connectedProviders.includes('google');
    const isMicrosoftConnected = user.connectedProviders.includes('microsoft');

    const toggleProvider = (provider: 'google' | 'microsoft') => {
        let newProviders = [...user.connectedProviders];
        if (newProviders.includes(provider)) {
            newProviders = newProviders.filter(p => p !== provider);
        } else {
            newProviders.push(provider);
        }
        onUpdateUser({ ...user, connectedProviders: newProviders });
    }

    const handleScan = async () => {
        if (user.connectedProviders.length === 0) return;
        setIsScanning(true);
        setScanStatus("Initializing...");
        await onSimulateScan(setScanStatus);
        setIsScanning(false);
        setScanStatus('');
    }

    return (
        <Card className="mb-6 border-2 border-primary-100 dark:border-primary-900">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Connections & Auto-Search</h3>
                <button onClick={() => setShowInfo(!showInfo)} className="text-primary-600 hover:text-primary-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </button>
            </div>
            
            {showInfo && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-800 dark:text-blue-200 rounded-md">
                    <p className="font-bold mb-1">How does this work?</p>
                    <p>
                        By connecting your email, Carvis uses a secure, read-only API connection to scan your email subject lines for keywords related to your <strong>tracked job applications</strong> (e.g., "Interview", "Update", "Status" + Company Name).
                    </p>
                    <p className="mt-2">
                        <strong>Privacy First:</strong> We do not read your personal emails. We only access emails that match your specific job application data to help you track progress automatically. Your data never leaves your device's session context.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Google Button */}
                <button 
                    onClick={() => toggleProvider('google')} 
                    className={`flex items-center justify-center px-4 py-3 border rounded-md shadow-sm font-medium transition-all ${
                        isGoogleConnected 
                        ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 ring-1 ring-green-400' 
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-white dark:text-slate-900'
                    }`}
                >
                    {isGoogleConnected ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    )}
                    {isGoogleConnected ? 'Connected (Google)' : 'Connect Google'}
                </button>

                {/* Microsoft Button */}
                <button 
                    onClick={() => toggleProvider('microsoft')} 
                    className={`flex items-center justify-center px-4 py-3 border rounded-md shadow-sm font-medium transition-all ${
                        isMicrosoftConnected 
                        ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 ring-1 ring-green-400' 
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-white dark:text-slate-900'
                    }`}
                >
                     {isMicrosoftConnected ? (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>
                    )}
                    {isMicrosoftConnected ? 'Connected (Microsoft)' : 'Connect Microsoft'}
                </button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-700">
                 <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {user.connectedProviders.length > 0 
                            ? `Connected to ${user.connectedProviders.length} provider(s)` 
                            : "No providers connected"}
                    </span>
                    <span className="text-xs text-slate-500">
                        {user.connectedProviders.length > 0 ? "Ready to scan." : "Connect a provider to start tracking."}
                    </span>
                 </div>

                 <button 
                    onClick={handleScan}
                    disabled={isScanning || user.connectedProviders.length === 0}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center min-w-[140px] justify-center"
                >
                    {isScanning ? (
                        <>
                            <LoadingSpinner className="w-4 h-4 mr-2 text-white"/>
                            <span className="truncate max-w-[200px]">{scanStatus}</span>
                        </>
                    ) : "Run Auto-Search"}
                </button>
            </div>
        </Card>
    );
}

const ProfileSection: React.FC<{ user: User, onUpdateUser: (user: User) => void }> = ({ user, onUpdateUser }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editState, setEditState] = useState(user);

    const handleChange = (field: keyof User, value: any) => {
        setEditState(prev => ({ ...prev, [field]: value }));
    }

    const handleArrayChange = (field: 'interests' | 'coreCompetencies' | 'softSkills', value: string) => {
        setEditState(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()) }));
    }

    const handleSave = () => {
        onUpdateUser(editState);
        setIsEditing(false);
    }

    const handleCancel = () => {
        setEditState(user);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <Card>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-lg text-primary-700 dark:text-primary-400">Edit Profile</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                            <input type="text" value={editState.name} onChange={e => handleChange('name', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interests (comma separated)</label>
                            <input type="text" value={editState.interests.join(', ')} onChange={e => handleArrayChange('interests', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Career Aspirations</label>
                            <textarea value={editState.aspirations} onChange={e => handleChange('aspirations', e.target.value)} rows={2} className="w-full p-2 border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Core Competencies (comma separated)</label>
                            <input type="text" value={editState.coreCompetencies.join(', ')} onChange={e => handleArrayChange('coreCompetencies', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Soft Skills (comma separated)</label>
                            <input type="text" value={editState.softSkills.join(', ')} onChange={e => handleArrayChange('softSkills', e.target.value)} className="w-full p-2 border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button onClick={handleSave} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Save Changes</button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded hover:bg-slate-300 dark:bg-slate-600 dark:text-slate-200">Cancel</button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card>
             <div className="flex justify-between items-start mb-4">
                <div className="space-y-4 w-full">
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Name</h3>
                        <p className="text-slate-600 dark:text-slate-400">{user.name}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Interests</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {user.interests.map(interest => (
                                <span key={interest} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-semibold rounded-full dark:bg-primary-900/50 dark:text-primary-300">
                                    {interest}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Aspirations</h3>
                        <p className="text-slate-600 dark:text-slate-400">{user.aspirations}</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Skills</h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {[...user.coreCompetencies, ...user.softSkills].map((skill, i) => (
                                <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded dark:bg-slate-700 dark:text-slate-300">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                 <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Edit</button>
            </div>
            
            <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Your CV Draft</h3>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-slate-800 dark:text-slate-300 max-h-60 overflow-y-auto">{user.cv}</pre>
                </div>
                 <div>
                    <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Your Cover Letter Draft</h3>
                    <pre className="mt-1 whitespace-pre-wrap font-sans text-sm bg-slate-50 dark:bg-slate-800/50 p-4 rounded-md text-slate-800 dark:text-slate-300 max-h-60 overflow-y-auto">{user.coverLetter}</pre>
                </div>
            </div>
        </Card>
    );
}

const ExternalJobForm: React.FC<{ onAdd: (job: Job) => void }> = ({ onAdd }) => {
    const [formData, setFormData] = useState({
        title: '',
        company: '',
        stage: 'Applied',
        dateApplied: new Date().toISOString().split('T')[0],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.company) return;

        const newJob: Job = {
            id: `ext-job-${Date.now()}`,
            title: formData.title,
            company: formData.company,
            location: 'External/Not Specified',
            description: 'Manually tracked job.',
            skills: [],
            tenure: 'Unknown',
            visa: 'Unknown',
            deadline: 'Unknown',
            isExternal: true,
            stage: formData.stage,
            applicationStatus: 'In Progress',
            dateApplied: formData.dateApplied
        };
        onAdd(newJob);
        setFormData({ title: '', company: '', stage: 'Applied', dateApplied: new Date().toISOString().split('T')[0] });
    }

    return (
        <Card className="mb-6 border border-dashed border-slate-300 dark:border-slate-600">
            <h4 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-200">Track External Application</h4>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Role Title</label>
                    <input required type="text" placeholder="e.g. Product Manager" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 text-sm border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Company</label>
                    <input required type="text" placeholder="e.g. Amazon" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full p-2 text-sm border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Current Stage</label>
                    <select value={formData.stage} onChange={e => setFormData({...formData, stage: e.target.value})} className="w-full p-2 text-sm border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500">
                        <option>Applied</option>
                        <option>Phone Screen</option>
                        <option>Technical Interview</option>
                        <option>Final Round</option>
                        <option>Offer</option>
                        <option>Rejected</option>
                    </select>
                </div>
                <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Date Applied</label>
                    <input type="date" value={formData.dateApplied} onChange={e => setFormData({...formData, dateApplied: e.target.value})} className="w-full p-2 text-sm border rounded bg-white text-slate-900 border-slate-300 focus:border-primary-500 focus:ring-primary-500" />
                </div>
                <div className="md:col-span-1">
                    <button type="submit" className="w-full p-2 bg-slate-700 text-white text-sm font-bold rounded hover:bg-slate-800 dark:bg-slate-600">Add to Tracker</button>
                </div>
            </form>
        </Card>
    )
}

const Dashboard: React.FC<DashboardProps> = ({ user, onUpdateUser, jobs, appliedJobIds, applicationDates, onBack, onDebugBackdate, onAddExternalJob, onSimulateEmailScan, followUpLog }) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  
  const appliedJobs = jobs.filter(job => appliedJobIds.has(job.id) && !job.isExternal);
  const externalJobs = jobs.filter(job => job.isExternal);

  const tabClasses = (isActive: boolean) => 
    `px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors ${
      isActive
        ? 'bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border-t-2 border-primary-600'
        : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-700 dark:text-slate-400'
    }`;

  return (
    <div className="space-y-8">
      <BackButton onClick={onBack} text="Back to Jobs"/>
      
      <div>
        <div className="flex items-center mb-6">
             <div className="w-4 h-4 bg-purple-600 rounded-sm mr-3"></div>
             <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Your Info</h2>
        </div>
        <ConnectionsSection user={user} onUpdateUser={onUpdateUser} onSimulateScan={onSimulateEmailScan} />
        <ProfileSection user={user} onUpdateUser={onUpdateUser} />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-6">Application Tracker</h2>
        
        <div className="flex space-x-1 mb-4">
             <button onClick={() => setActiveTab('internal')} className={tabClasses(activeTab === 'internal')}>Platform Applications</button>
             <button onClick={() => setActiveTab('external')} className={tabClasses(activeTab === 'external')}>External Applications</button>
        </div>

        {activeTab === 'internal' && (
            <div className="space-y-6">
            {appliedJobs.length > 0 ? (
                appliedJobs.map(job => (
                    <AppliedJobCard 
                        key={job.id} 
                        job={job} 
                        date={applicationDates[job.id]} 
                        user={user} 
                        onDebugBackdate={onDebugBackdate}
                        followUpDate={followUpLog[job.id]}
                    />
                ))
            ) : (
                <Card>
                    <p className="text-center text-slate-600 dark:text-slate-400 py-8">You haven't applied to any jobs yet. Start exploring the job board!</p>
                </Card>
            )}
            </div>
        )}

        {activeTab === 'external' && (
             <div className="space-y-6">
                <ExternalJobForm onAdd={onAddExternalJob} />
                {externalJobs.length > 0 ? (
                     externalJobs.map(job => (
                        <AppliedJobCard 
                            key={job.id} 
                            job={job} 
                            date={job.dateApplied || ''} 
                            user={user} 
                            onDebugBackdate={onDebugBackdate}
                            followUpDate={followUpLog[job.id]}
                        />
                     ))
                ) : (
                    <div className="text-center text-slate-500 py-8 italic">No external jobs tracked yet. Add one above!</div>
                )}
             </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
