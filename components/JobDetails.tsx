
import React, { useState, useEffect } from 'react';
import { Job, User } from '../types';
import { enrichJobDetails } from '../services/geminiService';
import Card from './common/Card';
import LoadingSpinner from './common/LoadingSpinner';
import AlumniConnect from './AlumniConnect';
import BackButton from './common/BackButton';
import MarkdownRenderer from './common/MarkdownRenderer';

interface JobDetailsProps {
  job: Job;
  user: User;
  onStartApplication: () => void;
  isApplied: boolean;
  onBack: () => void;
}

const JobDetails: React.FC<JobDetailsProps> = ({ job, user, onStartApplication, isApplied, onBack }) => {
  const [enrichedData, setEnrichedData] = useState<Partial<Job> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (job) {
        setLoading(true);
        try {
          const details = await enrichJobDetails(job);
          setEnrichedData(details);
        } catch (error) {
          console.error("Failed to enrich job details:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchDetails();
  }, [job]);

  return (
    <div className="space-y-6">
      <BackButton onClick={onBack} text="Back to Jobs"/>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50">{job.title}</h2>
          <p className="text-xl text-slate-700 dark:text-slate-300">{job.company} - {job.location}</p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
            {job.status === 'Open' && (
                <button 
                    onClick={onStartApplication} 
                    className="px-6 py-3 bg-primary-600 text-white font-bold rounded-lg shadow-md hover:bg-primary-700 transition-transform hover:scale-105"
                >
                    {isApplied ? 'View Application' : 'Apply Now'}
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Job Description">
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{job.description}</p>
          </Card>
          
          {loading ? (
            <Card>
              <div className="flex items-center justify-center p-8">
                <LoadingSpinner />
                <span className="ml-4 text-slate-600 dark:text-slate-400">Fetching company insights...</span>
              </div>
            </Card>
          ) : (
            enrichedData && (
              <>
                <Card title="About the Company">
                  <MarkdownRenderer content={enrichedData.companyInfo || ''} />
                </Card>
                <Card title="Recent Company News">
                  <MarkdownRenderer content={enrichedData.companyNews || ''} />
                </Card>
                <Card title="Industry News">
                   <MarkdownRenderer content={enrichedData.industryNews || ''} />
                </Card>
              </>
            )
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
            <Card title="Key Information">
              <ul className="space-y-2 text-slate-700 dark:text-slate-300">
                <li><strong>Tenure:</strong> {job.tenure}</li>
                <li><strong>Application Deadline:</strong> {job.deadline}</li>
                <li><strong>Recruiter Contact:</strong> {loading ? <span className="text-slate-400 text-sm italic">Fetching...</span> : (enrichedData?.recruiterContact || 'Not available')}</li>
              </ul>
            </Card>
            <AlumniConnect job={job} user={user} />
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
