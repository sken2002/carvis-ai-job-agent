
import React, { useState, useEffect } from 'react';
import { Job, User } from '../types';
import Card from './common/Card';
import { tailorCV, tailorCoverLetter, generateInterviewTips } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import MarkdownRenderer from './common/MarkdownRenderer';
import BackButton from './common/BackButton';

interface ApplicationAssistantProps {
  job: Job;
  user: User;
  onApply: () => void;
  isApplied: boolean;
  onBack: () => void;
}

const ResultSection: React.FC<{ content: string; loading: boolean; title: string; buttonLabel: string; onGenerate: () => void }> = ({ content, loading, title, buttonLabel, onGenerate }) => {
    const [copyLabel, setCopyLabel] = useState('Copy to Clipboard');

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopyLabel('Copied!');
            setTimeout(() => setCopyLabel('Copy to Clipboard'), 2000);
        });
    }

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                 <h4 className="text-lg font-bold text-slate-800 dark:text-slate-200">{title}</h4>
                 <div className="flex space-x-3">
                    {content && !loading && (
                        <button
                            onClick={handleCopy}
                            className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white flex items-center px-3 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            {copyLabel}
                        </button>
                    )}
                     <button 
                        onClick={onGenerate} 
                        disabled={loading} 
                        className="text-sm font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 disabled:opacity-50 border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded transition-colors"
                    >
                        {loading ? "Generating..." : content ? "Regenerate" : buttonLabel}
                    </button>
                 </div>
            </div>
            
            <div className="p-6 min-h-[100px]">
                {loading ? (
                    <div className="flex justify-center items-center h-20">
                         <LoadingSpinner className="w-6 h-6" />
                         <span className="ml-3 text-slate-500 text-sm">AI is refining your content...</span>
                    </div>
                ) : content ? (
                    <div className="relative group">
                         <MarkdownRenderer content={content} />
                    </div>
                ) : (
                    <div className="text-center text-slate-400 text-sm italic py-4">
                        Click "{buttonLabel}" to generate tailored content.
                    </div>
                )}
            </div>
        </div>
    )
}

const ApplicationAssistant: React.FC<ApplicationAssistantProps> = ({ job, user, onApply, isApplied, onBack }) => {
  const [tailoredCv, setTailoredCv] = useState('');
  const [loadingCv, setLoadingCv] = useState(false);
  const [tailoredCoverLetter, setTailoredCoverLetter] = useState('');
  const [loadingCoverLetter, setLoadingCoverLetter] = useState(false);
  const [interviewTips, setInterviewTips] = useState('');
  const [loadingTips, setLoadingTips] = useState(false);

  const handleTailorCv = async () => {
    setLoadingCv(true);
    setTailoredCv('');
    const result = await tailorCV(user.cv, job);
    setTailoredCv(result);
    setLoadingCv(false);
  };
  
  const handleTailorCoverLetter = async () => {
    setLoadingCoverLetter(true);
    setTailoredCoverLetter('');
    const result = await tailorCoverLetter(user.coverLetter, user, job);
    setTailoredCoverLetter(result);
    setLoadingCoverLetter(false);
  };
  
  const handleGetTips = async () => {
    setLoadingTips(true);
    setInterviewTips('');
    const result = await generateInterviewTips(user, job);
    setInterviewTips(result);
    setLoadingTips(false);
  };

  return (
    <div className="space-y-8 pb-12">
        <div>
            <BackButton onClick={onBack} text="Back to Job Details"/>
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mt-2">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Application Assistant</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-300 mt-1">Targeting: <span className="font-semibold text-primary-600 dark:text-primary-400">{job.title}</span> at {job.company}</p>
                </div>
                <div className="flex space-x-3">
                    <a href={job.url} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        View Job Post
                    </a>
                     <button 
                        onClick={onApply}
                        disabled={isApplied}
                        className="px-5 py-2 bg-green-600 text-white font-bold rounded-lg shadow-md hover:bg-green-700 transition-colors disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed"
                    >
                        {isApplied ? 'Tracked' : 'Mark as Applied'}
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
            {/* CV Section */}
            <ResultSection 
                title="Top 5 CV Improvements" 
                buttonLabel="Analyze CV" 
                loading={loadingCv} 
                content={tailoredCv} 
                onGenerate={handleTailorCv} 
            />

            {/* Cover Letter Section */}
            <ResultSection 
                title="Tailored Cover Letter Draft" 
                buttonLabel="Rewrite Cover Letter" 
                loading={loadingCoverLetter} 
                content={tailoredCoverLetter} 
                onGenerate={handleTailorCoverLetter} 
            />

            {/* Interview Prep Section */}
            <ResultSection 
                title="Interview Cheat Sheet" 
                buttonLabel="Generate Prep Sheet" 
                loading={loadingTips} 
                content={interviewTips} 
                onGenerate={handleGetTips} 
            />
        </div>
    </div>
  );
};

export default ApplicationAssistant;
