/**
 * AvatarControls Component
 * Control panel for D-ID Avatar management
 */

import React from 'react';

const AvatarControls = ({ 
  onRestart,
  onClearQueue,
  onClearChat,
  isReady,
  hasQueue,
  theme = 'teal',
  className = ''
}) => {
  const themeClasses = {
    teal: {
      button: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500',
      buttonSecondary: 'bg-teal-100 hover:bg-teal-200 text-teal-700 focus:ring-teal-500',
      buttonDanger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      disabled: 'bg-gray-300 text-gray-500'
    },
    navy: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      buttonSecondary: 'bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-500',
      buttonDanger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      disabled: 'bg-gray-300 text-gray-500'
    },
    gray: {
      button: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500',
      buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500',
      buttonDanger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      disabled: 'bg-gray-300 text-gray-500'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.teal;

  const buttonBaseClass = "px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

  return (
    <div className={`avatar-controls flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Restart Button */}
      <button
        onClick={onRestart}
        className={`${buttonBaseClass} ${currentTheme.button} text-white`}
        title="Restart Avatar"
      >
        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Restart
      </button>

      {/* Clear Queue Button */}
      <button
        onClick={onClearQueue}
        disabled={!hasQueue}
        className={`${buttonBaseClass} ${
          hasQueue ? currentTheme.buttonSecondary : currentTheme.disabled
        }`}
        title="Clear Message Queue"
      >
        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Clear Queue
      </button>

      {/* Clear Chat Button */}
      <button
        onClick={onClearChat}
        className={`${buttonBaseClass} ${currentTheme.buttonSecondary}`}
        title="Clear Chat History"
      >
        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        Clear Chat
      </button>

      {/* Status Indicator */}
      <div className="flex items-center ml-auto">
        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isReady 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <div className={`w-2 h-2 rounded-full mr-1 ${
            isReady ? 'bg-green-400' : 'bg-yellow-400'
          }`}></div>
          {isReady ? 'Ready' : 'Not Ready'}
        </div>
      </div>
    </div>
  );
};

export default AvatarControls;