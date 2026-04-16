export type UserIdentity = 'high_school' | 'university' | 'other';

export interface UserProfile {
  name: string;
  bio: string;
  avatar: string;
  level: number;
  winsTowardsNextLevel: number;
  visitedRoutes: AppRoute[];
  email: string;
  identity: UserIdentity;
  registrationDate: string;
}

export interface AppSettings {
  timerEndNotify: boolean;
  timerWarnTime: number;
  focusReminder: boolean;
  focusReminderInterval: number;
  appBlockerFocus: boolean;
  appBlockerBreak: boolean;
}

export interface PetItem {
  id: string;
  x: number;
  y: number;
  char: string;
  isReacting: boolean;
  clickCount: number;
  areaId: string;
  hunger: number;
  thirst: number;
  affection: number;
  isDead: boolean;
  dailyFood: number;
  dailyWater: number;
  dailyAffection: number;
  lastCareDate: string;
}
export interface Task {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
  importance?: number; // 1-5
  urgency?: number;    // 1-5
}

export interface FocusLog {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  taskId?: string;
  taskTitle?: string;
  interruptionCount: number;
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
  isPreset?: boolean; // 預設行事曆事件（由身份自動產生）
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
  CHANGE_EMAIL = 'change-email',
  FOCUS_ANALYSIS = 'focus-analysis',
  CALENDAR_ADMIN = 'calendar-admin'
}

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  navigateTo?: string;
}
