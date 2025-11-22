import React, { useState, useEffect } from 'react';
import { Job, User, Alum } from '../types';
import { findAlumni, generateOutreachMessage } from '../services/geminiService';
import Card from './common/Card';
import LoadingSpinner from './common/LoadingSpinner';

interface AlumniConnectProps {
  job: Job;
  user: User;
}

const AlumniConnect: React.FC<AlumniConnectProps> = ({ job, user }) => {
  const [alumni, setAlumni] = useState<Alum[]>([]);
  const [loadingAlumni, setLoadingAlumni] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [selectedAlum, setSelectedAlum] = useState<Alum | null>(null);

  useEffect(() => {
    const fetchAlumni = async () => {
      setLoadingAlumni(true);
      try {
        const foundAlumni = await findAlumni(job);
        setAlumni(foundAlumni);
      } catch (error) {
        console.error("Failed to find alumni:", error);
      } finally {
        setLoadingAlumni(false);
      }
    };
    fetchAlumni();
  }, [job]);

  const handleGenerateMessage = async (alum: Alum) => {
    setSelectedAlum(alum);
    setLoadingMessage(true);
    setMessage(null);
    try {
      const generatedMessage = await generateOutreachMessage(user, alum);
      setMessage(generatedMessage);
    } catch (error) {
      setMessage("Could not generate message. Please try again.");
    } finally {
      setLoadingMessage(false);
    }
  };

  return (
    <Card title="LBS Alumni Connect">
      {loadingAlumni ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-4">
          {alumni.map(alum => (
            <div key={alum.id}>
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <p className="font-semibold text-slate-800 dark:text-slate-200">{alum.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{alum.role}</p>
                <button
                  onClick={() => handleGenerateMessage(alum)}
                  className="mt-2 text-sm text-primary-600 dark:text-primary-400 font-semibold hover:underline"
                  disabled={loadingMessage && selectedAlum?.id === alum.id}
                >
                  {loadingMessage && selectedAlum?.id === alum.id ? 'Generating...' : 'Draft Outreach Message'}
                </button>
              </div>
              {selectedAlum?.id === alum.id && (loadingMessage || message) && (
                <div className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                  {loadingMessage ? (
                    <div className="flex justify-center items-center">
                        <LoadingSpinner className="w-4 h-4" />
                        <span className="ml-2 text-sm text-slate-600 dark:text-slate-300">Drafting...</span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{message}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
          {alumni.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No alumni found at this company.</p>}
        </div>
      )}
    </Card>
  );
};

export default AlumniConnect;