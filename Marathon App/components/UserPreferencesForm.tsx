
import React, { useState, useEffect, useCallback } from 'react';
import { UserPreferencesData, WorkDay, ShiftType } from '../types';

interface UserPreferencesFormProps {
  initialData: UserPreferencesData;
  onSubmit: (data: UserPreferencesData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const formatDateToYYYYMMDD = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [planStartDate, setPlanStartDate] = useState<string>(initialData.planStartDate);
  const [generalNotes, setGeneralNotes] = useState<string>(initialData.generalNotes);
  const [workSchedule, setWorkSchedule] = useState<WorkDay[]>(initialData.workSchedule);
  const [lastWeekFeedback, setLastWeekFeedback] = useState<string>(initialData.lastWeekFeedback || '');

  const updateWorkScheduleDates = useCallback((startDateStr: string) => {
    const newStartDate = new Date(startDateStr + 'T00:00:00');
    const currentShiftsByDayIndex = workSchedule.reduce((acc, day, index) => {
        acc[index] = day.shift;
        return acc;
    }, {} as Record<number, ShiftType>);

    const newSchedule: WorkDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(newStartDate);
      dayDate.setDate(newStartDate.getDate() + i);
      newSchedule.push({
        date: formatDateToYYYYMMDD(dayDate),
        dayName: dayDate.toLocaleDateString(undefined, { weekday: 'long' }),
        shift: currentShiftsByDayIndex[i] !== undefined ? currentShiftsByDayIndex[i] : ShiftType.OFF,
      });
    }
    setWorkSchedule(newSchedule);
  }, [workSchedule]); // workSchedule is needed here if we want to preserve shifts correctly when start date changes

  useEffect(() => {
    updateWorkScheduleDates(planStartDate);
  }, [planStartDate, updateWorkScheduleDates]);
  
  useEffect(() => {
    setPlanStartDate(initialData.planStartDate);
    setGeneralNotes(initialData.generalNotes);
    setWorkSchedule(initialData.workSchedule); 
    setLastWeekFeedback(initialData.lastWeekFeedback || '');
    // updateWorkScheduleDates will be called due to planStartDate change if it occurs,
    // or initialData.workSchedule will be set directly.
  }, [initialData]);


  const handleShiftChange = (date: string, newShift: ShiftType) => {
    setWorkSchedule(prevSchedule =>
      prevSchedule.map(day => (day.date === date ? { ...day, shift: newShift } : day))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      planStartDate,
      generalNotes,
      workSchedule,
      lastWeekFeedback,
    });
  };

  const inputBaseClass = "block w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400 text-sm transition-colors duration-150 ease-in-out";
  const labelBaseClass = "block text-sm font-medium text-purple-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="planStartDate" className={labelBaseClass}>
          Plan Start Date (Week beginning)
        </label>
        <input
          type="date"
          id="planStartDate"
          value={planStartDate}
          onChange={(e) => setPlanStartDate(e.target.value)}
          className={inputBaseClass}
          required
          aria-describedby="planStartDateHelp"
        />
        <p id="planStartDateHelp" className="mt-1 text-xs text-slate-400">Select the Monday (or start day) of the week you want to plan for.</p>
      </div>

      <div>
        <label htmlFor="lastWeekFeedback" className={labelBaseClass}>
          Feedback on Last Week's Training (Optional)
        </label>
        <textarea
          id="lastWeekFeedback"
          rows={3}
          value={lastWeekFeedback}
          onChange={(e) => setLastWeekFeedback(e.target.value)}
          className={inputBaseClass}
          placeholder="e.g., Long run felt easy, struggled with speed work, felt tired after night shifts, ready for more mileage."
        />
      </div>

      <div>
        <label htmlFor="generalNotes" className={labelBaseClass}>
          Specific Preferences or Goals for This Upcoming Week
        </label>
        <textarea
          id="generalNotes"
          rows={3}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          className={inputBaseClass}
          placeholder="e.g., Prefer long runs on Saturdays, have a social event Friday (need easy day)."
        />
      </div>

      <div>
        <h3 className={`${labelBaseClass} mb-2`}>Work Schedule for This Upcoming Week</h3>
        <div className="space-y-3">
          {workSchedule.map(day => (
            <div key={day.date} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center p-2 bg-slate-700/50 rounded-md">
              <span className="text-slate-300 text-sm font-medium">
                {day.dayName} ({new Date(day.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })})
              </span>
              <select
                value={day.shift}
                onChange={(e) => handleShiftChange(day.date, e.target.value as ShiftType)}
                className={`${inputBaseClass} sm:w-48`}
                aria-label={`Shift for ${day.dayName}`}
              >
                {Object.values(ShiftType).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching Plan...
            </>
          ) : (
            'Get Weekly Plan Suggestion'
          )}
        </button>
      </div>
    </form>
  );
};

export default UserPreferencesForm;
