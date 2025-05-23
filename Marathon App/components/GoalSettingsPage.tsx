
import React, { useState, useEffect } from 'react';
import { TrainingGoalData } from '../types';

interface GoalSettingsPageProps {
  initialGoals: TrainingGoalData;
  onSaveGoals: (goals: TrainingGoalData) => void;
  onCancel: () => void; // To go back to planner view
}

const GoalSettingsPage: React.FC<GoalSettingsPageProps> = ({ initialGoals, onSaveGoals, onCancel }) => {
  const [marathonGoalTime, setMarathonGoalTime] = useState(initialGoals.marathonGoalTime);
  const [currentComfortablePace, setCurrentComfortablePace] = useState(initialGoals.currentComfortablePace);
  const [currentFastestPace, setCurrentFastestPace] = useState(initialGoals.currentFastestPace);
  const [fitnessLevel, setFitnessLevel] = useState(initialGoals.fitnessLevel);
  const [marathonDate, setMarathonDate] = useState(initialGoals.marathonDate || '');
  const [longTermNotes, setLongTermNotes] = useState(initialGoals.longTermNotes || '');

  useEffect(() => {
    setMarathonGoalTime(initialGoals.marathonGoalTime);
    setCurrentComfortablePace(initialGoals.currentComfortablePace);
    setCurrentFastestPace(initialGoals.currentFastestPace);
    setFitnessLevel(initialGoals.fitnessLevel);
    setMarathonDate(initialGoals.marathonDate || '');
    setLongTermNotes(initialGoals.longTermNotes || '');
  }, [initialGoals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGoals({
      marathonGoalTime,
      currentComfortablePace,
      currentFastestPace,
      fitnessLevel,
      marathonDate: marathonDate || undefined, // Store as undefined if empty
      longTermNotes: longTermNotes || undefined, // Store as undefined if empty
    });
  };
  
  const inputBaseClass = "block w-full p-2.5 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500 text-slate-200 placeholder-slate-400 text-sm transition-colors duration-150 ease-in-out";
  const labelBaseClass = "block text-sm font-medium text-teal-300 mb-1";

  return (
    <div className="w-full max-w-2xl mx-auto mt-6 p-6 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <h2 className="text-3xl font-bold text-center text-teal-400 mb-8">Your Training Goals</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="marathonGoalTime" className={labelBaseClass}>
            Primary Marathon Goal
          </label>
          <input
            type="text"
            id="marathonGoalTime"
            value={marathonGoalTime}
            onChange={(e) => setMarathonGoalTime(e.target.value)}
            className={inputBaseClass}
            placeholder="e.g., Under 5 hours, Finish strong"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="currentComfortablePace" className={labelBaseClass}>
              Current Comfortable Pace
            </label>
            <input
              type="text"
              id="currentComfortablePace"
              value={currentComfortablePace}
              onChange={(e) => setCurrentComfortablePace(e.target.value)}
              className={inputBaseClass}
              placeholder="e.g., 7:30 min/km"
              required
            />
          </div>
          <div>
            <label htmlFor="currentFastestPace" className={labelBaseClass}>
              Current Fastest Pace (approx.)
            </label>
            <input
              type="text"
              id="currentFastestPace"
              value={currentFastestPace}
              onChange={(e) => setCurrentFastestPace(e.target.value)}
              className={inputBaseClass}
              placeholder="e.g., 6:30 min/km"
              required
            />
          </div>
        </div>
        
        <div>
            <label htmlFor="fitnessLevel" className={labelBaseClass}>
              Current Fitness Level
            </label>
            <select
              id="fitnessLevel"
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value as TrainingGoalData['fitnessLevel'])}
              className={inputBaseClass}
              required
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate" disabled>Intermediate (coming soon)</option>
              <option value="Advanced" disabled>Advanced (coming soon)</option>
            </select>
             <p className="mt-1 text-xs text-slate-400">Currently, plans are best tailored for Beginners.</p>
        </div>


        <div>
          <label htmlFor="marathonDate" className={labelBaseClass}>
            Target Marathon Date (Optional)
          </label>
          <input
            type="date"
            id="marathonDate"
            value={marathonDate}
            onChange={(e) => setMarathonDate(e.target.value)}
            className={inputBaseClass}
          />
        </div>

        <div>
          <label htmlFor="longTermNotes" className={labelBaseClass}>
            Long-term Training Notes/Philosophy (Optional)
          </label>
          <textarea
            id="longTermNotes"
            rows={3}
            value={longTermNotes}
            onChange={(e) => setLongTermNotes(e.target.value)}
            className={inputBaseClass}
            placeholder="e.g., Focus on injury prevention, enjoy the process, build mileage gradually."
          />
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-slate-300 bg-slate-600 hover:bg-slate-500 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
          >
            Back to Planner
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 transition-colors"
          >
            Save Goals
          </button>
        </div>
      </form>
    </div>
  );
};

export default GoalSettingsPage;
