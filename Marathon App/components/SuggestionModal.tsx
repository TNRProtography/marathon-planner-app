// components/SuggestionModal.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { SuggestedActivity, ActivityType, UserPreferencesData, Activity } from '../types'; // Make sure Activity is imported if needed, though not directly used in this file beyond props.
import UserPreferencesForm from './UserPreferencesForm';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedActivities: SuggestedActivity[];
  onAddSuggestedActivity: (activity: SuggestedActivity) => void; // This adds it directly
  error: string | null;
  isLoading: boolean;
  onFetchSuggestions: (preferences: UserPreferencesData) => Promise<void>;
  initialPreferences: UserPreferencesData;
  onClearSuggestions: () => void;
  onEditSuggestedActivity: (activity: SuggestedActivity) => void; // <-- NEW PROP
}

const activityColorStyles: Record<ActivityType, { border: string, bg: string, text: string, iconBg: string }> = {
  [ActivityType.RUN]: { border: 'border-green-500', bg: 'bg-green-700/30', text: 'text-green-300', iconBg: 'bg-green-500' },
  [ActivityType.SWIM]: { border: 'border-sky-500', bg: 'bg-sky-700/30', text: 'text-sky-300', iconBg: 'bg-sky-500' },
  [ActivityType.REST]: { border: 'border-slate-500', bg: 'bg-slate-700/30', text: 'text-slate-300', iconBg: 'bg-slate-500' },
};

const ActivityIcon: React.FC<{ type: ActivityType }> = ({ type }) => {
  if (type === ActivityType.RUN) return <span role="img" aria-label="Run icon" className="text-lg">🏃</span>;
  if (type === ActivityType.SWIM) return <span role="img" aria-label="Swim icon" className="text-lg">🏊</span>;
  if (type === ActivityType.REST) return <span role="img" aria-label="Rest icon" className="text-lg">🛌</span>;
  return null;
};

// Helper to create a unique key for an activity to track if it's added
const createActivityKey = (activity: SuggestedActivity): string => {
  return `${activity.date}-${activity.type}-${activity.durationMinutes}-${activity.distanceKm || 'no-dist'}-${activity.notes || 'no-notes'}`;
};

const SuggestionModal: React.FC<SuggestionModalProps> = ({ 
  isOpen, 
  onClose, 
  suggestedActivities, 
  onAddSuggestedActivity,
  error,
  isLoading,
  onFetchSuggestions,
  initialPreferences,
  onClearSuggestions,
  onEditSuggestedActivity, // <-- Destructure new prop
}) => {
  const [addedActivityKeys, setAddedActivityKeys] = useState<Set<string>>(new Set()); // Use the helper
  const [showPreferencesForm, setShowPreferencesForm] = useState<boolean>(true);
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferencesData>(initialPreferences);

  useEffect(() => {
    if (isOpen) {
      if (!isLoading && suggestedActivities.length === 0 && !error) {
         setShowPreferencesForm(true);
         setCurrentPreferences(initialPreferences);
      } else if (suggestedActivities.length > 0 || error) {
        setShowPreferencesForm(false);
      }
      setAddedActivityKeys(new Set()); // Reset added status when modal visibility or suggestions change
      document.body.style.overflow = 'hidden';
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'auto';
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, initialPreferences, isLoading, suggestedActivities, error, onClose]); // Added suggestedActivities to deps for reset

  const handlePreferencesSubmit = async (preferences: UserPreferencesData) => {
    onClearSuggestions();
    setCurrentPreferences(preferences);
    setShowPreferencesForm(false);
    await onFetchSuggestions(preferences);
  };

  const handleAddSingleActivity = (activity: SuggestedActivity) => {
    onAddSuggestedActivity(activity);
    setAddedActivityKeys(prev => new Set(prev).add(createActivityKey(activity)));
  };

  const handleAddAllSuggested = () => {
    const newKeys = new Set(addedActivityKeys);
    suggestedActivities.forEach(activity => {
      const key = createActivityKey(activity);
      if (!newKeys.has(key)) { // Only add if not already marked as added
        onAddSuggestedActivity(activity);
        newKeys.add(key);
      }
    });
    setAddedActivityKeys(newKeys);
    // Optionally, you might want to close the modal or give feedback
    // onClose(); // Example: Close modal after adding all
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleBackToPreferences = () => {
    setShowPreferencesForm(true);
    onClearSuggestions();
  };

  if (!isOpen) return null;

  const allSuggestionsAdded = suggestedActivities.length > 0 && 
                            suggestedActivities.every(act => addedActivityKeys.has(createActivityKey(act)));

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 modal-overlay"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="suggestion-modal-title"
    >
      <div 
        className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 modal-content overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="suggestion-modal-title" className="text-2xl font-semibold text-purple-400">
            {showPreferencesForm ? 'Customize Your Plan' : 'Suggested Training Plan'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close suggestions modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showPreferencesForm ? (
          <UserPreferencesForm
            initialData={currentPreferences}
            onSubmit={handlePreferencesSubmit}
            onCancel={onClose}
            isLoading={isLoading}
          />
        ) : (
          <>
            {/* ... (isLoading, error, no suggestions messages - keep as is) ... */}
            {isLoading && ( /* Your existing loading UI */ <div className="text-center py-10">Loading...</div>)}
            {error && !isLoading && ( /* Your existing error UI */ <div className="text-red-400">Error: {error} <button onClick={handleBackToPreferences}>Try Again</button></div>)}
            {!isLoading && !error && suggestedActivities.length === 0 && ( /* Your existing no suggestions UI */ <div className="text-center">No suggestions. <button onClick={handleBackToPreferences}>Adjust</button></div>)}


            {!isLoading && !error && suggestedActivities.length > 0 && (
              <>
                {/* --- ADD ALL BUTTON AND BACK BUTTON --- */}
                <div className="mb-4 flex justify-between items-center">
                  <button
                    onClick={handleBackToPreferences}
                    className="px-4 py-2 text-sm font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 rounded-md shadow-sm"
                  >
                    ← Edit Preferences
                  </button>
                  {!allSuggestionsAdded && (
                    <button
                      onClick={handleAddAllSuggested}
                      className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-emerald-500"
                    >
                      Add All to Plan
                    </button>
                  )}
                </div>
                {/* --- END ADD ALL BUTTON --- */}

                <div className="space-y-3">
                  {suggestedActivities.map((activity) => { // Index removed as key, use createActivityKey
                    const activityKey = createActivityKey(activity);
                    const isAdded = addedActivityKeys.has(activityKey);
                    const colors = activityColorStyles[activity.type] || activityColorStyles[ActivityType.REST]; // Fallback
                    return (
                      <div 
                        key={activityKey} // Use a more stable key
                        className={`p-3 rounded-md shadow-md border-l-4 ${colors.border} ${colors.bg} flex items-center gap-3 transition-opacity ${isAdded ? 'opacity-60' : ''}`}
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center mt-1`}>
                          <ActivityIcon type={activity.type} />
                        </div>
                        <div className="flex-grow">
                          {/* ... (activity details - keep as is) ... */}
                          <div className="flex justify-between items-baseline">
                            <h4 className={`font-semibold ${colors.text}`}>{activity.type} - {formatDate(activity.date)}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.replace('/30','/60')} ${colors.text.replace('-300','-200')}`}>
                                {activity.durationMinutes} min
                            </span>
                          </div>
                          {activity.type === ActivityType.RUN && activity.distanceKm != null && ( // Check for null/undefined
                            <p className="text-sm text-slate-300">Distance: {activity.distanceKm} km</p>
                          )}
                          {activity.notes && (
                            <p className="text-xs text-slate-400 mt-1 italic">Notes: {activity.notes}</p>
                          )}
                        </div>
                        {/* --- EDIT AND ADD BUTTONS --- */}
                        <div className="ml-auto self-center flex items-center space-x-2">
                          {!isAdded && ( // Only show edit if not yet added
                            <button
                              onClick={() => onEditSuggestedActivity(activity)}
                              className="p-1.5 text-slate-400 hover:text-sky-400 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-700 focus:ring-sky-500"
                              aria-label={`Edit suggested ${activity.type} on ${formatDate(activity.date)}`}
                              title="Edit before adding"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handleAddSingleActivity(activity)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                                        ${isAdded 
                                          ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500'}
                                          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
                            aria-label={isAdded ? `Added ${activity.type} on ${formatDate(activity.date)} to plan` : `Add ${activity.type} on ${formatDate(activity.date)} to plan`}
                          >
                            {isAdded ? 'Added' : 'Add to Plan'}
                          </button>
                        </div>
                         {/* --- END EDIT AND ADD BUTTONS --- */}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            <div className="mt-6 flex justify-end">
              {/* ... (Close button - keep as is) ... */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuggestionModal;