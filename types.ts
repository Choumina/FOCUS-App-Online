
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  image: string;
}

export interface Item {
  id: string;
  name: string;
  price: number;
  image: string;
  type: 'background' | 'asset';
}

export interface CalendarEvent {
  id: string;
  date: string; // e.g., '2026-03-03'
  top: number;
  height: number;
  title: string;
  color: string; // e.g., 'bg-blue-500'
  isDraft?: boolean;
}

export enum AppRoute {
  HOME = 'home',
  FOCUS_TIMER = 'focus-timer',
  TASKS = 'tasks',
  GAME_PETS = 'game-pets',
  GAME_RACE = 'game-race',
  LEADERBOARD = 'leaderboard',
  SETTINGS = 'settings',
  AI_CHAT = 'ai-chat',
  CALENDAR_DETAIL = 'calendar-detail',
  PROFILE = 'profile',
  PROFILE_ACCOUNT = 'profile-account',
  PROFILE_NOTIFICATIONS = 'profile-notifications',
  PROFILE_EDIT = 'profile-edit',
  PROFILE_ARCHIVE = 'profile-archive',
  PROFILE_ARCHIVED_REMINDERS = 'profile-archived-reminders',
  CHANGE_EMAIL = 'change-email'
}
