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
  // Ensures local date parts are used to form YYYY-MM-DD
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getNextMonday = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
  const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0); // Set to midnight
  return d;
};

const formatICSDate = (date: Date, includeTime: boolean = true): string => {
  // For ICS, dates/times are typically UTC
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
    try {
      return savedActivities ? JSON.parse(savedActivities) : [];
    } catch (e) {
      console.error("Error parsing saved activities:", e);
      return [];
    }
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
    try {
      return savedGoals ? JSON.parse(savedGoals) : initialTrainingGoals;
    } catch (e) {
      console.error("Error parsing saved training goals:", e);
      return initialTrainingGoals;
    }
  });

  useEffect(() => {
    localStorage.setItem('marathonActivities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('marathonTrainingGoals', JSON.stringify(trainingGoals));
  }, [trainingGoals]);

  const handleUpdateTrainingGoals = useCallback((newGoals: TrainingGoalData) => {
    setTrainingGoals(newGoals);
    setCurrentMainView('planner');
  }, []);

  const handleAddActivity = useCallback((activity: Omit<Activity, 'id'>) => {
    setActivities(prev => [...prev, { ...activity, id: crypto.randomUUID() }]);
  }, []);

  const handleUpdateActivity = useCallback((updatedActivity: Activity) => {
    setActivities(prev => prev.map(act => act.id === updatedActivity.id ? updatedActivity : act));
  }, []);

  const handleDeleteActivity = useCallback((activityId: string) => {
    setActivities(prev => prev.filter(act => act.id !== activityId));
  }, []);

  const openActivityModalWithDate = useCallback((date: Date) => {
    setSelectedDateForNewActivity(date);
    setActivityToEdit(null);
    setIsActivityModalOpen(true);
  }, []);
  
  const openActivityModalForEdit = useCallback((activity: Activity) => {
    setSelectedDateForNewActivity(new Date(activity.date + 'T00:00:00')); // Treat as local
    setActivityToEdit(activity);
    setIsActivityModalOpen(true);
  }, []);

  const closeActivityModal = useCallback(() => {
    setIsActivityModalOpen(false);
    setSelectedDateForNewActivity(null);
    setActivityToEdit(null);
  }, []);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      // Ensure dates are parsed consistently before comparing
      const dateA = new Date(a.date + 'T00:00:00').getTime();
      const dateB = new Date(b.date + 'T00:00:00').getTime();
      return dateA - dateB;
    });
  }, [activities]);

  const handleFetchSuggestions = useCallback(async (preferences: UserPreferencesData) => {
    setIsSuggestingPlan(true);
    setSuggestionError(null);
    setSuggestedActivities([]); 

    try {
      const { planStartDate, generalNotes, workSchedule, lastWeekFeedback } = preferences;
      // ... (your existing comprehensive prompt generation logic for Gemini)
      const workScheduleString = workSchedule.map(day => 
        `- ${day.dayName} (${new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, {month:'short', day:'numeric'})}): ${day.shift}`
      ).join('\n');

      let goalInstructions = `The user is a ${trainingGoals.fitnessLevel} focusing on marathon training.
      Their overall marathon goal is: "${trainingGoals.marathonGoalTime}".
      Their current comfortable running pace is ${trainingGoals.currentComfortablePace}.
      Their current fastest running pace is ${trainingGoals.currentFastestPace}.`;
      if (trainingGoals.marathonDate) {
        goalInstructions += `\nTheir target marathon date is ${trainingGoals.marathonDate}.`;
      }
      if (trainingGoals.longTermNotes) {
        goalInstructions += `\nUser's long-term training notes/philosophy: "${trainingGoals.longTermNotes}".`;
      }
      
      let feedbackInstructions = "";
      if (lastWeekFeedback && lastWeekFeedback.trim() !== '') {
        feedbackInstructions = `
          User's feedback on their previous week of training: "${lastWeekFeedback}".
          Consider this feedback when planning the current week.
          - If they felt good and found activities manageable or easy, consider a slight, safe progression in volume or intensity on 1-2 key workouts.
          - If they struggled or felt overly fatigued, prioritize recovery, maintain current load, or slightly reduce intensity/volume.
          - If feedback is neutral, focus on consistency with a gentle progression aligned with their overall goal.
          Always prioritize injury prevention, especially for a ${trainingGoals.fitnessLevel}.
        `;
      }

      const prompt = `
        You are a marathon training plan assistant.
        ${goalInstructions}

        You are generating a 7-day training plan for the week starting ${planStartDate}.
        
        User's work schedule for this specific week:
        ${workScheduleString}

        ${feedbackInstructions}

        User's specific preferences or goals for *this upcoming week only*:
        ${generalNotes || "User has not provided specific preferences for this week. Focus on a plan that aligns with their overall goals and fitness level, adjusting for work schedule and any feedback."}

        Generate a 7-day training plan.
        IMPORTANT: Consider the user's work schedule. Suggest lighter, shorter, or recovery-focused activities on days with demanding shifts (especially PM or Night shifts) or on days immediately following night shifts. Prioritize recovery around tough shifts.
        
        The plan should include a mix of running activities appropriate for their ${trainingGoals.fitnessLevel} level, building gradually towards their marathon goal.
        Structure the runs with specific instructions in the 'notes' field:
        - **Easy/Recovery runs:** Clearly state target duration or distance. Pace should be comfortable, significantly slower than ${trainingGoals.currentComfortablePace}.
        - **Steady/Moderate runs:** Target duration or distance. Pace around ${trainingGoals.currentComfortablePace}.
        - **Interval/Tempo runs (if appropriate for ${trainingGoals.fitnessLevel} and marathon goal progression, max 1-2 per week unless user requests more and feedback is positive):** Provide a detailed structure (warm-up, work intervals duration/distance & pace, recovery intervals, cool-down). Paces for work intervals can be between ${trainingGoals.currentComfortablePace} and ${trainingGoals.currentFastestPace}.
        - **Long distance run (one per week):** Specify distance. Pace should be easy and conversational. Gradually increase this weekly as per typical marathon training progression, considering the user's marathon date if provided, and their feedback. For a ${trainingGoals.fitnessLevel}, early phase long runs might be X km, progressing to Y km.

        For all run types, the 'notes' field MUST contain the specific instructions.
        The 'durationMinutes' field should reflect TOTAL estimated time.
        The 'distanceKm' field should be populated for distance-based runs. Estimate for others if feasible.

        Include cross-training (e.g., swimming) or rest days as appropriate for a balanced marathon plan. 
        A "Rest" day: no strenuous activity. Notes: "Full rest" or "Active recovery: light walk/stretching." Type: "Rest".

        Return the plan as a JSON array of exactly 7 objects, one for each day starting from ${planStartDate}.
        Each object *must* have: "date" (YYYY-MM-DD, sequential), "type" ("Run" | "Swim" | "Rest"), "durationMinutes" (number), "distanceKm" (optional number), "notes" (REQUIRED string).

        Example run: { "date": "${planStartDate}", "type": "Run", "durationMinutes": 45, "distanceKm": 5, "notes": "Easy run: 5km at a conversational pace (around 8:00-8:30 min/km)." }
        
        Ensure the output is ONLY the JSON array, without any surrounding text or markdown.
      `;
      
      const suggestions = await fetchTrainingPlanSuggestion(prompt);
      setSuggestedActivities(suggestions.slice(0, 7));
    } catch (error) {
      console.error("Failed to fetch suggestions:", error);
      setSuggestionError(error instanceof Error ? error.message : "An unknown error occurred while fetching suggestions.");
    } finally {
      setIsSuggestingPlan(false);
    }
  }, [trainingGoals]);

  const addSuggestedActivityToPlan = useCallback((suggestedActivity: SuggestedActivity) => {
    // Convert SuggestedActivity to Activity (mainly ensuring it has an id)
    const activityToAdd: Omit<Activity, 'id'> = {
        type: suggestedActivity.type,
        date: suggestedActivity.date,
        durationMinutes: suggestedActivity.durationMinutes,
        distanceKm: suggestedActivity.distanceKm,
        notes: suggestedActivity.notes,
    };
    handleAddActivity(activityToAdd); 
    // Optional: remove from suggestedActivities to prevent re-adding from the same suggestion list
    setSuggestedActivities(prev => prev.filter(sa => 
        !(sa.date === suggestedActivity.date && 
          sa.type === suggestedActivity.type && 
          sa.durationMinutes === suggestedActivity.durationMinutes &&
          sa.notes === suggestedActivity.notes) 
    ));
  }, [handleAddActivity]);

  const initialUserPreferences = useMemo((): UserPreferencesData => {
    const startDate = getNextMonday();
    const schedule: WorkDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      schedule.push({
        date: formatDateToYYYYMMDD(dayDate),
        dayName: dayDate.toLocaleDateString(undefined, { weekday: 'long' }),
        shift: ShiftType.OFF,
      });
    }
    return {
      planStartDate: formatDateToYYYYMMDD(startDate),
      generalNotes: '',
      workSchedule: schedule,
      lastWeekFeedback: '',
    };
  }, []);

  // --- DOWNLOAD CALENDAR FUNCTION ---
  const handleDownloadCalendar = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today for comparison

    const futureActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date + 'T00:00:00'); // Treat activity date as local start of day
      return activityDate >= today;
    });

    if (futureActivities.length === 0) {
      alert("No upcoming activities to download.");
      return;
    }

    let icsContent = "BEGIN:VCALENDAR\r\n";
    icsContent += "VERSION:2.0\r\n";
    icsContent += "PRODID:-//MarathonPlanner//YourAppV1.0//EN\r\n"; // Customize your PRODID
    icsContent += "CALSCALE:GREGORIAN\r\n";
    icsContent += "METHOD:PUBLISH\r\n";
    icsContent += "X-WR-CALNAME:Marathon Training Plan\r\n";

    futureActivities.forEach((activity, index) => {
      const activityDate = new Date(activity.date + 'T00:00:00'); // Local start of day
      
      // All-day event for simplicity, as activities don't have specific start times
      const dtstart = formatICSDate(activityDate, false); // YYYYMMDD format
      const dtendOriginal = new Date(activityDate);
      dtendOriginal.setDate(activityDate.getDate() + 1); // DTEND is the start of the next day for all-day
      const dtend = formatICSDate(dtendOriginal, false); // YYYYMMDD format

      const eventUID = activity.id 
                       ? `${activity.id}@marathonplanner.yourdomain.com` // Use a domain for uniqueness
                       : `${formatDateToYYYYMMDD(activityDate)}-${activity.type.replace(/\s+/g, '')}-${index}@marathonplanner.yourdomain.com`;

      icsContent += "BEGIN:VEVENT\r\n";
      icsContent += `UID:${eventUID}\r\n`;
      icsContent += `DTSTAMP:${formatICSDate(new Date())}\r\n`; // Current timestamp in UTC
      icsContent += `DTSTART;VALUE=DATE:${dtstart}\r\n`;
      icsContent += `DTEND;VALUE=DATE:${dtend}\r\n`;

      let summary = `${activity.type}`;
      if (activity.type === ActivityType.RUN && activity.distanceKm) {
        summary += ` - ${activity.distanceKm} km`;
      }
      summary += ` (${activity.durationMinutes} min)`;
      // Escape characters for ICS summary
      icsContent += `SUMMARY:${summary.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")}\r\n`;

      if (activity.notes) {
        const description = activity.notes.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
        icsContent += `DESCRIPTION:${description}\r\n`;
      }
      icsContent += "END:VEVENT\r\n";
    });

    icsContent += "END:VCALENDAR\r\n";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const link = document.createElement("a");
    if (typeof link.download === 'string') { // Check for browser support
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "marathon_training_plan.ics");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } else {
        // Fallback for older browsers or environments where download attribute is not supported
        alert("ICS file generated. Please copy the following content and save it as a .ics file:\n\n" + icsContent);
    }
  }, [activities]);
  // --- END DOWNLOAD CALENDAR FUNCTION ---

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 selection:bg-sky-500 selection:text-white">
      <Header />
      
      {currentMainView === 'planner' && (
        <>
          <Controls
            currentView={currentPlannerView}
            onViewChange={setCurrentPlannerView}
            onAddActivity={() => {
              setSelectedDateForNewActivity(new Date()); // Use current date for new manual activity
              setActivityToEdit(null);
              setIsActivityModalOpen(true);
            }}
            onSuggestPlan={() => setIsSuggestionModalOpen(true)}
            isSuggestingPlan={isSuggestingPlan}
            onSetGoals={() => setCurrentMainView('goalSettings')}
            onDownloadCalendar={handleDownloadCalendar} // <-- Pass the handler here
          />
          <main className="w-full max-w-5xl mx-auto mt-6 flex-grow">
            {currentPlannerView === 'calendar' ? (
              <CalendarView
                activities={activities}
                onDayClick={openActivityModalWithDate}
                onActivityClick={openActivityModalForEdit}
                currentCalendarDate={currentCalendarDate}
                setCurrentCalendarDate={setCurrentCalendarDate}
              />
            ) : (
              <ScheduleView 
                activities={sortedActivities} 
                onEditActivity={openActivityModalForEdit}
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
          onSaveActivity={activityToEdit ? handleUpdateActivity : handleAddActivity}
          initialDate={selectedDateForNewActivity}
          activityToEdit={activityToEdit}
        />
      )}
      {isSuggestionModalOpen && currentMainView === 'planner' && (
        <SuggestionModal
          isOpen={isSuggestionModalOpen}
          onClose={() => {
            setIsSuggestionModalOpen(false);
            // Clear suggestions and error when closing to ensure fresh state if reopened
            // setSuggestedActivities([]); 
            // setSuggestionError(null);
          }}
          suggestedActivities={suggestedActivities}
          onAddSuggestedActivity={addSuggestedActivityToPlan}
          error={suggestionError}
          isLoading={isSuggestingPlan}
          onFetchSuggestions={handleFetchSuggestions}
          initialPreferences={initialUserPreferences}
          onClearSuggestions={() => {
            setSuggestedActivities([]);
            setSuggestionError(null);
          }}
        />
      )}
      <footer className="w-full max-w-4xl mx-auto text-center py-8 text-slate-500 text-sm">
        Plan your victory. One step, one swim, one day at a time.
      </footer>
    </div>
  );
};

export default App;