
import React, { useState, useEffect } from 'react';
import { View, User, Job, Pin, AppNotification, NetworkContact, MissionState } from './types';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import JobBoard from './components/JobBoard';
import JobDetails from './components/JobDetails';
import ApplicationAssistant from './components/ApplicationAssistant';
import Pinboard from './components/Pinboard';
import MissionControl from './components/MissionControl';
import Onboarding from './components/Onboarding'; 
import { findCuratedJobsWithAI, findJobsWithAI, generateComfortMessage, generateStarterPins } from './services/geminiService';
import { signInWithMicrosoft, fetchRecentEmails } from './services/microsoftAuth';
import NotificationManager from './components/NotificationManager';
import LoadingSpinner from './components/common/LoadingSpinner';

const MOCK_PINS: Pin[] = [
    {
        id: 'pin-1',
        title: 'Leadership Experience Example (STAR Method)',
        content: `Situation: In my final year project, our team was falling behind schedule.\nTask: As the project lead, I needed to get us back on track.\nAction: I re-organized the work plan, assigned tasks based on strengths, and set up daily check-ins.\nResult: We successfully submitted the project on time and received the highest grade in our cohort.`
    },
    {
        id: 'pin-2',
        title: 'Stock Pitch Idea (Tech Sector)',
        content: `I am bullish on Company XYZ due to its strong position in the growing cloud computing market, recent strategic acquisitions that expand its service offerings, and a solid balance sheet. I project a 15% upside in the next 12 months.`
    },
     {
        id: 'pin-3',
        title: 'Why I am interested in FinTech',
        content: `I am passionate about FinTech because it sits at the intersection of technology and finance, two fields I am deeply interested in. I believe technology has the power to democratize financial services, making them more accessible and efficient for everyone. My goal is to contribute to innovations that shape the future of finance.`
    }
];

const MOCK_CONTACTS: NetworkContact[] = [
    {
        id: 'contact-1',
        name: 'Jane Smith',
        company: 'Google',
        role: 'Senior Product Manager',
        dateContacted: '2024-05-10',
        event: 'LBS Tech Trek 2024 (San Francisco)',
        notes: 'Met during the networking drinks after the panel on "AI for Good". She leads the Trust & Safety PM team. \n\nKey Takeaways:\n- They value "product intuition" over just technical skills for PMs.\n- Suggested I look into the Associate Product Manager (APM) rotation program opening in September.\n- Mentioned my background in ethics would be a differentiator.\n\nAction: Send follow-up email with the article we discussed about EU AI regulation.'
    },
    {
        id: 'contact-2',
        name: 'John Rogers',
        company: 'McKinsey & Company',
        role: 'Associate Partner',
        dateContacted: '2024-04-22',
        event: 'LBS Alumni Coffee Chat (London)',
        notes: 'Alumni from class of 2018. Focuses on Digital Transformation in Banking.\n\nAdvice:\n- Practice mental math for market sizing cases.\n- Read up on "Open Banking" regulations as it is a hot topic for their current clients.\n- Very down to earth, offered to do a mock case interview in July if I pass the resume screen.\n\nAction: Connected on LinkedIn. Send update when applications open.'
    },
     {
        id: 'contact-3',
        name: 'Sarah Chen',
        company: 'Goldman Sachs',
        role: 'Vice President, Fintech Investing',
        dateContacted: '2024-06-01',
        event: 'LBS Finance Club Annual Conference',
        notes: 'Panelist for "The Future of Fintech". We spoke briefly during the break.\n\nInsights:\n- They are looking heavily into blockchain infrastructure, not just crypto trading.\n- Interested in my previous project on payment gateways.\n- Told me to specifically look at the "Growth Equity" team roles in London.\n\nAction: Send a thank you note referencing her point about stablecoins.'
    }
];


const MOCK_USER: User = {
  name: "", 
  interests: [],
  aspirations: "",
  personalNarrative: "",
  coreCompetencies: [],
  softSkills: [],
  keyAchievements: [],
  workStyle: "",
  cv: "",
  coverLetter: "",
  pins: MOCK_PINS,
  networkContacts: MOCK_CONTACTS,
  connectedProviders: [],
};

// Modal Component for AI Results (Comfort/Prep/Confirmation)
const AIResultModal: React.FC<{ isOpen: boolean; onClose: () => void; content: string; title: string; actionButton?: { label: string, onClick: () => void } }> = ({ isOpen, onClose, content, title, actionButton }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative animate-fade-in border border-slate-100 dark:border-slate-700">
                <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-slate-100">{title}</h3>
                <div className="prose dark:prose-invert text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                    {content}
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                     {actionButton && (
                        <button onClick={actionButton.onClick} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold shadow-sm transition-transform active:scale-95">
                            {actionButton.label}
                        </button>
                     )}
                    <button onClick={onClose} className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 font-semibold transition-colors">
                        {actionButton ? 'Cancel' : 'Got it'}
                    </button>
                </div>
            </div>
        </div>
    );
}


const App: React.FC = () => {
  // --- State Initialization with Persistence ---
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
      const saved = localStorage.getItem('carvis_hasOnboarded');
      return saved === 'true';
  });
  
  const [user, setUser] = useState<User>(() => {
      const savedUser = localStorage.getItem('carvis_user');
      return savedUser ? JSON.parse(savedUser) : MOCK_USER;
  });

  const [currentView, setCurrentView] = useState<View>(View.Jobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Centralized state for jobs and applications
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [curatedJobs, setCuratedJobs] = useState<Job[]>([]);
  const [externalJobs, setExternalJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(() => {
      const saved = localStorage.getItem('carvis_appliedJobIds');
      return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const [applicationDates, setApplicationDates] = useState<Record<string, string>>(() => {
      const saved = localStorage.getItem('carvis_applicationDates');
      return saved ? JSON.parse(saved) : {};
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());
  
  const [followUpLog, setFollowUpLog] = useState<Record<string, string>>(() => {
      const saved = localStorage.getItem('carvis_followUpLog');
      return saved ? JSON.parse(saved) : {};
  });

  // Mission State
  const [missionState, setMissionState] = useState<MissionState>({
      streak: 1,
      isWeekCompleted: false,
      lastCompletedDate: null,
      missions: [
          { id: 'm1', title: 'The Network Weaver', description: 'Connect with 3 Alumni via the Job Details page.', current: 0, target: 3, type: 'network', icon: '🤝' },
          { id: 'm2', title: 'Application Sprint', description: 'Submit applications for 5 new roles.', current: 0, target: 5, type: 'apply', icon: '🚀' },
          { id: 'm3', title: 'Maintenance Check', description: 'Review 3 applied roles that are over 7 days old.', current: 0, target: 3, type: 'learn', icon: '📋' },
          { id: 'm4', title: 'Knowledge Base', description: 'Save 2 new answers to your Pinboard.', current: 0, target: 2, type: 'learn', icon: '🧠' }
      ]
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalAction, setModalAction] = useState<{label: string, onClick: () => void} | undefined>(undefined);


  // --- Effects for Persistence ---
  useEffect(() => {
      localStorage.setItem('carvis_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
      localStorage.setItem('carvis_hasOnboarded', String(hasOnboarded));
  }, [hasOnboarded]);

  useEffect(() => {
      localStorage.setItem('carvis_appliedJobIds', JSON.stringify(Array.from(appliedJobIds)));
  }, [appliedJobIds]);

  useEffect(() => {
      localStorage.setItem('carvis_applicationDates', JSON.stringify(applicationDates));
  }, [applicationDates]);

  useEffect(() => {
      localStorage.setItem('carvis_followUpLog', JSON.stringify(followUpLog));
  }, [followUpLog]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  // Notification Logic
  useEffect(() => {
    if (!hasOnboarded) return;

    const newNotifications: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Deadline Nudging
    curatedJobs.forEach(job => {
        if (!job.deadline || job.deadline === "Varies" || appliedJobIds.has(job.id)) return;
        
        const deadlineDate = new Date(job.deadline);
        deadlineDate.setHours(0, 0, 0, 0);
        
        const diffTime = deadlineDate.getTime() - today.getTime();
        const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const deadlineMilestones = [1, 7, 14, 21, 28];
        const activeMilestone = deadlineMilestones.find(m => daysUntil <= m && daysUntil > 0);
        
        if (activeMilestone) {
             let isValidBracket = false;
             if (activeMilestone === 28 && daysUntil > 21) isValidBracket = true;
             else if (activeMilestone === 21 && daysUntil > 14) isValidBracket = true;
             else if (activeMilestone === 14 && daysUntil > 7) isValidBracket = true;
             else if (activeMilestone === 7 && daysUntil > 1) isValidBracket = true;
             else if (activeMilestone === 1 && daysUntil <= 1) isValidBracket = true;

             if (isValidBracket) {
                const id = `deadline-${job.id}-${activeMilestone}`;
                if (!dismissedNotificationIds.has(id)) {
                    let type: 'info' | 'warning' | 'error' = 'info';
                    let message = '';

                    switch (activeMilestone) {
                        case 28:
                            type = 'info';
                            message = `Heads up! Applications for ${job.company} close in about 4 weeks (${job.deadline}).`;
                            break;
                        case 21:
                            type = 'info';
                            message = `3 weeks left to apply for the ${job.title} role at ${job.company}.`;
                            break;
                        case 14:
                            type = 'warning';
                            message = `Only 2 weeks remaining for the ${job.company} application. Don't delay!`;
                            break;
                        case 7:
                            type = 'warning';
                            message = `One week left! Finalize your application for ${job.company} soon.`;
                            break;
                        case 1:
                            type = 'error';
                            message = `URGENT: ${job.company} applications close tomorrow! Apply now or miss out.`;
                            break;
                    }

                    newNotifications.push({ id, type, message });
                }
             }
        }
    });

    // 2. Application Follow-up
    const appliedJobs = [...allJobs, ...curatedJobs, ...externalJobs].filter(j => appliedJobIds.has(j.id));
    
    appliedJobs.forEach(job => {
        if (followUpLog[job.id]) return; // Skip if already followed up

        const dateString = applicationDates[job.id]; // Prefer internal application date
        const appliedDate = dateString ? new Date(dateString) : (job.dateApplied ? new Date(job.dateApplied) : null);
        
        if (!appliedDate) return;
        appliedDate.setHours(0, 0, 0, 0);
        
        const diffTime = Math.abs(today.getTime() - appliedDate.getTime());
        const daysAgo = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const followUpMilestones = [28, 21, 14, 7];
        const currentMilestone = followUpMilestones.find(m => daysAgo >= m);

        if (currentMilestone) {
            const id = `followup-${job.id}-${currentMilestone}`;
            
            if (!dismissedNotificationIds.has(id)) {
                let message = "";
                let type: 'info' | 'warning' | 'error' = 'info';

                if (currentMilestone === 7) {
                    message = `It's been 1 week since you applied to ${job.company}. Consider sending a polite follow-up.`;
                    type = 'info';
                } else if (currentMilestone === 14) {
                    message = `2 weeks have passed for your ${job.company} application. A follow-up now shows persistence.`;
                    type = 'info';
                } else if (currentMilestone === 21) {
                    message = `3 weeks since applying to ${job.company}. Don't let your application go cold!`;
                    type = 'warning';
                } else if (currentMilestone === 28) {
                    message = `It's been 4 weeks. If you haven't heard from ${job.company}, it's time for a final check-in.`;
                    type = 'error';
                }

                newNotifications.push({
                    id,
                    type,
                    message,
                    action: {
                        label: "I've Followed Up",
                        onClick: () => {
                             // Trigger "Really?" confirmation
                             setModalTitle("Did you really?");
                             setModalContent(`Confirming you have sent a follow-up email to ${job.company}. Keeping your tracker accurate is key to success!`);
                             setModalAction({
                                 label: "Yes, I sent it!",
                                 onClick: () => {
                                     setFollowUpLog(prev => ({
                                         ...prev,
                                         [job.id]: new Date().toISOString().split('T')[0]
                                     }));
                                     handleMissionProgress('m3'); // Maintenance Check
                                     setDismissedNotificationIds(prev => new Set(prev).add(id));
                                     setNotifications(prev => prev.filter(n => n.id !== id));
                                     setModalOpen(false);
                                 }
                             });
                             setModalOpen(true);
                        }
                    }
                });
            }
        }
    });
    
    setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const merged = [...prev];
        newNotifications.forEach(n => {
            if (!existingIds.has(n.id)) merged.push(n);
        });
        return merged;
    });
  }, [curatedJobs, allJobs, externalJobs, appliedJobIds, applicationDates, dismissedNotificationIds, followUpLog, hasOnboarded]);

  // Fetch all jobs once on initial load
  useEffect(() => {
    if (!hasOnboarded) return;

    const fetchJobs = async () => {
      try {
        setJobsLoading(true);
        setJobsError(null);
        const [curated, all] = await Promise.all([
            findCuratedJobsWithAI(user),
            findJobsWithAI()
        ]);
        setCuratedJobs(curated);
        setAllJobs(all);
      } catch (err) {
        setJobsError("Failed to fetch job listings. Please try again later.");
        console.error(err);
      } finally {
        setJobsLoading(false);
      }
    };
    fetchJobs();
  }, [hasOnboarded]); 

  const handleOnboardingComplete = async (onboardedUser: User) => {
      setUser(onboardedUser);
      setHasOnboarded(true);

      // Generate Starter Pins in background
      try {
          const starterPins = await generateStarterPins(onboardedUser);
          setUser(prev => ({
              ...prev,
              pins: [...prev.pins, ...starterPins]
          }));
      } catch (e) {
          console.error("Failed to generate starter pins", e);
      }
  }

  const handleApply = (jobId: string) => {
    setAppliedJobIds(prev => new Set(prev).add(jobId));
    setApplicationDates(prev => ({
      ...prev,
      [jobId]: new Date().toISOString().split('T')[0]
    }));
    handleMissionProgress('m2');
  };

  const handleAddExternalJob = (job: Job) => {
      setExternalJobs(prev => [job, ...prev]);
      handleMissionProgress('m2');
  }

  const handleUpdateUser = (updatedUser: User) => {
      setUser(updatedUser);
  }

  const handleSimulateEmailScan = async (updateStatus: (status: string) => void) => {
    // Real Microsoft Integration Check
    const isMicrosoft = user.connectedProviders.includes('microsoft');
    
    if (isMicrosoft) {
        updateStatus("Authenticating with Microsoft...");
        const token = await signInWithMicrosoft();
        if (token) {
            updateStatus("Scanning Outlook Inbox...");
            const emails = await fetchRecentEmails(token);
            
            if (emails.length > 0) {
                // Simple keyword check logic
                const relevantEmails = emails.filter(email => {
                    const subject = email.subject.toLowerCase();
                    return subject.includes('application') || subject.includes('update') || subject.includes('interview');
                });

                if (relevantEmails.length > 0) {
                    updateStatus(`Found ${relevantEmails.length} relevant emails.`);
                    await new Promise(r => setTimeout(r, 1000));
                    
                    setNotifications(prev => [...prev, {
                        id: `ms-scan-${Date.now()}`,
                        type: 'success',
                        message: `Outlook Scan: Found an update: "${relevantEmails[0].subject}". Check your inbox!`
                    }]);
                    return; 
                } else {
                     updateStatus("No new application updates found in recent emails.");
                     await new Promise(r => setTimeout(r, 1000));
                }
            }
        } else {
            updateStatus("Authentication failed. Switching to simulation...");
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // Fallback Simulation Logic (Original)
    const internalApplied = [...allJobs, ...curatedJobs].filter(j => appliedJobIds.has(j.id));
    const trackableJobs = [...internalApplied, ...externalJobs];

    updateStatus("Connecting to secure gateway...");
    await new Promise(r => setTimeout(r, 800));

    if (trackableJobs.length === 0) {
        setNotifications(prev => [...prev, {
            id: `scan-${Date.now()}`,
            type: 'info',
            message: 'Email scan complete. No active job applications found to track.'
        }]);
        return;
    }

    // Random Event
    const randomJob = trackableJobs[Math.floor(Math.random() * trackableJobs.length)];
    const id = `email-update-${Date.now()}`;
    
    if (randomJob.applicationStatus === 'Offer' || randomJob.stage === 'Offer') return;

    const rand = Math.random();
    let outcome = 'no_update';
    if (rand > 0.6) {
        outcome = rand > 0.8 ? 'rejected' : 'next_stage';
    }

    if (outcome === 'no_update') {
         setNotifications(prev => [...prev, {
            id: `scan-${Date.now()}`,
            type: 'info',
            message: 'Email scan complete. No new updates found.'
        }]);
        return;
    }

    if (outcome === 'rejected') {
        updateStatus(`Processing update for ${randomJob.company}...`);
        const msg = await generateComfortMessage(user, randomJob.company);
        
        const notification: AppNotification = {
            id,
            type: 'warning',
            message: `Update found for ${randomJob.company}: Application Unsuccessful.`,
            action: {
                label: 'View Message',
                onClick: () => {
                    setModalTitle('Keep your head up!');
                    setModalContent(msg);
                    setModalOpen(true);
                    setModalAction(undefined);
                    setDismissedNotificationIds(prev => new Set(prev).add(id));
                    setNotifications(prev => prev.filter(n => n.id !== id));
                }
            }
        };
        setNotifications(prev => [notification, ...prev]);
    } else {
        const notification: AppNotification = {
            id,
            type: 'success',
            message: `Good news! You've advanced to the next stage at ${randomJob.company}.`,
            action: {
                label: 'Next Steps',
                onClick: () => {
                     setModalTitle(`Next Stage: ${randomJob.company}`);
                     setModalContent(`Congratulations! Based on the email, they would like to invite you to an interview.`);
                     setModalAction({
                         label: 'Prepare for Interview',
                         onClick: () => {
                             setModalOpen(false);
                             setSelectedJob(randomJob);
                             setCurrentView(View.Apply); 
                         }
                     });
                     setModalOpen(true);
                     setDismissedNotificationIds(prev => new Set(prev).add(id));
                     setNotifications(prev => prev.filter(n => n.id !== id));
                }
            }
        };
        setNotifications(prev => [notification, ...prev]);
    }
  };

  const handleDebugBackdate = (jobId: string, daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const newDateStr = date.toISOString().split('T')[0];
    
    setApplicationDates(prev => ({
      ...prev,
      [jobId]: newDateStr
    }));

    setFollowUpLog(prev => {
        const next = { ...prev };
        delete next[jobId];
        return next;
    });
    
    setDismissedNotificationIds(prev => {
        const next = new Set(prev);
        Array.from(next).forEach((id: string) => {
            if (id.startsWith(`followup-${jobId}`)) {
                next.delete(id);
            }
        });
        return next;
    });
  };

  const handleDebugSetDeadline = (jobId: string, daysRemaining: number) => {
      const date = new Date();
      date.setDate(date.getDate() + daysRemaining);
      const newDeadline = date.toISOString().split('T')[0];

      setCuratedJobs(prev => prev.map(j => j.id === jobId ? { ...j, deadline: newDeadline } : j));
      setAllJobs(prev => prev.map(j => j.id === jobId ? { ...j, deadline: newDeadline } : j));

      setDismissedNotificationIds(prev => {
          const next = new Set(prev);
          Array.from(next).forEach((id: string) => {
              if (id.startsWith(`deadline-${jobId}`)) {
                  next.delete(id);
              }
          });
          return next;
      });
  };

  // Mission Logic
  const handleMissionProgress = (missionId: string) => {
      setMissionState(prev => {
          if (prev.isWeekCompleted) return prev;
          
          const newMissions = prev.missions.map(m => {
              if (m.id === missionId && m.current < m.target) {
                  return { ...m, current: m.current + 1 };
              }
              return m;
          });

          return {
              ...prev,
              missions: newMissions
          };
      });
  }

  const handleClaimReward = () => {
      setMissionState(prev => ({
          ...prev,
          isWeekCompleted: true,
          streak: prev.streak + 1,
          lastCompletedDate: new Date().toISOString()
      }));
  }

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  const handleDismissNotification = (id: string) => {
    setDismissedNotificationIds(prev => new Set(prev).add(id));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  const navigateTo = (view: View) => {
    setCurrentView(view);
  };

  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
    setCurrentView(View.JobDetails);
  };

  const handleStartApplication = (job: Job) => {
    setSelectedJob(job);
    setCurrentView(View.Apply);
  };
  
  const handleUpdatePins = (newPins: Pin[]) => {
      setUser(prevUser => ({...prevUser, pins: newPins}));
      if(newPins.length > user.pins.length) {
          handleMissionProgress('m4'); 
      }
  }
  
  const handleUpdateContacts = (newContacts: NetworkContact[]) => {
      setUser(prevUser => ({...prevUser, networkContacts: newContacts}));
  }

  const renderContent = () => {
    const combinedJobs = [...curatedJobs, ...allJobs, ...externalJobs];

    switch (currentView) {
      case View.Profile:
        return (
            <Dashboard 
                user={user} 
                onUpdateUser={handleUpdateUser}
                jobs={combinedJobs} 
                appliedJobIds={appliedJobIds} 
                applicationDates={applicationDates} 
                onBack={() => navigateTo(View.Jobs)} 
                onDebugBackdate={handleDebugBackdate}
                onAddExternalJob={handleAddExternalJob}
                onSimulateEmailScan={handleSimulateEmailScan}
                followUpLog={followUpLog}
            />
        );
      case View.Pinboard:
        return <Pinboard 
                    pins={user.pins} 
                    onUpdatePins={handleUpdatePins} 
                    networkContacts={user.networkContacts}
                    onUpdateContacts={handleUpdateContacts}
                    onBack={() => navigateTo(View.Jobs)}
                    user={user}
                    />;
      case View.Jobs:
        return (
            <JobBoard 
                onSelectJob={handleSelectJob} 
                user={user}
                curatedJobs={curatedJobs}
                allJobs={allJobs}
                loading={jobsLoading}
                error={jobsError}
                appliedJobIds={appliedJobIds}
                onStartApplication={handleStartApplication}
                onDebugSetDeadline={handleDebugSetDeadline}
            />
        );
      case View.JobDetails:
        if (selectedJob) {
          return <JobDetails 
                    job={selectedJob} 
                    user={user} 
                    onStartApplication={() => handleStartApplication(selectedJob)}
                    isApplied={appliedJobIds.has(selectedJob.id)}
                    onBack={() => navigateTo(View.Jobs)}
                 />;
        }
        setCurrentView(View.Jobs);
        return null; 
      case View.Apply:
        if (selectedJob) {
          return <ApplicationAssistant 
                    job={selectedJob} 
                    user={user}
                    onApply={() => handleApply(selectedJob.id)}
                    isApplied={appliedJobIds.has(selectedJob.id)}
                    onBack={() => handleSelectJob(selectedJob)} 
                 />;
        }
        setCurrentView(View.Jobs);
        return null;
      default:
        return <JobBoard onSelectJob={handleSelectJob} user={user} curatedJobs={curatedJobs} allJobs={allJobs} loading={jobsLoading} error={jobsError} appliedJobIds={appliedJobIds} onStartApplication={handleStartApplication} onDebugSetDeadline={handleDebugSetDeadline} />;
    }
  };

  // If not onboarded, show onboarding screen
  if (!hasOnboarded) {
      return <Onboarding onComplete={handleOnboardingComplete} initialUser={MOCK_USER} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 relative">
      <Header onNavigate={navigateTo} theme={theme} onThemeToggle={handleThemeToggle} />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <NotificationManager notifications={notifications} onDismiss={handleDismissNotification} />
        {renderContent()}
      </main>
      
      <MissionControl 
          missionState={missionState} 
          onUpdateProgress={handleMissionProgress}
          onClaimReward={handleClaimReward}
      />

      <AIResultModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle} 
        content={modalContent} 
        actionButton={modalAction}
      />
    </div>
  );
};

export default App;
