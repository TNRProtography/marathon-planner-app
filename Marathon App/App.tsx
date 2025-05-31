// Marathon App/App.tsx

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Controls from './components/Controls';
import CalendarView from './components/CalendarView';
import ScheduleView from './components/ScheduleView';
import ActivityModal from './components/ActivityModal';
import SuggestionModal from './components/SuggestionModal';
import GoalSettingsPage from './components/GoalSettingsPage';
import { Activity, ViewMode, ActivityType, SuggestedActivity, UserPreferencesData, WorkDay, ShiftType, TrainingGoalData, MainView } from './types';
import { fetchTrainingPlanSuggestion } from './services/geminiService';

// --- HELPER FUNCTIONS ---
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextMonday = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatICSDate = (date: Date, includeTime: boolean = true): string => {
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  if (!includeTime) {
    return `${year}${month}${day}`;
  }
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};
// --- END HELPER FUNCTIONS ---

const initialTrainingGoals: TrainingGoalData = {
  marathonGoalTime: 'Under 5 hours',
  currentComfortablePace: '7:30 min/km',
  currentFastestPace: '6:30 min/km',
  fitnessLevel: 'Beginner',
  marathonDate: '',
  longTermNotes: 'Focus on building a consistent base and enjoying the journey!'
};

const App: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const savedActivities = localStorage.getItem('marathonActivities');
    try { return savedActivities ? JSON.parse(savedActivities) : []; } catch (e) { console.error("Error parsing saved activities:", e); return []; }
  });

  const [currentPlannerView, setCurrentPlannerView] = useState<ViewMode>('calendar');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState<boolean>(false);
  const [selectedDateForNewActivity, setSelectedDateForNewActivity] = useState<Date | null>(null);
  const [activityToEdit, setActivityToEdit] = useState<Activity | null>(null); 
  
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());

  const [suggestedActivities, setSuggestedActivities] = useState<SuggestedActivity[]>([]);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState<boolean>(false);
  const [isSuggestingPlan, setIsSuggestingPlan] = useState<boolean>(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [currentMainView, setCurrentMainView] = useState<MainView>('planner');
  const [trainingGoals, setTrainingGoals] = useState<TrainingGoalData>(() => {
    const savedGoals = localStorage.getItem('marathonTrainingGoals');
    try { return savedGoals ? JSON.parse(savedGoals) : initialTrainingGoals; } catch (e) { console.error("Error parsing saved training goals:", e); return initialTrainingGoals; }
  });

  // --- NEW STATE for tracking if we are editing a *suggested* activity ---
  const [editingSuggestedActivity, setEditingSuggestedActivity] = useState<SuggestedActivity | null>(null);
  // ---

  useEffect(() => { localStorage.setItem('marathonActivities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('marathonTrainingGoals', JSON.stringify(trainingGoals)); }, [trainingGoals]);

  const handleUpdateTrainingGoals = useCallback((newGoals: TrainingGoalData) => {
    setTrainingGoals(newGoals);
    setCurrentMainView('planner');
  }, []);

  const handleAddActivity = useCallback((activityData: Omit<Activity, 'id'>) => {
    const newActivity: Activity = { ...activityData, id: crypto.randomUUID() };
    setActivities(prev => [...prev, newActivity]);
  }, []);

  const handleUpdateActivity = useCallback((updatedActivity: Activity) => {
    setActivities(prev => prev.map(act => (act.id === updatedActivity.id ? updatedActivity : act)));
  }, []);

  const handleDeleteActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(act => act.id !== activityId));
  }, []);

  const openActivityModalForNew = useCallback((date?: Date) => { // For brand new from Controls or Calendar day click
    setSelectedDateForNewActivity(date || new Date());
    setActivityToEdit(null);
    setEditingSuggestedActivity(null);
    setIsActivityModalOpen(true);
  }, []);
  
  const openActivityModalForEditSaved = useCallback((activity: Activity) => { // For editing SAVED activities
    setSelectedDateForNewActivity(new Date(activity.date + 'T00:00:00'));
    setActivityToEdit(activity);
    setEditingSuggestedActivity(null);
    setIsActivityModalOpen(true);
  }, []);

  // --- NEW HANDLER for opening ActivityModal to edit a SUGGESTED item ---
  const handleOpenEditSuggestedActivity = useCallback((suggestedItem: SuggestedActivity) => {
    setEditingSuggestedActivity(suggestedItem); 
    const activityDataForForm: Activity = { // Adapt SuggestedActivity for ActivityModal's `activityToEdit`
        ...suggestedItem,
        id: `suggested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` // Temp unique ID for the form session
    };
    setActivityToEdit(activityDataForForm); 
    setSelectedDateForNewActivity(new Date(suggestedItem.date + 'T00:00:00'));
    setIsActivityModalOpen(true);
    // setIsSuggestionModalOpen(false); // Optional: close suggestion modal immediately, or let user close it.
                                      // If keeping SuggestionModal open, how to handle adding the *original* suggestion later?
                                      // For now, let's assume ActivityModal is primary.
  }, []);
  // ---

  const closeActivityModal = useCallback(() => {
    setIsActivityModalOpen(false);
    setSelectedDateForNewActivity(null);
    setActivityToEdit(null);
    setEditingSuggestedActivity(null); 
  }, []);

  // --- MODIFIED onSave handler for ActivityModal ---
  const handleSaveFromActivityModal = useCallback((activityDataFromForm: Activity | Omit<Activity, 'id'>) => {
    if (editingSuggestedActivity) {
      // We were editing a suggestion. Now we add it as a new activity to the main list.
      const newActivityData: Omit<Activity, 'id'> = {
        type: activityDataFromForm.type,
        date: activityDataFromForm.date,
        durationMinutes: activityDataFromForm.durationMinutes,
        distanceKm: activityDataFromForm.distanceKm,
        notes: activityDataFromForm.notes,
      };
      handleAddActivity(newActivityData);
      // TODO: Consider how to mark the original 'editingSuggestedActivity' as "processed" or "added"
      // in the SuggestionModal. This might involve passing a callback to SuggestionModal
      // or lifting the 'addedActivityKeys' state from SuggestionModal to App.tsx.
      // For now, this adds the edited version. The original suggestion in SuggestionModal
      // won't know it was edited and then added unless further logic is added.
    } else if ('id' in activityDataFromForm && activityToEdit && activityDataFromForm.id === activityToEdit.id) {
      // We were editing an existing, saved activity from the main list.
      handleUpdateActivity(activityDataFromForm as Activity);
    } else {
      // It's a brand new activity being added.
      handleAddActivity(activityDataFromForm as Omit<Activity, 'id'>);
    }
    // The ActivityModal's internal ActivityForm calls onClose, which calls closeActivityModal here.
    // No need to call closeActivityModal() directly here again.
    setEditingSuggestedActivity(null); // Ensure this is reset
  }, [editingSuggestedActivity, activityToEdit, handleAddActivity, handleUpdateActivity]);
  // ---

  const sortedActivities = useMemo(() => { /* ... same ... */ }, [activities]);
  const handleFetchSuggestions = useCallback(async (preferences: UserPreferencesData) => { /* ... same ... */ }, [trainingGoals]);
  const addSuggestedActivityToPlan = useCallback((suggestedActivity: SuggestedActivity) => { /* ... same ... */ }, [handleAddActivity]);
  const initialUserPreferences = useMemo((): UserPreferencesData => { /* ... same ... */ }, []);
  const handleDownloadCalendar = useCallback(() => { /* ... same ... */ }, [activities]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <Header />
      
      {currentMainView === 'planner' && (
        <>
          <Controls
            currentView={currentPlannerView}
            onViewChange={setCurrentPlannerView}
            onAddActivity={() => openActivityModalForNew()} // Use the new specific handler
            onSuggestPlan={() => setIsSuggestionModalOpen(true)}
            isSuggestingPlan={isSuggestingPlan}
            onSetGoals={() => setCurrentMainView('goalSettings')}
            onDownloadCalendar={handleDownloadCalendar}
          />
          <main className="w-full max-w-5xl mx-auto mt-6 flex-grow">
            {currentPlannerView === 'calendar' ? (
              <CalendarView
                activities={activities}
                onDayClick={openActivityModalForNew} // Use the new specific handler
                onActivityClick={openActivityModalForEditSaved}
                currentCalendarDate={currentCalendarDate}
                setCurrentCalendarDate={setCurrentCalendarDate}
              />
            ) : (
              <ScheduleView 
                activities={sortedActivities} 
                onEditActivity={openActivityModalForEditSaved}
                onDeleteActivity={handleDeleteActivity}
              />
            )}
          </main>
        </>
      )}

      {currentMainView === 'goalSettings' && (
        <GoalSettingsPage
          initialGoals={trainingGoals}
          onSaveGoals={handleUpdateTrainingGoals}
          onCancel={() => setCurrentMainView('planner')}
        />
      )}

      {isActivityModalOpen && (
        <ActivityModal
          isOpen={isActivityModalOpen}
          onClose={closeActivityModal}
          onSaveActivity={handleSaveFromActivityModal} // Use the new combined save handler
          initialDate={selectedDateForNewActivity}
          activityToEdit={activityToEdit} 
        />
      )}
      {isSuggestionModalOpen && currentMainView === 'planner' && (
        <SuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => setIsSuggestionModalOpen(false)}
          suggestedActivities={suggestedActivities}
          onAddSuggestedActivity={addSuggestedActivityToPlan} // For direct "Add" from suggestion list
          error={suggestionError}
          isLoading={isSuggestingPlan}
          onFetchSuggestions={handleFetchSuggestions}
          initialPreferences={initialUserPreferences}
          onClearSuggestions={() => {
            setSuggestedActivities([]);
            setSuggestionError(null);
          }}
          onEditSuggestedActivity={handleOpenEditSuggestedActivity} // <-- Pass the new handler
        />
      )}
      <footer className="w-full max-w-4xl mx-auto text-center py-8 text-slate-500 text-sm">
        Plan your victory. One step, one swim, one day at a time.
      </footer>
    </div>
  );
};

export default App;