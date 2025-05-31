// UserPreferencesForm.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { UserPreferencesData, WorkDay, ShiftType } from '../types';

const formatDateToYYYYMMDD = (date: Date): string => {
  // Ensure date is treated as local when creating the string
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const UserPreferencesForm: React.FC<UserPreferencesFormProps> = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [planStartDate, setPlanStartDate] = useState<string>(initialData.planStartDate);
  const [generalNotes, setGeneralNotes] = useState<string>(initialData.generalNotes);
  const [workSchedule, setWorkSchedule] = useState<WorkDay[]>(initialData.workSchedule);
  const [lastWeekFeedback, setLastWeekFeedback] = useState<string>(initialData.lastWeekFeedback || '');

  // Effect to reset form when initialData prop changes (e.g., modal reopens)
  useEffect(() => {
    setPlanStartDate(initialData.planStartDate);
    setGeneralNotes(initialData.generalNotes);
    setWorkSchedule(initialData.workSchedule);
    setLastWeekFeedback(initialData.lastWeekFeedback || '');
  }, [initialData]);

  // Effect to update the dates in workSchedule when planStartDate changes,
  // while trying to preserve the selected shifts for corresponding days of the week.
  useEffect(() => {
    // This function will now use the current workSchedule state directly from the closure
    // of this useEffect, or we can use the functional update form for setWorkSchedule.
    setWorkSchedule(currentSchedule => {
      const newStartDate = new Date(planStartDate + 'T00:00:00'); // Use local time
      
      // Create a map of old shifts by day index (0=Sunday, 1=Monday, etc. or 0=current first day)
      // It's safer to map by the actual day of the week (e.g., 'Monday') if the old schedule could start on any day.
      // For simplicity, if your schedule always has 7 days starting from a fixed point (like initial planStartDate):
      const oldShiftsByDayIndex = currentSchedule.reduce((acc, day, index) => {
          acc[index] = day.shift; // Preserves based on position in the 7-day array
          return acc;
      }, {} as Record<number, ShiftType>);

      const newGeneratedSchedule: WorkDay[] = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(newStartDate);
        dayDate.setDate(newStartDate.getDate() + i);
        newGeneratedSchedule.push({
          date: formatDateToYYYYMMDD(dayDate),
          dayName: dayDate.toLocaleDateString(undefined, { weekday: 'long' }),
          shift: oldShiftsByDayIndex[i] !== undefined ? oldShiftsByDayIndex[i] : ShiftType.OFF,
        });
      }
      return newGeneratedSchedule;
    });
  }, [planStartDate]); // Only re-run when planStartDate changes


  const handleShiftChange = (targetDate: string, newShift: ShiftType) => {
    setWorkSchedule(prevSchedule =>
      prevSchedule.map(day => (day.date === targetDate ? { ...day, shift: newShift } : day))
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

  // Date formatting for display (day.date is YYYY-MM-DD)
  const displayDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00'); // Treat as local
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Start Date Input */}
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

      {/* Feedback on Last Week's Training */}
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

      {/* Specific Preferences or Goals */}
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

      {/* Work Schedule Section */}
      <div>
        <h3 className={`${labelBaseClass} mb-2`}>Work Schedule for This Upcoming Week</h3>
        <div className="space-y-3">
          {workSchedule.map((day) => ( // day.date is already YYYY-MM-DD
            <div key={day.date} className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-center p-2 bg-slate-700/50 rounded-md">
              <span className="text-slate-300 text-sm font-medium">
                {day.dayName} ({displayDate(day.date)})
              </span>
              <select
                value={day.shift} // This should correctly reflect the state
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

      {/* Buttons */}
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
          {/* ... isLoading button content ... */}
          {isLoading ? 'Fetching Plan...' : 'Get Weekly Plan Suggestion'}
        </button>
      </div>
    </form>
  );
};

export default UserPreferencesForm;