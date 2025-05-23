
import React from 'react';
import { Activity, ActivityType } from '../types';

interface ScheduleViewProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
}

const activityColorStyles: Record<ActivityType, { border: string, bg: string, text: string }> = {
  [ActivityType.RUN]: { border: 'border-green-500', bg: 'bg-green-700/30', text: 'text-green-300' },
  [ActivityType.SWIM]: { border: 'border-sky-500', bg: 'bg-sky-700/30', text: 'text-sky-300' },
  [ActivityType.REST]: { border: 'border-slate-500', bg: 'bg-slate-700/30', text: 'text-slate-300' },
};

const ScheduleView: React.FC<ScheduleViewProps> = ({ activities, onEditActivity, onDeleteActivity }) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 bg-slate-800 rounded-xl shadow-xl border border-slate-700 text-center">
        <h3 className="text-xl font-semibold text-slate-300 mb-2">No Activities Planned Yet</h3>
        <p className="text-slate-400">Click "Add Activity" to start planning your training schedule.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed in local timezone by appending time
    return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {activities.map(activity => (
        <div 
          key={activity.id} 
          className={`p-4 rounded-lg shadow-lg border-l-4 ${activityColorStyles[activity.type].border} ${activityColorStyles[activity.type].bg} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}
        >
          <div className="flex-grow">
            <div className="flex items-center gap-3 mb-1 sm:mb-0">
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${activityColorStyles[activity.type].bg.replace('/30', '/80')} ${activityColorStyles[activity.type].text.replace('-300', '-100')}`}>
                {activity.type}
              </span>
              <h3 className={`text-lg font-semibold ${activityColorStyles[activity.type].text}`}>
                {formatDate(activity.date)}
              </h3>
            </div>
            <p className="text-slate-300 text-sm">
              Duration: {activity.durationMinutes} minutes
              {activity.type === ActivityType.RUN && activity.distanceKm && (
                <span className="ml-2">| Distance: {activity.distanceKm} km</span>
              )}
            </p>
            {activity.notes && (
              <p className="text-slate-400 text-xs mt-1 italic">Notes: {activity.notes}</p>
            )}
          </div>
          <div className="flex space-x-2 mt-2 sm:mt-0 self-end sm:self-center">
            <button 
              onClick={() => onEditActivity(activity)}
              className="px-3 py-1 text-xs font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
              aria-label={`Edit ${activity.type} on ${formatDate(activity.date)}`}
            >
              Edit
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete this ${activity.type} activity on ${formatDate(activity.date)}?`)) {
                  onDeleteActivity(activity.id);
                }
              }}
              className="px-3 py-1 text-xs font-medium text-red-400 bg-slate-700 hover:bg-red-600/50 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors"
              aria-label={`Delete ${activity.type} on ${formatDate(activity.date)}`}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleView;
