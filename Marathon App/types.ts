
export enum ActivityType {
  RUN = 'Run',
  SWIM = 'Swim',
  REST = 'Rest',
}

export interface Activity {
  id: string;
  type: ActivityType;
  date: string; // ISO date string (e.g., "2024-07-15")
  durationMinutes: number;
  distanceKm?: number; // Optional, only for runs
  notes?: string;
}

export type ViewMode = 'calendar' | 'schedule'; // For the main planner view

export interface DayWithActivities {
  date: Date;
  activities: Activity[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface SuggestedActivity {
  date: string; // ISO date string (e.g., "2024-07-15")
  type: ActivityType;
  durationMinutes: number;
  distanceKm?: number;
  notes?: string;
}

export enum ShiftType {
  AM = "AM (6:45)",
  PM = "PM (2:45)",
  NIGHT = "Night (11:45)",
  OFF = "Day Off",
}

export interface WorkDay {
  date: string; // YYYY-MM-DD
  dayName: string; // e.g., "Monday"
  shift: ShiftType;
}

// For weekly plan generation requests
export interface UserPreferencesData {
  generalNotes: string; // Specific notes for *this* week's plan
  workSchedule: WorkDay[];
  planStartDate: string; // YYYY-MM-DD
  lastWeekFeedback?: string; // Optional feedback on the *previous* week
}

// For persistent, long-term training goals
export interface TrainingGoalData {
  marathonGoalTime: string; // e.g., "Under 5 hours", "4:30:00"
  currentComfortablePace: string; // e.g., "7:30 min/km"
  currentFastestPace: string; // e.g., "6:30 min/km"
  fitnessLevel: 'Beginner' | 'Intermediate' | 'Advanced'; // Current fitness level
  marathonDate?: string; // YYYY-MM-DD, optional
  longTermNotes?: string; // Optional general notes about training philosophy
}

export type MainView = 'planner' | 'goalSettings';
