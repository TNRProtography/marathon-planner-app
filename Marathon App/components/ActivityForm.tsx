
import React, { useState, useEffect } from 'react';
import { Activity, ActivityType } from '../types';

interface ActivityFormProps {
  onSave: (activity: Activity | Omit<Activity, 'id'>) => void;
  onCancel: () => void;
  initialDate: Date | null;
  activityToEdit?: Activity | null;
}

// Helper to format date to YYYY-MM-DD for input[type=date]
const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const ActivityForm: React.FC<ActivityFormProps> = ({ onSave, onCancel, initialDate, activityToEdit }) => {
  const [activityType, setActivityType] = useState<ActivityType>(activityToEdit?.type || ActivityType.RUN);
  const [date, setDate] = useState<string>(formatDateForInput(activityToEdit ? new Date(activityToEdit.date + 'T00:00:00') : initialDate || new Date()));
  const [durationMinutes, setDurationMinutes] = useState<number>(activityToEdit?.durationMinutes || 30);
  const [distanceKm, setDistanceKm] = useState<number | undefined>(activityToEdit?.distanceKm || undefined);
  const [notes, setNotes] = useState<string>(activityToEdit?.notes || '');

  useEffect(() => {
    if (activityToEdit) {
      setActivityType(activityToEdit.type);
      setDate(formatDateForInput(new Date(activityToEdit.date + 'T00:00:00'))); // Ensure correct date parsing
      setDurationMinutes(activityToEdit.durationMinutes);
      setDistanceKm(activityToEdit.distanceKm);
      setNotes(activityToEdit.notes || '');
    } else if (initialDate) {
      setDate(formatDateForInput(initialDate));
      // Reset other fields for new activity on a specific date
      setActivityType(ActivityType.RUN);
      setDurationMinutes(30);
      setDistanceKm(undefined);
      setNotes('');
    }
  }, [activityToEdit, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const activityData: Omit<Activity, 'id'> = {
      type: activityType,
      date: date, // Date is already YYYY-MM-DD string
      durationMinutes: Number(durationMinutes),
      distanceKm: activityType === ActivityType.RUN ? Number(distanceKm) || undefined : undefined,
      notes,
    };
    if (activityToEdit) {
      onSave({ ...activityData, id: activityToEdit.id });
    } else {
      onSave(activityData);
    }
    onCancel(); // Close modal after save
  };
  
  const inputBaseClass = "block w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-slate-200 placeholder-slate-400 text-sm transition-colors duration-150 ease-in-out";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="activityType" className="block text-sm font-medium text-sky-300 mb-1">Activity Type</label>
        <select
          id="activityType"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value as ActivityType)}
          className={inputBaseClass}
          required
        >
          {Object.values(ActivityType).map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date" className="block text-sm font-medium text-sky-300 mb-1">Date</label>
        <input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputBaseClass}
          required
        />
      </div>

      <div>
        <label htmlFor="durationMinutes" className="block text-sm font-medium text-sky-300 mb-1">Duration (minutes)</label>
        <input
          type="number"
          id="durationMinutes"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value, 10)))}
          className={inputBaseClass}
          min="1"
          required
        />
      </div>

      {activityType === ActivityType.RUN && (
        <div>
          <label htmlFor="distanceKm" className="block text-sm font-medium text-sky-300 mb-1">Distance (km)</label>
          <input
            type="number"
            id="distanceKm"
            value={distanceKm === undefined ? '' : distanceKm}
            onChange={(e) => setDistanceKm(e.target.value ? parseFloat(e.target.value) : undefined)}
            className={inputBaseClass}
            min="0"
            step="0.1"
          />
        </div>
      )}

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-sky-300 mb-1">Notes (optional)</label>
        <textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputBaseClass}
          placeholder="e.g., Morning run, felt good. Swim focused on drills."
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
        >
          {activityToEdit ? 'Save Changes' : 'Add Activity'}
        </button>
      </div>
    </form>
  );
};

export default ActivityForm;
