
import React from 'react';
import { AppNotification } from '../types';

interface NotificationManagerProps {
    notifications: AppNotification[];
    onDismiss: (id: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, onDismiss }) => {
    if (notifications.length === 0) {
        return null;
    }

    const getIcon = (type: 'warning' | 'info' | 'error' | 'success') => {
        if (type === 'error') {
             return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        if (type === 'warning') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            );
        }
        if (type === 'success') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const baseClasses = "border-l-4 p-4 rounded-md mb-4 flex items-start shadow-lg dark:shadow-none";
    const typeClasses = {
        warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 text-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 text-blue-800 dark:text-blue-200',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-400 text-red-800 dark:text-red-200',
        success: 'bg-green-50 dark:bg-green-900/20 border-green-400 text-green-800 dark:text-green-200'
    };

    return (
        <div className="space-y-4">
            {notifications.map(notification => (
                <div key={notification.id} className={`${baseClasses} ${typeClasses[notification.type]}`} role="alert">
                    <div className="flex-shrink-0">
                        {getIcon(notification.type)}
                    </div>
                    <div className="ml-3 flex-grow">
                        <p className="text-sm font-medium">{notification.message}</p>
                        {notification.action && (
                            <button
                                onClick={notification.action.onClick}
                                className={`mt-3 text-xs font-bold uppercase tracking-wide border rounded px-3 py-1.5 transition-colors shadow-sm
                                    ${notification.type === 'error' 
                                        ? 'border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-100 dark:hover:bg-red-800' 
                                        : notification.type === 'warning'
                                            ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-100 dark:hover:bg-yellow-800'
                                            : notification.type === 'success'
                                                ? 'border-green-300 text-green-700 hover:bg-green-100 dark:border-green-700 dark:text-green-100 dark:hover:bg-green-800'
                                                : 'border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-100 dark:hover:bg-blue-800'
                                    }
                                `}
                            >
                                {notification.action.label}
                            </button>
                        )}
                    </div>
                    <div className="ml-auto pl-3">
                         <button
                            onClick={() => onDismiss(notification.id)}
                            className={`-mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-offset-2 inline-flex transition-colors 
                                ${notification.type === 'error' 
                                    ? 'text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30' 
                                    : notification.type === 'warning' 
                                        ? 'text-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' 
                                        : notification.type === 'success'
                                            ? 'text-green-500 hover:bg-green-100 dark:hover:bg-green-900/30'
                                            : 'text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                }`}
                            aria-label="Dismiss"
                        >
                            <span className="sr-only">Dismiss</span>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NotificationManager;
