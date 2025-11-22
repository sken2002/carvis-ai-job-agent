
import React from 'react';
import { View } from '../types';

interface HeaderProps {
  onNavigate: (view: View) => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ onNavigate, theme, onThemeToggle }) => {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm sticky top-0 z-10 dark:border-b dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate(View.Jobs)}>
            {/* Minimalist Elegant North Star Logo */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-600 dark:text-primary-400">
                <path d="M16 2L20 12L30 16L20 20L16 30L12 20L2 16L12 12L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="16" cy="16" r="3" fill="currentColor"/>
            </svg>
            <div className="flex items-baseline">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-wide font-display lowercase">carvis</h1>
              <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400 tracking-widest uppercase">by LBS</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
             <nav className="hidden sm:flex space-x-2">
                <button
                    onClick={() => onNavigate(View.Jobs)}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors font-display"
                    >
                    Jobs
                </button>
                <button
                    onClick={() => onNavigate(View.Pinboard)}
                    className="px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors font-display"
                    >
                    Board
                </button>
             </nav>
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <button
                onClick={() => onNavigate(View.Profile)}
                className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-md transition-colors font-display"
                >
                Me
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
