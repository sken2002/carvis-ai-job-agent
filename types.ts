
export enum View {
  Profile,
  Jobs,
  JobDetails,
  Apply,
  Pinboard,
}

// Interface for a single Pinboard item
export interface Pin {
  id: string;
  title: string;
  content: string;
}

export interface AppNotification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NetworkContact {
  id: string;
  name: string;
  company: string;
  role: string;
  dateContacted: string;
  event: string; // Added event field
  notes: string;
}

export interface KeyAchievement {
  description: string;
  metric: string;
}

export interface User {
  name: string;
  interests: string[];
  aspirations: string;
  cv: string;
  coverLetter: string;
  pins: Pin[];
  networkContacts: NetworkContact[];
  coreCompetencies: string[];
  softSkills: string[];
  keyAchievements: KeyAchievement[];
  workStyle: string;
  personalNarrative: string;
  // Updated for multiple connections
  connectedProviders: string[]; 
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  skills: string[];
  tenure: string;
  visa: string;
  deadline: string;
  url?: string;
  companyInfo?: string;
  industryNews?: string;
  companyNews?: string;
  industry?: string;
  mode?: 'On-site' | 'Hybrid' | 'Remote';
  status?: 'Open' | 'Closed';
  applicationStatus?: 'Applied' | 'In Progress' | 'Not Applied' | 'Interview' | 'Offer' | 'Rejected';
  recruiterContact?: string;
  isExternal?: boolean;
  stage?: string;
  dateApplied?: string;
}

export interface Alum {
  id: string;
  name: string;
  role: string;
  company: string;
}

// New Types for Mission Control
export interface Mission {
    id: string;
    title: string;
    description: string;
    current: number;
    target: number;
    type: 'network' | 'apply' | 'learn' | 'outreach';
    icon: string;
}

export interface MissionState {
    streak: number;
    isWeekCompleted: boolean;
    lastCompletedDate: string | null;
    missions: Mission[];
}
