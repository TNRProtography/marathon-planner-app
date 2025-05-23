
import React from 'react';
import { Activity, ActivityType, DayWithActivities } from '../types';

interface CalendarViewProps {
  activities: Activity[];
  onDayClick: (date: Date) => void;
  onActivityClick: (activity: Activity) => void;
  currentCalendarDate: Date;
  setCurrentCalendarDate: (date: Date) => void;
}

const activityColorMap: Record<ActivityType, string> = {
  [ActivityType.RUN]: 'bg-green-600/80 hover:bg-green-500/90 border-green-500',
  [ActivityType.SWIM]: 'bg-sky-600/80 hover:bg-sky-500/90 border-sky-500',
  [ActivityType.REST]: 'bg-slate-600/80 hover:bg-slate-500/90 border-slate-500',
};
const activityTextColorMap: Record<ActivityType, string> = {
  [ActivityType.RUN]: 'text-green-100',
  [ActivityType.SWIM]: 'text-sky-100',
  [ActivityType.REST]: 'text-slate-100',
};

const CalendarView: React.FC<CalendarViewProps> = ({ activities, onDayClick, onActivityClick, currentCalendarDate, setCurrentCalendarDate }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize today's date

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth: DayWithActivities[] = [];
  
  // Add days from previous month for padding
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
  const daysToPadAtStart = startDayOfWeek === 0 ? 6 : startDayOfWeek -1; // Assuming Monday start

  for (let i = 0; i < daysToPadAtStart; i++) {
    const date = new Date(year, month, 0 - i); // Days from previous month
     daysInMonth.unshift({ 
        date, 
        activities: [], 
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime()
    });
  }

  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day);
    const dayActivities = activities.filter(
      (act) => new Date(act.date + 'T00:00:00').toDateString() === date.toDateString()
    );
    daysInMonth.push({ 
        date, 
        activities: dayActivities.sort((a,b) => a.durationMinutes - b.durationMinutes), 
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime()
    });
  }

  // Add days from next month for padding
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const daysToPadAtEnd = (7 - (lastDayOfWeek === 0 ? 7 : lastDayOfWeek)) % 7;

  for (let i = 1; i <= daysToPadAtEnd; i++) {
    const date = new Date(year, month + 1, i);
    daysInMonth.push({ 
        date, 
        activities: [], 
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime()
    });
  }

  const changeMonth = (offset: number) => {
    setCurrentCalendarDate(new Date(year, month + offset, 1));
  };
  
  const changeYear = (offset: number) => {
    setCurrentCalendarDate(new Date(year + offset, month, 1));
  };

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="p-4 bg-slate-800 rounded-xl shadow-2xl border border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
            <button onClick={() => changeYear(-1)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Previous year">
                &laquo; Year
            </button>
            <button onClick={() => changeMonth(-1)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Previous month">
                &lsaquo; Month
            </button>
        </div>
        <h2 className="text-2xl font-semibold text-sky-300">
          {currentCalendarDate.toLocaleString('default', { month: 'long' })} {year}
        </h2>
        <div className="flex items-center space-x-2">
            <button onClick={() => changeMonth(1)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Next month">
                Month &rsaquo;
            </button>
            <button onClick={() => changeYear(1)} className="p-2 rounded-md hover:bg-slate-700 transition-colors" aria-label="Next year">
                Year &raquo;
            </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-700 border border-slate-700">
        {weekdays.map(day => (
          <div key={day} className="text-center font-medium text-slate-400 py-3 bg-slate-800 text-xs sm:text-sm">
            {day}
          </div>
        ))}
        {daysInMonth.map(({ date, activities: dayActivities, isCurrentMonth, isToday }, index) => (
          <div
            key={index}
            className={`p-1.5 min-h-[6rem] sm:min-h-[7rem] relative flex flex-col
                        ${isCurrentMonth ? 'bg-slate-800/70 hover:bg-slate-700/70' : 'bg-slate-800/30 text-slate-600 hover:bg-slate-700/30'} 
                        ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''}
                        transition-colors duration-150 cursor-pointer group`}
            onClick={() => onDayClick(date)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onDayClick(date)}
            aria-label={`Date ${date.toLocaleDateString()}, ${dayActivities.length} activities. Click to add activity.`}
          >
            <span className={`text-xs sm:text-sm font-medium ${isCurrentMonth ? (isToday ? 'text-sky-300' : 'text-slate-300') : 'text-slate-500'}`}>
              {date.getDate()}
            </span>
            <div className="mt-1 space-y-1 overflow-y-auto flex-grow max-h-[70px] sm:max-h-[80px]">
              {dayActivities.map(activity => (
                <button
                  key={activity.id}
                  onClick={(e) => { e.stopPropagation(); onActivityClick(activity);}}
                  className={`w-full text-left px-1.5 py-0.5 text-[0.6rem] sm:text-xs rounded-sm ${activityColorMap[activity.type]} ${activityTextColorMap[activity.type]} truncate border transition-all duration-150 ease-in-out group-hover:opacity-90 hover:!opacity-100 hover:shadow-md`}
                  aria-label={`Edit ${activity.type} on ${date.toLocaleDateString()}: ${activity.durationMinutes} min ${activity.type === ActivityType.RUN && activity.distanceKm ? `, ${activity.distanceKm} km` : ''}`}
                >
                  {activity.type === ActivityType.REST ? 'Rest' : `${activity.type.slice(0,1)}:${activity.durationMinutes}m`}
                  {activity.type === ActivityType.RUN && activity.distanceKm ? ` (${activity.distanceKm}k)` : ''}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
       <button 
            onClick={() => setCurrentCalendarDate(new Date())} 
            className="mt-4 mx-auto block px-4 py-2 text-sm font-medium text-sky-300 bg-slate-700 hover:bg-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 transition-colors"
            aria-label="Go to Today"
        >
            Go to Today
        </button>
    </div>
  );
};

export default CalendarView;
