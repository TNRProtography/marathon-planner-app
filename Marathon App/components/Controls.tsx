
import React from 'react';
import { ViewMode } from '../types';

interface ControlsProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onAddActivity: () => void;
  onSuggestPlan: () => void;
  isSuggestingPlan: boolean;
  onSetGoals: () => void; // New prop to handle navigation to goal settings
}

const Controls: React.FC<ControlsProps> = ({ currentView, onViewChange, onAddActivity, onSuggestPlan, isSuggestingPlan, onSetGoals }) => {
  const commonButtonStyles = "px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition-colors duration-150 ease-in-out";
  const activeButtonStyles = "bg-sky-600 text-white hover:bg-sky-700";
  const inactiveButtonStyles = "bg-slate-700 text-slate-300 hover:bg-slate-600";

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-slate-800/50 rounded-xl shadow-lg border border-slate-700">
      <div className="flex flex-wrap gap-2" role="group" aria-label="View mode and actions">
        <button
          onClick={() => onViewChange('calendar')}
          className={`${commonButtonStyles} ${currentView === 'calendar' ? activeButtonStyles : inactiveButtonStyles}`}
          aria-pressed={currentView === 'calendar'}
        >
          Calendar View
        </button>
        <button
          onClick={() => onViewChange('schedule')}
          className={`${commonButtonStyles} ${currentView === 'schedule' ? activeButtonStyles : inactiveButtonStyles}`}
          aria-pressed={currentView === 'schedule'}
        >
          Schedule View
        </button>
        <button
          onClick={onSetGoals}
          className={`${commonButtonStyles} bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2 inline">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 3l-1.5-1.5M3.75 3h16.5M12 3c0 1.657-1.343 3-3 3S6 4.657 6 3m12 0c0 1.657-1.343 3-3 3s-3-1.657-3-3m6 0h-6" />
             <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
          Set Goals
        </button>
      </div>
      <div className="flex space-x-2">
        <button
          onClick={onSuggestPlan}
          disabled={isSuggestingPlan}
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-purple-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSuggestingPlan ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Suggesting...
            </>
          ) : (
            <>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 13.75M17 10.25l1.25-1.75M17 10.25V7.5M17 10.25H19.5M12 1.25C12 2.05 11.35 2.75 10.5 2.75C9.65 2.75 9 2.05 9 1.25C9 0.45 9.65 0 10.5 0C11.35 0 12 0.45 12 1.25z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.75C12 21.95 11.35 21.25 10.5 21.25C9.65 21.25 9 21.95 9 22.75C9 23.55 9.65 24 10.5 24C11.35 24 12 23.55 12 22.75z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.508 2.006a1 1 0 00-1.016.017L1.25 10.25l1.004 1.004 2.846.813a4.5 4.5 0 003.09 3.09l.813 2.846 1.004 1.004L15.508 2.006zM15.508 2.006L13.75 3M15.508 2.006L17 3.75M13.75 3l1.758-1.994M13.75 3H11M17 3.75l1.758-1.994M17 3.75H14.25" />
          </svg>
              Suggest Weekly Plan
            </>
          )}
        </button>
        <button
          onClick={onAddActivity}
          className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500 transition-all duration-150 ease-in-out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Manual Activity
        </button>
      </div>
    </div>
  );
};

export default Controls;
