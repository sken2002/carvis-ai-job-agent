
import React, { useState, useEffect, useMemo } from 'react';
import { Job, User } from '../types';
import LoadingSpinner from './common/LoadingSpinner';
import Card from './common/Card';

interface JobBoardProps {
  onSelectJob: (job: Job) => void;
  user: User;
  curatedJobs: Job[];
  allJobs: Job[];
  loading: boolean;
  error: string | null;
  appliedJobIds: Set<string>;
  onStartApplication: (job: Job) => void;
  onDebugSetDeadline: (jobId: string, daysRemaining: number) => void;
}

const calculateMatchScore = (job: Job, user: User): number => {
    const jobText = (job.title + " " + job.description + " " + job.industry).toLowerCase();
    const userKeywords = [
        ...user.interests,
        ...user.coreCompetencies,
        ...user.softSkills,
        ...(user.aspirations ? user.aspirations.split(' ') : [])
    ].map(k => k.toLowerCase());

    let hits = 0;
    const uniqueKeywords = new Set(userKeywords);
    uniqueKeywords.forEach(keyword => {
        if (keyword.length > 3 && jobText.includes(keyword)) {
            hits++;
        }
    });

    // Simple heuristic: base score 50 + hits. Max 98.
    const score = Math.min(98, 50 + (hits * 5));
    return score;
};

const JobCard: React.FC<{ 
    job: Job; 
    onSelectJob: (job: Job) => void; 
    isApplied: boolean; 
    onStartApplication: (job: Job) => void;
    onDebugSetDeadline: (jobId: string, daysRemaining: number) => void;
    matchScore: number;
}> = ({ job, onSelectJob, isApplied, onStartApplication, onDebugSetDeadline, matchScore }) => (
    <Card className="hover:shadow-lg transition-shadow duration-300 hover:-translate-y-1 flex flex-col relative overflow-visible">
        {isApplied && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full dark:bg-green-900 dark:text-green-200 z-10">
                Applied
            </div>
        )}
        {!isApplied && matchScore > 75 && (
             <div className="absolute top-2 right-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-full dark:bg-indigo-900 dark:text-indigo-200 z-10 border border-indigo-200 dark:border-indigo-700">
                {matchScore}% Match
            </div>
        )}

        <div className="flex-grow">
            <h3 className="text-xl font-bold text-primary-700 dark:text-primary-400 pr-16">{job.title}</h3>
            <p className="text-md font-semibold text-slate-700 dark:text-slate-300">{job.company}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{job.location}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{job.description}</p>
            <p className="text-xs text-slate-500 mt-2">Deadline: {job.deadline}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center space-x-2">
            <button
                onClick={() => onSelectJob(job)}
                className="flex-1 text-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
                View Details
            </button>
            {job.status === 'Open' && (
                 <button
                    onClick={() => onStartApplication(job)}
                    className="flex-1 text-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 transition-colors"
                 >
                    {isApplied ? 'View Application' : 'Apply Now'}
                 </button>
            )}
        </div>
        {!isApplied && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Dev: Test Deadline Nudge</p>
                <div className="flex flex-wrap gap-1">
                    {[28, 21, 14, 7, 1].map(days => (
                        <button 
                            key={days}
                            onClick={(e) => { e.stopPropagation(); onDebugSetDeadline(job.id, days); }}
                            className="px-2 py-1 text-[10px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded border border-slate-300 dark:border-slate-500 transition-colors"
                        >
                            {days}d Left
                        </button>
                    ))}
                </div>
            </div>
        )}
    </Card>
);

const FilterSelect: React.FC<{ name: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: string[]; label: string; }> = ({ name, value, onChange, options, label }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        >
            <option value="">All</option>
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </div>
);


const JobBoard: React.FC<JobBoardProps> = ({ onSelectJob, user, curatedJobs, allJobs, loading, error, appliedJobIds, onStartApplication, onDebugSetDeadline }) => {
  const [filters, setFilters] = useState({
      industry: '',
      mode: '',
      visa: '',
      status: ''
  });
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const clearFilters = () => {
      setFilters({ industry: '', mode: '', visa: '', status: '' });
  }

  const filteredJobs = useMemo(() => {
      return allJobs.filter(job => {
          return (
              (filters.industry === '' || job.industry === filters.industry) &&
              (filters.mode === '' || job.mode === filters.mode) &&
              (filters.visa === '' || job.visa === filters.visa) &&
              (filters.status === '' || job.status === filters.status)
          );
      });
  }, [allJobs, filters]);

  // Extract unique options for filters
  const industries = useMemo(() => Array.from(new Set(allJobs.map(j => j.industry).filter(Boolean) as string[])), [allJobs]);
  const modes = useMemo(() => Array.from(new Set(allJobs.map(j => j.mode).filter(Boolean) as string[])), [allJobs]);
  const visas = useMemo(() => Array.from(new Set(allJobs.map(j => j.visa).filter(Boolean) as string[])), [allJobs]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LoadingSpinner className="w-12 h-12 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 text-lg animate-pulse">Curating opportunities for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800">
        <div className="text-center py-8 text-red-600 dark:text-red-400">
          <p className="font-bold text-lg mb-2">Connection Error</p>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Curated Section */}
      <div>
         <div className="flex items-center mb-6">
            <div className="w-4 h-4 bg-indigo-600 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Curated for You</h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
             {curatedJobs.map(job => (
                 <JobCard 
                    key={job.id} 
                    job={job} 
                    onSelectJob={onSelectJob} 
                    isApplied={appliedJobIds.has(job.id)} 
                    onStartApplication={onStartApplication}
                    onDebugSetDeadline={onDebugSetDeadline}
                    matchScore={calculateMatchScore(job, user)}
                />
             ))}
         </div>
      </div>

      {/* Main Job Board with Filters */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Explore All Roles</h2>
            
            <button 
                onClick={clearFilters}
                className="text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
            >
                Clear Filters
            </button>
        </div>

        <Card className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <FilterSelect name="industry" label="Industry" value={filters.industry} onChange={handleFilterChange} options={industries} />
                <FilterSelect name="mode" label="Work Mode" value={filters.mode} onChange={handleFilterChange} options={modes} />
                <FilterSelect name="visa" label="Visa Support" value={filters.visa} onChange={handleFilterChange} options={visas} />
                <FilterSelect name="status" label="Status" value={filters.status} onChange={handleFilterChange} options={['Open', 'Closed']} />
            </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map(job => (
                <JobCard 
                    key={job.id} 
                    job={job} 
                    onSelectJob={onSelectJob} 
                    isApplied={appliedJobIds.has(job.id)} 
                    onStartApplication={onStartApplication}
                    onDebugSetDeadline={onDebugSetDeadline}
                    matchScore={calculateMatchScore(job, user)}
                />
            ))}
            {filteredJobs.length === 0 && (
                <div className="col-span-full text-center py-12">
                    <p className="text-slate-500 dark:text-slate-400 text-lg">No jobs match your filters.</p>
                    <button onClick={clearFilters} className="mt-4 text-primary-600 font-bold hover:underline">Clear all filters</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default JobBoard;
