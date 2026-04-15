import React, { useState, useEffect } from 'react';
import { AppRoute, Task, CalendarEvent, FocusLog, UserIdentity } from './types';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase, handleSupabaseError, OperationType } from './supabase';
import { User } from '@supabase/supabase-js';
import ConfirmationModal from './components/ConfirmationModal';
import HomeView from './components/HomeView';
import FocusTimerView from './components/FocusTimerView';
import TasksView from './components/TasksView';
import GameView from './components/GameView';
import RaceTrackView from './components/RaceTrackView';
import LeaderboardView from './components/LeaderboardView';
import SettingsView from './components/SettingsView';
import AIChatView from './components/AIChatView';
import CalendarDetailView from './components/CalendarDetailView';
import ProfileView from './components/ProfileView';
import AccountSettingsView from './components/AccountSettingsView';
import NotificationsView from './components/NotificationsView';
import EditProfileView from './components/EditProfileView';
import ArchiveView from './components/ArchiveView';
import ArchivedRemindersView from './components/ArchivedRemindersView';
import ChangeEmailView from './components/ChangeEmailView';
import Navigation from './components/Navigation';
import GameNavigation from './components/GameNavigation';
import LoginView from './components/LoginView';
import OnboardingView from './components/OnboardingView';
import FeatureTour from './components/FeatureTour';
import FocusAnalysisView from './components/FocusAnalysisView';
import CalendarAdminView from './components/CalendarAdminView';
import { ErrorBoundary } from './components/ErrorBoundary';

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(AppRoute.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean | null>(null);
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  
  // Persistence initialization
  const [coins, _setCoins] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [focusLogs, setFocusLogs] = useState<FocusLog[]>([]);
  const [homeSections, setHomeSections] = useState<string[]>(['focus', 'calendar', 'games']);
  const [activeAreas, setActiveAreas] = useState<string[]>(['blue']);
  const [purchasedBackgrounds, setPurchasedBackgrounds] = useState<string[]>([]);
  const [areaBackgrounds, setAreaBackgrounds] = useState<Record<string, string>>({});
  const [areaNames, setAreaNames] = useState<Record<string, string>>({ blue: '專案區域 A', yellow: '專案區域 B', green: '專案區域 C' });
  const [userProfile, setUserProfile] = useState({
    name: 'Focus User',
    bio: '專注於每一刻，成就更好的自己。',
    avatar: 'https://picsum.photos/seed/user/200',
    level: 0,
    winsTowardsNextLevel: 0,
    visitedRoutes: [AppRoute.HOME],
    email: 'user@example.com',
    identity: 'other' as UserIdentity,
    registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
  });
  const [lastBetAmount, setLastBetAmount] = useState(100);
  const [placedItems, setPlacedItems] = useState<{id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string}[]>([
    { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
    { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
  ]);

  const lastFetchedUserId = React.useRef<string | null>(null);

  // Auth & Data Fetching
  useEffect(() => {
    const checkSessionAndFetch = (sessionUser: User | null) => {
      if (sessionUser) {
        setUser(sessionUser);
        if (lastFetchedUserId.current !== sessionUser.id) {
          lastFetchedUserId.current = sessionUser.id;
          fetchUserData(sessionUser); // 傳入完整 User 物件
        }
      }
    };

    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isSignupVerification = window.location.hash.includes('type=signup');
      
      if (isSignupVerification && session?.user) {
        // 使用者點擊 email 驗證信，Supabase 預設會自動登入
        // 為了符合使用者的預期（進入登入畫面手動輸入），這裡強制登出
        supabase.auth.signOut().then(() => {
          checkSessionAndFetch(null);
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsInitializing(false);
        });
      } else {
        checkSessionAndFetch(session?.user || null);

        // Clean up OAuth or verification URL params
        const url = new URL(window.location.href);
        if (url.searchParams.has('code') || url.searchParams.has('token_hash') || window.location.hash.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        setIsInitializing(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isSignupVerification = window.location.hash.includes('type=signup');
      
      if (isSignupVerification && session?.user) {
        await supabase.auth.signOut();
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        checkSessionAndFetch(session?.user || null);
      } else if (event === 'SIGNED_OUT') {
        lastFetchedUserId.current = null;
        setUser(null);
        setIsInitializing(false);
        setHasCompletedOnboarding(null);
        setHasCompletedTour(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set tour visible after onboarding is cleared and user is on Home page
  useEffect(() => {
    if (user && hasCompletedOnboarding === true && hasCompletedTour === false && currentRoute === AppRoute.HOME && !isTourVisible) {
      const timer = setTimeout(() => setIsTourVisible(true), 1500); // 延長延遲確保 HomeView 已完全渲染
      return () => clearTimeout(timer);
    }
  }, [user, hasCompletedOnboarding, hasCompletedTour, currentRoute, isTourVisible]);

  const fetchUserData = async (authUser: User) => {
    console.log('Fetching data for user:', authUser.id);
    setIsLoadingData(true);
    try {
      // 直接使用已知的 User 物件，不再重新呼叫 getSession()，避免時序問題
      // Google OAuth: user_metadata.full_name / avatar_url
      // Email 註冊: user_metadata.display_name / full_name
      const authName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Focus User';
      const authEmail = authUser.email || 'user@example.com';
      // Google 登入會有 avatar_url
      const authAvatar = authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture || '';

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase fetch error:', error);
        handleSupabaseError(error, OperationType.GET, `users/${authUser.id}`);
      }

      if (data) {
        console.log('User data found:', data.email, '| authName:', authName);
        setHasCompletedOnboarding(data.has_completed_onboarding ?? false);
        setHasCompletedTour(data.has_completed_tour ?? false);
        if (data.points !== undefined) _setCoins(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.home_config) setHomeSections(data.home_config);
        if (data.placed_items) setPlacedItems(data.placed_items);
        if (data.focus_logs) setFocusLogs(data.focus_logs);

        // 每次登入都從 auth 同步最新 email、名字、大頭貼
        const storedProfile = data.user_profile || {};
        const isDefaultName = !storedProfile.name ||
          storedProfile.name === 'Focus User' ||
          storedProfile.name === '';
        const isDefaultAvatar = !storedProfile.avatar ||
          storedProfile.avatar.includes('picsum.photos/seed/user');
        const syncedProfile = {
          ...storedProfile,
          email: authEmail,
          name: isDefaultName ? authName : storedProfile.name,
          // Google 登入時同步大頭貼（如果使用者沒有手動更換過）
          avatar: (isDefaultAvatar && authAvatar) ? authAvatar : storedProfile.avatar,
        };
        setUserProfile(syncedProfile);
      } else {
        console.log('New user detected, initializing...');
        setHasCompletedOnboarding(false);
        setHasCompletedTour(false);
        const initialData = {
          id: authUser.id,
          email: authEmail,
          points: 0,
          has_completed_onboarding: false,
          has_completed_tour: false,
          home_config: ['focus', 'calendar', 'games'],
          placed_items: [
            { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
            { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
            { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
            { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
            { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
          ],
          tasks: [],
          auth_provider: authUser.app_metadata?.provider || 'email',
          user_profile: {
            ...userProfile,
            name: authName,
            email: authEmail,
            avatar: authAvatar || userProfile.avatar,
            registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
          },
          focus_logs: []
        };
        const { error: insertError } = await supabase.from('users').insert(initialData);
        if (insertError) {
          console.error('Insert user error:', insertError);
          handleSupabaseError(insertError, OperationType.CREATE, `users/${authUser.id}`);
        }
        setTasks(initialData.tasks);
        setUserProfile(initialData.user_profile);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Sync state to Supabase when it changes
  // 注意：has_completed_onboarding 和 has_completed_tour 不在此 sync 中，
  // 它們由 handleOnboardingComplete / handleTourComplete 直接更新，
  // 避免 stale closure 覆蓋正確值。
  useEffect(() => {
    if (!user || isLoadingData) return;
    const syncData = async () => {
      try {
        const { error } = await supabase.from('users').update({
          points: coins,
          tasks: tasks,
          home_config: homeSections,
          placed_items: placedItems,
          user_profile: userProfile,
          focus_logs: focusLogs,
          auth_provider: user.app_metadata.provider || 'email'
        }).eq('id', user.id);
        
        if (error) {
          console.error('Sync failed:', error.message);
        }
      } catch (error) {
        // Silent fail for background sync
      }
    };
    const timer = setTimeout(syncData, 2000); // Debounce sync
    return () => clearTimeout(timer);
  }, [coins, tasks, homeSections, placedItems, userProfile, focusLogs, user, isLoadingData]);

  const MAX_COINS = 9999;

  const setCoins = (updater: React.SetStateAction<number>) => {
    _setCoins(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: number) => number)(prev) : updater;
      return Math.max(0, Math.min(next, MAX_COINS));
    });
  };

  const [timerTotalTime, setTimerTotalTime] = useState(2400);
  const [timerTimeLeft, setTimerTimeLeft] = useState(2400);
  const [timerIsActive, setTimerIsActive] = useState(false);
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  const mainRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const resetScroll = () => {
      if (mainRef.current) {
        mainRef.current.scrollTop = 0;
      }
      window.scrollTo(0, 0);
    };
    
    resetScroll();
    // Use requestAnimationFrame and setTimeout to ensure scroll is reset after all renders and dnd-kit cleanups
    requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 50);
    return () => clearTimeout(timer);
  }, [currentRoute]);

  useEffect(() => {
    let interval: any = null;
    if (timerIsActive && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(t => t - 1);
      }, 1000);
    } else if (timerTimeLeft === 0 && timerIsActive) {
      setTimerIsActive(false);
      setCoins(c => c + 500);
      alert("太棒了！專注時段已結束。");
    }
    return () => clearInterval(interval);
  }, [timerIsActive, timerTimeLeft]);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    setUserProfile(prev => {
      if (prev.visitedRoutes.includes(route)) return prev;
      return { ...prev, visitedRoutes: [...prev.visitedRoutes, route] };
    });
  };

  // Level up logic
  useEffect(() => {
    const checkLevelUp = () => {
      let canLevelUp = false;
      
      // Condition 1: 10+ emojis
      const emojiCount = placedItems.filter(item => !['📺', '🚽', '🛁', '🚪', '🖼️'].includes(item.char)).length;
      const has10Emojis = emojiCount >= 10;

      // Condition 2: Win 2 horse races (tracked in winsTowardsNextLevel)
      const has2Wins = userProfile.winsTowardsNextLevel >= 2;

      // Condition 3: Visited all main routes (as a proxy for "clicked every button")
      const mainRoutes = [
        AppRoute.HOME, AppRoute.FOCUS_TIMER, AppRoute.TASKS, 
        AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD, 
        AppRoute.SETTINGS, AppRoute.AI_CHAT, AppRoute.CALENDAR_DETAIL, 
        AppRoute.PROFILE, AppRoute.PROFILE_ACCOUNT
      ];
      const hasVisitedAll = mainRoutes.every(r => userProfile.visitedRoutes.includes(r));

      if (has10Emojis || has2Wins || hasVisitedAll) {
        setUserProfile(prev => ({
          ...prev,
          level: prev.level + 1,
          winsTowardsNextLevel: has2Wins ? 0 : prev.winsTowardsNextLevel,
          // We don't reset visitedRoutes or emojiCount as they are cumulative/state-based
          // but for wins we reset as requested "升級後記得重新計算"
        }));
        alert(`恭喜！你升到了 Lv.${userProfile.level + 1}`);
      }
    };

    const timer = setTimeout(checkLevelUp, 1000);
    return () => clearTimeout(timer);
  }, [placedItems, userProfile.winsTowardsNextLevel, userProfile.visitedRoutes]);

  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      return newTasks.sort((a, b) => {
        if (a.completed === b.completed) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return a.completed ? 1 : -1;
      });
    });
  };

  const archiveTask = (id: string) => {
    const taskToArchive = tasks.find(t => t.id === id);
    if (taskToArchive) {
      setCoins(c => c + 50);
      setArchivedTasks(prev => [...prev, { ...taskToArchive, completed: true }]);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const renderView = () => {
    switch (currentRoute) {
      case AppRoute.HOME:
        return <HomeView navigateTo={navigateTo} tasks={tasks} setTasks={setTasks} toggleTask={toggleTask} archiveTask={archiveTask} calendarEvents={calendarEvents} sections={homeSections} setSections={setHomeSections} userProfile={userProfile} />;
      case AppRoute.FOCUS_TIMER:
        return <FocusTimerView 
          navigateTo={navigateTo} 
          totalTime={timerTotalTime}
          setTotalTime={setTimerTotalTime}
          timeLeft={timerTimeLeft}
          setTimeLeft={setTimerTimeLeft}
          isActive={timerIsActive}
          setIsActive={setTimerIsActive}
        />;
      case AppRoute.TASKS:
        return <TasksView 
          navigateTo={navigateTo} 
          tasks={tasks} 
          setTasks={setTasks} 
          toggleTask={toggleTask} 
          archiveTask={archiveTask} 
          isAdding={isAddingTask}
          setIsAdding={setIsAddingTask}
          newTitle={newTaskTitle}
          setNewTitle={setNewTaskTitle}
        />;
      case AppRoute.GAME_PETS:
        return <GameView 
          navigateTo={navigateTo} 
          coins={coins} 
          setCoins={setCoins} 
          placedItems={placedItems}
          setPlacedItems={setPlacedItems}
          activeAreas={activeAreas}
          setActiveAreas={setActiveAreas}
          purchasedBackgrounds={purchasedBackgrounds}
          setPurchasedBackgrounds={setPurchasedBackgrounds}
          areaBackgrounds={areaBackgrounds}
          setAreaBackgrounds={setAreaBackgrounds}
          areaNames={areaNames}
          setAreaNames={setAreaNames}
        />;
      case AppRoute.GAME_RACE:
        return <RaceTrackView 
          navigateTo={navigateTo} 
          coins={coins} 
          setCoins={setCoins} 
          lastBetAmount={lastBetAmount} 
          setLastBetAmount={setLastBetAmount} 
          setUserProfile={setUserProfile}
        />;
      case AppRoute.LEADERBOARD:
        return <LeaderboardView navigateTo={navigateTo} userProfile={userProfile} coins={coins} />;
      case AppRoute.SETTINGS:
        return <SettingsView navigateTo={navigateTo} />;
      case AppRoute.AI_CHAT:
        return <AIChatView navigateTo={navigateTo} setCalendarEvents={setCalendarEvents} tasks={tasks} />;
      case AppRoute.CALENDAR_DETAIL:
        return <CalendarDetailView 
          navigateTo={navigateTo} 
          events={calendarEvents} 
          setEvents={setCalendarEvents} 
        />;
      case AppRoute.PROFILE:
        return <ProfileView navigateTo={navigateTo} onLogout={handleLogout} userProfile={userProfile} />;
      case AppRoute.PROFILE_ACCOUNT:
        return <AccountSettingsView navigateTo={navigateTo} onDeleteAccount={handleDeleteAccount} userProfile={userProfile} authProvider={user?.app_metadata?.provider} />;
      case AppRoute.PROFILE_NOTIFICATIONS:
        return <NotificationsView navigateTo={navigateTo} />;
      case AppRoute.PROFILE_EDIT:
        return <EditProfileView navigateTo={navigateTo} userProfile={userProfile} setUserProfile={setUserProfile} setCalendarEvents={setCalendarEvents} />;
      case AppRoute.PROFILE_ARCHIVE:
        return <ArchiveView navigateTo={navigateTo} />;
      case AppRoute.PROFILE_ARCHIVED_REMINDERS:
        return <ArchivedRemindersView navigateTo={navigateTo} archivedTasks={archivedTasks} />;
      case AppRoute.CHANGE_EMAIL:
        return <ChangeEmailView navigateTo={navigateTo} userProfile={userProfile} setUserProfile={setUserProfile} />;
      case AppRoute.FOCUS_ANALYSIS:
        return <FocusAnalysisView navigateTo={navigateTo} focusLogs={focusLogs} />;
      case AppRoute.CALENDAR_ADMIN:
        return <CalendarAdminView navigateTo={navigateTo} events={calendarEvents} setEvents={setCalendarEvents} />;
      default:
        return <HomeView navigateTo={navigateTo} tasks={tasks} setTasks={setTasks} toggleTask={toggleTask} archiveTask={archiveTask} calendarEvents={calendarEvents} sections={homeSections} setSections={setHomeSections} userProfile={userProfile} focusLogs={focusLogs} />;
    }
  };

  const renderFAB = () => {
    if (currentRoute === AppRoute.TASKS) {
      return (
        <button 
          onClick={() => setIsAddingTask(true)}
          className="w-14 h-14 bg-blue-500 text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 border-4 border-white"
        >
          <Plus size={30} strokeWidth={3} />
        </button>
      );
    }
    if (currentRoute === AppRoute.CALENDAR_DETAIL) {
      return (
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('calendar-add-event'))}
          className="w-14 h-14 bg-red-500 text-white rounded-full shadow-2xl flex items-center justify-center transform transition-all hover:scale-110 active:scale-95 border-4 border-white"
        >
          <Plus size={30} strokeWidth={3} />
        </button>
      );
    }
    return null;
  };

  const handleOnboardingComplete = async () => {
    setHasCompletedOnboarding(true);
    if (user) {
      try {
        await supabase.from('users').update({ has_completed_onboarding: true }).eq('id', user.id);
      } catch (error) {
        handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const handleTourComplete = async () => {
    setIsTourVisible(false);
    setHasCompletedTour(true);
    
    // Smoothly scroll back to top after tour is finished
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (user) {
      try {
        await supabase.from('users').update({ has_completed_tour: true }).eq('id', user.id);
      } catch (error) {
        handleSupabaseError(error, OperationType.UPDATE, `users/${user.id}`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoadingData(true);
      await supabase.auth.signOut();
      
      // Reset local states to default values
      _setCoins(0);
      setTasks([]);
      setArchivedTasks([]);
      setHomeSections(['focus', 'calendar', 'games']);
      setPlacedItems([
        { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
      ]);
      setUserProfile({
        name: 'Focus User',
        bio: '專注於每一刻，成就更好的自己。',
        avatar: 'https://picsum.photos/seed/user/200',
        level: 0,
        winsTowardsNextLevel: 0,
        visitedRoutes: [AppRoute.HOME],
        email: 'user@example.com',
        identity: 'other' as UserIdentity,
        registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      });
      
      setCurrentRoute(AppRoute.HOME);
      setHasCompletedOnboarding(null);
      setHasCompletedTour(null);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setShowDeleteConfirm(true);
    setDeleteStep(1);
  };

  const executeDeleteAccount = async () => {
    if (!user) return;
    
    try {
      setIsLoadingData(true);
      setShowDeleteConfirm(false);
      const uid = user.id;
      
      // 1. Delete user data
      await supabase.from('users').delete().eq('id', uid);
      
      // 2. Delete Auth user (requires RPC or edge function usually, 
      // but for client-side we'll just logout for now, 
      // as deleting auth user directly from client is restricted)
      await supabase.auth.signOut();
      
      // 3. Reset local states
      _setCoins(0);
      setTasks([]);
      setArchivedTasks([]);
      setHomeSections(['focus', 'calendar', 'games']);
      setPlacedItems([
        { id: 'start1', x: 50, y: 50, char: '🦦', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start2', x: 20, y: 30, char: '📺', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'start3', x: 70, y: 20, char: '🧸', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env1', x: 15, y: 85, char: '🚽', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env2', x: 35, y: 85, char: '🛁', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env3', x: 85, y: 80, char: '🚪', isReacting: false, clickCount: 0, areaId: 'blue' },
        { id: 'env4', x: 80, y: 20, char: '🖼️', isReacting: false, clickCount: 0, areaId: 'blue' },
      ]);
      setUserProfile({
        name: 'Focus User',
        bio: '專注於每一刻，成就更好的自己。',
        avatar: 'https://picsum.photos/seed/user/200',
        level: 0,
        winsTowardsNextLevel: 0,
        visitedRoutes: [AppRoute.HOME],
        email: 'user@example.com',
        identity: 'other' as UserIdentity,
        registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
      });
      
      setHasCompletedOnboarding(null);
      setHasCompletedTour(null);
      setCurrentRoute(AppRoute.HOME);
    } catch (error: any) {
      console.error('Delete account failed:', error);
      alert('刪除帳號失敗，請稍後再試。');
    } finally {
      setIsLoadingData(false);
    }
  };

  const tourSteps = [
    {
      targetId: 'home-profile',
      title: '個人中心',
      content: '這裡是你的個人中心，點擊頭像可以進入帳號設定、查看等級與積分紀錄。'
    },
    {
      targetId: 'home-tasks',
      title: '提醒事項',
      content: '你最近的待辦任務會顯示在這裡，點擊卡片可以查看完整的任務清單。'
    },
    {
      targetId: 'home-timer',
      title: '番茄鐘',
      content: '想要開始一段專注時光嗎？點擊番茄鐘卡片進入專注計時器。'
    },
    {
      targetId: 'home-calendar',
      title: '行事曆',
      content: '這裡是你的月曆檢視，可以查看每天的行程安排與 AI 建議的學習進度。'
    },
    {
      targetId: 'home-games-area',
      title: '遊戲專區',
      content: '向下滾動即可看到遊戲專區！你可以在這裡與寵物互動、參加賽馬或查看积分排行榜。'
    },
    {
      targetId: 'nav-focus',
      title: 'Focus 核心',
      content: '底部選單可以隨時切換功能。這個按鈕會帶你回到目前的主頁面。'
    },
    {
      targetId: 'nav-game',
      title: '遊戲世界',
      content: '想休息一下？點擊這裡進入寵物空間，可以佈置你的房間或參加賽馬。'
    },
    {
      targetId: 'nav-ai',
      title: 'AI 助手',
      content: '這是你的學術夥伴！讓 AI 幫你拆解複雜任務、分析進度，助你一臂之力。'
    }
  ];

  // 1. Show a clean loading screen during initialization OR data fetching
  if (isInitializing || (user && hasCompletedOnboarding === null)) {
    return (
      <div className="h-[100dvh] w-full bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-blue-500 rounded-[2rem] flex items-center justify-center animate-pulse shadow-2xl shadow-blue-200">
           <Sparkles className="text-white" size={32} />
        </div>
        <p className="mt-6 text-gray-400 font-bold text-sm tracking-widest animate-pulse">LOADING FOCUS AI...</p>
      </div>
    );
  }

  // 2. Gatekeeper: If not logged in, ONLY show LoginView
  if (!user) {
    return <LoginView />;
  }

  // 3. Only after login and data is ready, check onboarding
  if (hasCompletedOnboarding === false) {
    return <OnboardingView onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] w-full bg-white shadow-xl relative overflow-hidden flex flex-col font-sans">
      <FeatureTour 
        steps={tourSteps} 
        isVisible={isTourVisible} 
        onComplete={handleTourComplete} 
      />
      
      <ConfirmationModal
        isOpen={showDeleteConfirm && deleteStep === 1}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => setDeleteStep(2)}
        title="確定要刪除帳號嗎？"
        message="此操作將永久刪除您的所有專注紀錄、金幣與寵物，且無法復原。"
        confirmText="下一步"
        type="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm && deleteStep === 2}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={executeDeleteAccount}
        title="最後確認"
        message="您真的要刪除帳號並抹除所有資料嗎？這將無法撤銷。"
        confirmText="永久刪除"
        type="danger"
      />

      <main ref={mainRef} className={`flex-1 ${currentRoute === AppRoute.AI_CHAT ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <div className={currentRoute === AppRoute.AI_CHAT ? "h-full" : "pb-20"}>
          {renderView()}
        </div>
      </main>
      {/* 只有在非 AI 聊天頁面才顯示全域導覽列 */}
      {currentRoute !== AppRoute.AI_CHAT && (
        <Navigation currentRoute={currentRoute} navigateTo={navigateTo} fab={renderFAB()} />
      )}
      
      {/* 遊戲子導覽列 - 當在遊戲相關頁面時顯示 */}
      {[AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD].includes(currentRoute) && (
        <GameNavigation currentRoute={currentRoute} navigateTo={navigateTo} />
      )}
    </div>
  );
};

export default App;
