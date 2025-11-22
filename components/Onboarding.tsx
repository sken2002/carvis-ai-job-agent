
import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import Card from './common/Card';
import LoadingSpinner from './common/LoadingSpinner';
import { analyzeProfileFromCV } from '../services/geminiService';

// Define global interface for pdfjsLib loaded via CDN
declare global {
    interface Window {
        pdfjsLib: any;
    }
}

interface OnboardingProps {
    onComplete: (user: User) => void;
    initialUser: User;
}

const STEPS = [
    { id: 'identity', title: 'Who are you?', subtitle: "Let's start with the basics." },
    { id: 'focus', title: 'Your North Star', subtitle: "Where do you want to go?" },
    { id: 'assets', title: 'Digital Assets', subtitle: "Upload your CV and connect your hubs." },
    { id: 'voice', title: 'Your Voice', subtitle: "Set a baseline for your cover letters." }
];

const PREDEFINED_INTERESTS = [
    "FinTech", "Consulting", "Product Management", "Sustainable Energy", 
    "Venture Capital", "Private Equity", "Healthcare", "Marketing", 
    "Data Science", "Artificial Intelligence", "Social Impact", "Real Estate",
    "E-commerce", "Blockchain", "Strategy"
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialUser }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<User>(initialUser);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [isReadingFile, setIsReadingFile] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const interestsContainerRef = useRef<HTMLDivElement>(null);

    // Prioritize User's own interests at the top of the list
    const displayInterests = useMemo(() => {
        // Using Set to remove duplicates, but putting user interests first
        return Array.from(new Set([...formData.interests, ...PREDEFINED_INTERESTS]));
    }, [formData.interests]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(formData);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const updateField = (field: keyof User, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayItem = (field: 'interests' | 'coreCompetencies' | 'softSkills', item: string) => {
        setFormData(prev => {
            const current = prev[field];
            const exists = current.includes(item);
            if (exists) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            } else {
                // Add new items to start of array
                return { ...prev, [field]: [item, ...current] }; 
            }
        });
        
        // Scroll to top to see new addition if adding
        if (!formData[field].includes(item) && interestsContainerRef.current) {
             setTimeout(() => {
                 if (interestsContainerRef.current) {
                    interestsContainerRef.current.scrollTop = 0;
                 }
             }, 50);
        }
    };
    
    const toggleWorkStyle = (style: string) => {
        setFormData(prev => {
             const current = prev.workStyle.split(', ').filter(Boolean);
             const exists = current.includes(style);
             let newStyles;
             if (exists) {
                 newStyles = current.filter(s => s !== style);
             } else {
                 newStyles = [...current, style];
             }
             return { ...prev, workStyle: newStyles.join(', ') };
        });
    }

    const toggleProvider = (provider: string) => {
        setFormData(prev => {
            const current = prev.connectedProviders;
            const updated = current.includes(provider) 
                ? current.filter(p => p !== provider)
                : [...current, provider];
            return { ...prev, connectedProviders: updated };
        });
    };

    const readPdf = async (file: File): Promise<string> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map((item: any) => item.str).join(' ');
                fullText += pageText + '\n\n';
            }
            return fullText;
        } catch (err) {
            console.error("PDF Parsing failed", err);
            return "";
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCvFile(file);
        setIsReadingFile(true);
        let text = '';

        if (file.type === 'application/pdf') {
            text = await readPdf(file);
        } else {
            text = await file.text();
        }
        
        updateField('cv', text);
        setIsReadingFile(false);
        
        // Smart Extraction
        if (text.length > 50) {
            setIsAnalyzing(true);
            const analysis = await analyzeProfileFromCV(text);
            
            setFormData(prev => {
                const newName = (prev.name === "" || prev.name === "Alex Doe") && analysis.name ? analysis.name : prev.name;
                
                // Merge interests/skills unique
                const newInterests = Array.from(new Set([...analysis.interests, ...prev.interests]));
                const newSkills = Array.from(new Set([...analysis.skills, ...prev.coreCompetencies]));
                const newWorkStyle = prev.workStyle ? prev.workStyle : analysis.workStyle;

                return {
                    ...prev,
                    name: newName,
                    interests: newInterests,
                    coreCompetencies: newSkills,
                    workStyle: newWorkStyle
                };
            });
            setIsAnalyzing(false);
        }
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    const renderStepContent = () => {
        switch (currentStep) {
            case 0: // Identity
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What should we call you?</label>
                            <input 
                                type="text" 
                                value={formData.name} 
                                onChange={e => updateField('name', e.target.value)}
                                className="w-full p-4 text-xl text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow placeholder-slate-400"
                                placeholder="Your Full Name"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                How would you describe your work style? 
                                <span className="text-xs font-normal text-slate-500 ml-2">(Select all that apply)</span>
                            </label>
                            <div className="flex flex-wrap gap-3">
                                {['Collaborative', 'Independent', 'Fast-paced', 'Methodical', 'Creative', 'Analytical', 'Leadership-focused'].map(style => (
                                    <button
                                        key={style}
                                        onClick={() => toggleWorkStyle(style)}
                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                                            formData.workStyle.includes(style)
                                            ? 'bg-primary-600 text-white border-primary-600 shadow-md scale-105'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                        }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/30">
                            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                                <span className="mr-2 text-xl">💡</span>
                                Tip: You can manually fill this, or jump to "Digital Assets" to upload your CV and let Carvis auto-fill your profile.
                            </p>
                        </div>
                    </div>
                );
            case 1: // Focus
                return (
                    <div className="space-y-6 animate-fade-in">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                What are you interested in?
                                <span className="text-xs font-normal text-slate-500 ml-2">(We'll curate jobs based on this)</span>
                            </label>
                            
                             <div ref={interestsContainerRef} className="flex flex-wrap gap-2 mb-4 max-h-48 overflow-y-auto p-1 border border-transparent rounded-md">
                                {displayInterests.map((interest) => (
                                     <button
                                        key={interest}
                                        onClick={() => toggleArrayItem('interests', interest)}
                                        className={`px-3 py-1.5 rounded-md text-sm transition-all border flex items-center space-x-1 ${
                                            formData.interests.includes(interest)
                                            ? 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-700 font-semibold shadow-sm'
                                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {formData.interests.includes(interest) && <span>✓</span>}
                                        <span>{interest}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <input 
                                    type="text" 
                                    onKeyDown={e => { 
                                        if (e.key === 'Enter') { 
                                            e.preventDefault();
                                            if (e.currentTarget.value.trim()) {
                                                toggleArrayItem('interests', e.currentTarget.value.trim()); 
                                                e.currentTarget.value = ''; 
                                            }
                                        }
                                    }}
                                    className="w-full p-3 pl-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-slate-400"
                                    placeholder="Type a custom interest and hit Enter..."
                                />
                                <div className="absolute right-3 top-3 text-xs text-slate-400 hidden sm:block">Press Enter to add</div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">What is your main career aspiration?</label>
                            <textarea 
                                value={formData.aspirations} 
                                onChange={e => updateField('aspirations', e.target.value)}
                                className="w-full p-3 h-32 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none placeholder-slate-400"
                                placeholder="e.g. Seeking a product management role in a fast-growing tech company where I can use my data skills..."
                            />
                        </div>
                    </div>
                );
            case 2: // Assets (CV & Connect)
                return (
                    <div className="space-y-8 animate-fade-in">
                        {/* Connection Hub */}
                        <div>
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Connect your ecosystem</label>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button 
                                    onClick={() => toggleProvider('google')}
                                    className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                        formData.connectedProviders.includes('google')
                                        ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/></svg>
                                    {formData.connectedProviders.includes('google') ? 'Google Connected' : 'Connect Google'}
                                </button>
                                <button 
                                     onClick={() => toggleProvider('microsoft')}
                                     className={`flex items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                        formData.connectedProviders.includes('microsoft')
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 shadow-sm'
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23"><path fill="#f25022" d="M1 1h10v10H1z"/><path fill="#00a4ef" d="M1 12h10v10H1z"/><path fill="#7fba00" d="M12 1h10v10H12z"/><path fill="#ffb900" d="M12 12h10v10H12z"/></svg>
                                    {formData.connectedProviders.includes('microsoft') ? 'Microsoft Connected' : 'Connect Microsoft'}
                                </button>
                             </div>
                             <p className="text-xs text-slate-500 mt-2 ml-1 flex items-center">
                                 <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 We scan subject lines to auto-track application statuses. Secure & Read-only.
                            </p>
                        </div>

                        {/* CV Upload */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Upload your CV / Resume</label>
                             <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                             >
                                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.txt,.md" />
                                 {isReadingFile ? (
                                     <div className="flex flex-col items-center justify-center space-y-2">
                                         <LoadingSpinner />
                                         <span className="text-slate-500">Parsing document structure...</span>
                                     </div>
                                 ) : isAnalyzing ? (
                                     <div className="flex flex-col items-center justify-center space-y-2">
                                         <div className="w-8 h-8 relative">
                                            <div className="absolute inset-0 bg-primary-400 rounded-full animate-ping opacity-25"></div>
                                            <div className="relative flex items-center justify-center w-full h-full">
                                                <span className="text-lg">🧠</span>
                                            </div>
                                         </div>
                                         <span className="text-primary-600 font-semibold">Analyzing your DNA...</span>
                                         <span className="text-xs text-slate-400">Extracting skills, name, and style.</span>
                                     </div>
                                 ) : cvFile ? (
                                     <div className="text-green-600 font-semibold flex flex-col items-center justify-center">
                                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                         <span>{cvFile.name} uploaded successfully!</span>
                                         <span className="text-xs text-slate-500 mt-1">We've extracted your experience for the AI.</span>
                                     </div>
                                 ) : (
                                     <>
                                        <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium">Click to upload PDF or Text file</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll parse this into memory to tailor your applications.</p>
                                     </>
                                 )}
                             </div>
                             
                             <div className="mt-4">
                                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Or paste text directly:</p>
                                <textarea 
                                    value={formData.cv} 
                                    onChange={e => updateField('cv', e.target.value)}
                                    className="w-full p-3 h-24 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-xs placeholder-slate-400"
                                    placeholder="Paste your CV text here if you don't have a file ready..."
                                />
                             </div>
                        </div>
                    </div>
                );
            case 3: // Voice (Cover Letter)
                return (
                     <div className="space-y-6 animate-fade-in">
                         <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Base Cover Letter Draft</label>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Don't worry about being perfect. Just paste a generic cover letter here once. 
                                <br/><span className="text-primary-600 dark:text-primary-400 font-semibold">We will automatically rewrite this for every single job you apply to.</span>
                            </p>
                            <textarea 
                                value={formData.coverLetter} 
                                onChange={e => updateField('coverLetter', e.target.value)}
                                className="w-full p-4 h-64 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm leading-relaxed placeholder-slate-400"
                                placeholder="Dear Hiring Manager, I am writing to express my interest in..."
                            />
                        </div>
                        <div className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30">
                             <div className="mr-3 text-2xl">🚀</div>
                             <div>
                                 <h4 className="font-bold text-green-800 dark:text-green-300 text-sm">You're all set!</h4>
                                 <p className="text-xs text-green-700 dark:text-green-400">Your profile is loaded into memory. The AI is ready to start hunting.</p>
                             </div>
                        </div>
                     </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="max-w-2xl w-full">
                {/* Header Logo */}
                <div className="flex justify-center mb-8 animate-fade-in-down">
                     <div className="flex items-center space-x-3">
                        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-600 dark:text-primary-400">
                            <path d="M16 2L20 12L30 16L20 20L16 30L12 20L2 16L12 12L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="16" cy="16" r="3" fill="currentColor"/>
                        </svg>
                        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-wide font-display lowercase">carvis</h1>
                    </div>
                </div>

                <Card className="border-0 shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 transition-all duration-300">
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 mb-8 rounded-full overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    {/* Step Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 font-display">{STEPS[currentStep].title}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{STEPS[currentStep].subtitle}</p>
                    </div>

                    {/* Content */}
                    <div className="min-h-[300px]">
                        {renderStepContent()}
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50">
                        <button 
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`px-6 py-2.5 rounded-lg font-semibold transition-colors ${
                                currentStep === 0 
                                ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' 
                                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                            }`}
                        >
                            Back
                        </button>
                        <button 
                            onClick={handleNext}
                            disabled={isReadingFile || isAnalyzing}
                            className="px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-600/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? 'Analyzing...' : currentStep === STEPS.length - 1 ? "Launch Carvis" : "Continue"}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Onboarding;
