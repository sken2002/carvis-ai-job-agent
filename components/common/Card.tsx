import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, title, className = '' }) => {
  return (
    <div className={`relative bg-white dark:bg-slate-800 shadow-md dark:border dark:border-slate-700 rounded-lg overflow-hidden ${className}`}>
      {title && (
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className="p-4 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default Card;