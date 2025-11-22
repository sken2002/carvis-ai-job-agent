import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  text?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ onClick, text = 'Back' }) => (
  <button
    onClick={onClick}
    className="flex items-center text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
  >
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
    {text}
  </button>
);

export default BackButton;