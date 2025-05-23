
import React, { useEffect, useState, useCallback } from 'react';
import { SuggestedActivity, ActivityType, UserPreferencesData } from '../types';
import UserPreferencesForm from './UserPreferencesForm'; // New component

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestedActivities: SuggestedActivity[];
  onAddSuggestedActivity: (activity: SuggestedActivity) => void;
  error: string | null;
  isLoading: boolean;
  onFetchSuggestions: (preferences: UserPreferencesData) => Promise<void>;
  initialPreferences: UserPreferencesData;
  onClearSuggestions: () => void;
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

const SuggestionModal: React.FC<SuggestionModalProps> = ({ 
  isOpen, 
  onClose, 
  suggestedActivities, 
  onAddSuggestedActivity,
  error,
  isLoading,
  onFetchSuggestions,
  initialPreferences,
  onClearSuggestions
}) => {
  const [addedActivities, setAddedActivities] = useState<Set<string>>(new Set());
  const [showPreferencesForm, setShowPreferencesForm] = useState<boolean>(true);
  const [currentPreferences, setCurrentPreferences] = useState<UserPreferencesData>(initialPreferences);

  useEffect(() => {
    if (isOpen) {
      // When modal opens, always show preferences form initially,
      // unless suggestions are already loading or present from a previous opening in the same session.
      if (!isLoading && suggestedActivities.length === 0 && !error) {
         setShowPreferencesForm(true);
         setCurrentPreferences(initialPreferences); // Reset preferences to default
      } else if (suggestedActivities.length > 0 || error) {
        setShowPreferencesForm(false); // Show existing suggestions/error
      }
      // else if isLoading, keep current view (likely suggestions view with loader)

      setAddedActivities(new Set()); // Reset added status
      document.body.style.overflow = 'hidden';
      const handleEsc = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onClose();
        }
      };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.removeEventListener('keydown', handleEsc);
        document.body.style.overflow = 'auto';
      };
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isOpen, initialPreferences, isLoading, suggestedActivities.length, error, onClose]);


  const handlePreferencesSubmit = async (preferences: UserPreferencesData) => {
    onClearSuggestions(); // Clear old suggestions and errors
    setCurrentPreferences(preferences);
    setShowPreferencesForm(false); // Move to suggestions view (will show loader)
    await onFetchSuggestions(preferences);
    // Suggestions will be updated via props, re-rendering this component
  };

  const handleAdd = (activity: SuggestedActivity) => {
    onAddSuggestedActivity(activity);
    const activityKey = `${activity.date}-${activity.type}-${activity.notes || ''}-${activity.durationMinutes}-${activity.distanceKm || ''}`;
    setAddedActivities(prev => new Set(prev).add(activityKey));
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure local timezone
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const handleBackToPreferences = () => {
    setShowPreferencesForm(true);
    onClearSuggestions(); // Clear suggestions and error to allow fresh input
  };

  if (!isOpen) return null;

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
            {isLoading && (
              <div className="text-center py-10">
                <svg className="animate-spin h-8 w-8 text-purple-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-2 text-slate-300">Generating your personalized plan...</p>
              </div>
            )}

            {error && !isLoading && (
              <div className="bg-red-800/50 border border-red-700 text-red-300 px-4 py-3 rounded-md mb-4">
                <h3 className="font-semibold">Error Fetching Suggestions</h3>
                <p className="text-sm">{error}</p>
                <button
                  onClick={handleBackToPreferences}
                  className="mt-2 px-3 py-1 text-xs font-medium text-yellow-300 bg-yellow-700 hover:bg-yellow-600 rounded-md"
                >
                  Edit Preferences & Try Again
                </button>
              </div>
            )}

            {!isLoading && !error && suggestedActivities.length === 0 && (
              <div className="text-center py-10 text-slate-400">
                No suggestions generated. This might be due to very restrictive preferences or an issue with the service.
                <button
                  onClick={handleBackToPreferences}
                  className="mt-3 block mx-auto px-4 py-2 text-sm font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 rounded-md"
                >
                  Adjust Preferences & Try Again
                </button>
              </div>
            )}

            {!isLoading && !error && suggestedActivities.length > 0 && (
              <div className="space-y-3">
                {suggestedActivities.map((activity, index) => {
                  const activityKey = `${activity.date}-${activity.type}-${activity.notes || ''}-${activity.durationMinutes}-${activity.distanceKm || ''}`;
                  const isAdded = addedActivities.has(activityKey);
                  const colors = activityColorStyles[activity.type];
                  return (
                    <div 
                      key={index} // Using index as key is okay if list is static or items have no stable IDs from API
                      className={`p-3 rounded-md shadow-md border-l-4 ${colors.border} ${colors.bg} flex items-start gap-3 transition-opacity ${isAdded ? 'opacity-60' : ''}`}
                    >
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.iconBg} flex items-center justify-center mt-1`}>
                        <ActivityIcon type={activity.type} />
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-baseline">
                          <h4 className={`font-semibold ${colors.text}`}>{activity.type} - {formatDate(activity.date)}</h4>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg.replace('/30','/60')} ${colors.text.replace('-300','-200')}`}>
                            {activity.durationMinutes} min
                          </span>
                        </div>
                        {activity.type === ActivityType.RUN && activity.distanceKm && (
                          <p className="text-sm text-slate-300">Distance: {activity.distanceKm} km</p>
                        )}
                        {activity.notes && (
                          <p className="text-xs text-slate-400 mt-1 italic">Notes: {activity.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdd(activity)}
                        disabled={isAdded}
                        className={`ml-auto self-center px-3 py-1.5 text-xs font-medium rounded-md shadow-sm transition-colors
                                    ${isAdded 
                                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                                      : 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500'}
                                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
                        aria-label={isAdded ? `Added ${activity.type} on ${formatDate(activity.date)} to plan` : `Add ${activity.type} on ${formatDate(activity.date)} to plan`}
                      >
                        {isAdded ? 'Added' : 'Add to Plan'}
                      </button>
                    </div>
                  );
                })}
                 <button
                    onClick={handleBackToPreferences}
                    className="mt-4 px-4 py-2 text-sm font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 rounded-md shadow-sm"
                  >
                    &larr; Edit Preferences
                  </button>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
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
