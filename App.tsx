import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppRoute, Task, CalendarEvent, FocusLog, UserIdentity } from './types';
import { Plus, Sparkles } from 'lucide-react';
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
import { tourSteps } from './config/tourSteps';
import FocusAnalysisView from './components/FocusAnalysisView';
import CalendarAdminView from './components/CalendarAdminView';

// Tour steps are now imported from config/tourSteps.ts

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
  const [placedItems, setPlacedItems] = useState<{ id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string }[]>([]);
  const [visibleSubSections, setVisibleSubSections] = useState<Record<string, string[]>>({
    focus: ['tasks', 'timer', 'analysis'],
    calendar: ['calendar_card'],
    games: ['pets', 'race', 'ranking']
  });
  const [appSettings, setAppSettings] = useState({
    timerEndNotify: true,
    timerWarnTime: 2,
    focusReminder: true,
    focusReminderInterval: 10,
    appBlockerFocus: true,
    appBlockerBreak: false
  });

  // Timer States (Shared across Home & Focus)
  const [timerTotalTime, setTimerTotalTime] = useState(1500);
  const [timerTimeLeft, setTimerTimeLeft] = useState(1500);
  const [timerIsActive, setTimerIsActive] = useState(false);
  const [timerIsStrict, setTimerIsStrict] = useState(false);
  const [timerInterruptionCount, setTimerInterruptionCount] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);

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
    // Only trigger if important conditions change
    const canShow =
      user &&
      hasCompletedOnboarding === true &&
      hasCompletedTour === false &&
      currentRoute === AppRoute.HOME &&
      !isInitializing;

    if (canShow && !isTourVisible) {
      console.log('Tour criteria met, starting delay...');
      const timer = setTimeout(() => {
        console.log('Setting isTourVisible to true');
        setIsTourVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (isTourVisible && !canShow) {
      console.log('Tour condition no longer met, hiding tour');
      setIsTourVisible(false);
    }
  }, [hasCompletedOnboarding, hasCompletedTour, currentRoute, isInitializing, isTourVisible, user]);

  const fetchUserData = async (authUser: User) => {
    console.log('Fetching data for user:', authUser.id);
    setIsLoadingData(true);
    try {
      const authName =
        authUser.user_metadata?.full_name ||
        authUser.user_metadata?.display_name ||
        authUser.user_metadata?.name ||
        authUser.email?.split('@')[0] ||
        'Focus User';
      const authEmail = authUser.email || 'user@example.com';
      const authAvatar = authUser.user_metadata?.avatar_url ||
        authUser.user_metadata?.picture || '';
      const isGoogleUser = authUser.app_metadata?.provider === 'google';

      // localStorage key，用來備份 onboarding/tour 狀態
      const localOnboardingKey = `focus_onboarding_${authUser.id}`;
      const localTourKey = `focus_tour_${authUser.id}`;

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
        console.log('Existing user:', data.email, '| authName:', authName);

        // ── Onboarding / Tour 狀態（三層保險） ─────────────────────────
        // 1) DB 欄位（執行 SQL 後才有）
        // 2) user_profile JSON 內嵌（不需要額外欄位，最穩健）
        // 3) localStorage（同一瀏覽器備份）
        const storedMeta = data.user_profile || {};
        const localOnboardingDone = localStorage.getItem(localOnboardingKey) === 'true';
        const localTourDone = localStorage.getItem(localTourKey) === 'true';

        const onboardingDone =
          data.has_completed_onboarding === true ||   // DB 欄位
          storedMeta._onboardingDone === true ||       // user_profile JSON
          localOnboardingDone;                         // localStorage

        const tourDone =
          data.has_completed_tour === true ||
          storedMeta._tourDone === true ||
          localTourDone;

        console.log('App Data Sync - Onboarding:', onboardingDone, '(DB:', !!data.has_completed_onboarding, 'JSON:', !!storedMeta._onboardingDone, 'Local:', !!localOnboardingDone, ')');
        console.log('App Data Sync - Tour:', tourDone, '(DB:', !!data.has_completed_tour, 'JSON:', !!storedMeta._tourDone, 'Local:', !!localOnboardingDone, ')');

        setHasCompletedOnboarding(onboardingDone);
        setHasCompletedTour(tourDone);

        // 若 DB 欄位存在但和本地不一致，修復 DB 欄位
        if (onboardingDone && !data.has_completed_onboarding) {
          supabase.from('users').update({ has_completed_onboarding: true, updated_at: new Date().toISOString() }).eq('id', authUser.id).then(() => { });
        }
        if (tourDone && !data.has_completed_tour) {
          supabase.from('users').update({ has_completed_tour: true, updated_at: new Date().toISOString() }).eq('id', authUser.id).then(() => { });
        }


        if (data.points !== undefined) _setCoins(data.points);
        if (data.tasks) setTasks(data.tasks);
        if (data.home_config) setHomeSections(data.home_config);
        if (data.placed_items) setPlacedItems(data.placed_items);
        if (storedMeta._visibleSubSections) setVisibleSubSections(storedMeta._visibleSubSections);
        if (storedMeta._appSettings) setAppSettings(storedMeta._appSettings);
        if (data.focus_logs) setFocusLogs(data.focus_logs);
        else if (storedMeta._focusLogs) setFocusLogs(storedMeta._focusLogs);

        // ── 個人資料同步 ─────────────────────────────────────────────────
        const storedProfile = data.user_profile || {};
        const emailPrefix = authEmail.split('@')[0];

        // 「預設名字」定義：空值、'Focus User'、email 前綴、picsum 隨機
        const isDefaultName = !storedProfile.name ||
          storedProfile.name === 'Focus User' ||
          storedProfile.name === '' ||
          storedProfile.name === emailPrefix; // 舊版本會存 email 前綴，也視為未自訂

        const isDefaultAvatar = !storedProfile.avatar ||
          storedProfile.avatar.includes('picsum.photos/seed/user');

        const syncedProfile = {
          ...storedProfile,
          email: authEmail,  // 永遠同步 auth email
          // Google 用戶：永遠用真實名字；Email 用戶：只在預設時更新
          name: (isGoogleUser || isDefaultName) ? authName : storedProfile.name,
          avatar: (isDefaultAvatar && authAvatar) ? authAvatar : (storedProfile.avatar || authAvatar || userProfile.avatar),
        };
        setUserProfile(syncedProfile);
      } else {
        // ── 全新使用者 ───────────────────────────────────────────────────
        console.log('New user, initializing...');

        // 清除舊的 localStorage，避免舊資料誤判為「已完成」
        // （例如：之前測試留下的 key、不同 port 的殘留）
        localStorage.removeItem(localOnboardingKey);
        localStorage.removeItem(localTourKey);

        setHasCompletedOnboarding(false);
        setHasCompletedTour(false);

        // 注意：不把 has_completed_onboarding / has_completed_tour 放進 upsert payload
        // 因為若 DB 欄位不存在，整個 upsert 會失敗！
        // 這兩個狀態改由 user_profile._onboardingDone / _tourDone 追蹤
        const initialData = {
          id: authUser.id,
          email: authEmail,
          points: 0,
          home_config: ['focus', 'calendar', 'games'],
          placed_items: [],
          tasks: [],
          user_profile: {
            ...userProfile,
            name: authName,
            email: authEmail,
            avatar: authAvatar || userProfile.avatar,
            _onboardingDone: false,
            _tourDone: false,
            _authProvider: authUser.app_metadata?.provider || 'email',
            _focusLogs: [],
            _visibleSubSections: {
              focus: ['tasks', 'timer', 'analysis'],
              calendar: ['calendar_card'],
              games: ['pets', 'race', 'ranking']
            },
            _appSettings: {
              timerEndNotify: true,
              timerWarnTime: 2,
              focusReminder: true,
              focusReminderInterval: 10,
              appBlockerFocus: true,
              appBlockerBreak: false
            },
            registrationDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
          }
        };

        const { error: upsertError } = await supabase.from('users').upsert(initialData, { onConflict: 'id' });
        if (upsertError) {
          console.error('Upsert user error:', upsertError);
          // 即使 upsert 失敗，UI 仍繼續（依靠 localStorage 備份）
        } else {
          // 成功後，才嘗試更新 has_completed_onboarding/tour 欄位（可選，若欄位不存在也沒關係）
          supabase.from('users')
            .update({
              has_completed_onboarding: false,
              has_completed_tour: false,
              updated_at: new Date().toISOString()
            })
            .eq('id', authUser.id)
            .then(() => { }, () => { }); // 欄位不存在時靜默忽略
        }

        setTasks([]);
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
          // 加入 updated_at 以嘗試修復 Supabase Trigger 錯誤 "record new has no field updated_at"
          updated_at: new Date().toISOString(),
          user_profile: {
            ...userProfile,
            _authProvider: user.app_metadata?.provider || 'email',
            _focusLogs: focusLogs,
            _visibleSubSections: visibleSubSections,
            _appSettings: appSettings,
            _onboardingDone: hasCompletedOnboarding,
            _tourDone: hasCompletedTour
          }
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
  }, [coins, tasks, homeSections, placedItems, userProfile, focusLogs, user, isLoadingData, visibleSubSections, appSettings]);

  const MAX_COINS = 9999;

  const setCoins = (updater: React.SetStateAction<number>) => {
    _setCoins(prev => {
      const next = typeof updater === 'function' ? (updater as (prev: number) => number)(prev) : updater;
      return Math.max(0, Math.min(next, MAX_COINS));
    });
  };



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

  const saveFocusLog = useCallback((seconds: number) => {
    if (seconds < 60) { // 1 minute threshold
      setSessionStartTime(null);
      setTimerInterruptionCount(0);
      return;
    }

    const endTime = new Date().toISOString();
    const startTime = sessionStartTime || new Date(Date.now() - seconds * 1000).toISOString();
    const duration = Math.round(seconds / 60);

    const newLog: FocusLog = {
      id: crypto.randomUUID(),
      startTime,
      endTime,
      duration,
      interruptionCount: timerInterruptionCount
    };

    setFocusLogs(prev => [...prev, newLog]);
    setTimerInterruptionCount(0);
    setSessionStartTime(null);
  }, [sessionStartTime, timerInterruptionCount, setFocusLogs]);

  useEffect(() => {
    let interval: any = null;
    if (timerIsActive && timerTimeLeft > 0) {
      if (!sessionStartTime) setSessionStartTime(new Date().toISOString());
      interval = setInterval(() => {
        setTimerTimeLeft(t => t - 1);
      }, 1000);
    } else if (timerTimeLeft === 0 && timerIsActive) {
      setTimerIsActive(false);
      setCoins(c => c + 500);
      saveFocusLog(timerTotalTime);
      alert("太棒了！專注時段已結束。");
    }
    return () => clearTimeout(interval);
  }, [timerIsActive, timerTimeLeft, timerTotalTime, sessionStartTime, saveFocusLog]);

  // Handle manual stop/pause logging
  useEffect(() => {
    if (!timerIsActive && sessionStartTime && timerTimeLeft > 0) {
      const secondsSpent = timerTotalTime - timerTimeLeft;
      saveFocusLog(secondsSpent);
    }
  }, [timerIsActive, sessionStartTime, timerTimeLeft, timerTotalTime, saveFocusLog]);

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

      // Determine target level based on milestones reached
      const milestonesReached = (has10Emojis ? 1 : 0) + (has2Wins ? 1 : 0) + (hasVisitedAll ? 1 : 0);

      if (milestonesReached > userProfile.level) {
        setUserProfile(prev => ({
          ...prev,
          level: milestonesReached,
          winsTowardsNextLevel: has2Wins ? 0 : prev.winsTowardsNextLevel,
        }));
        alert(`恭喜！你升到了 Lv.${milestonesReached}`);
      }
    };

    const timer = setTimeout(checkLevelUp, 1000);
    return () => clearTimeout(timer);
  }, [placedItems, userProfile.winsTowardsNextLevel, userProfile.visitedRoutes]);



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
        return <HomeView
          navigateTo={navigateTo}
          tasks={tasks}
          setTasks={setTasks}
          toggleTask={toggleTask}
          archiveTask={archiveTask}
          calendarEvents={calendarEvents}
          sections={homeSections}
          setSections={setHomeSections}
          visibleSubSections={visibleSubSections}
          setVisibleSubSections={setVisibleSubSections}
          userProfile={userProfile}
          focusLogs={focusLogs}
          activeSessionSeconds={timerIsActive ? (timerTotalTime - timerTimeLeft) : 0}
          isTourVisible={isTourVisible}
          timerTimeLeft={timerTimeLeft}
          timerTotalTime={timerTotalTime}
        />;
      case AppRoute.FOCUS_TIMER:
        return <FocusTimerView
          navigateTo={navigateTo}
          totalTime={timerTotalTime}
          setTotalTime={setTimerTotalTime}
          timeLeft={timerTimeLeft}
          setTimeLeft={setTimerTimeLeft}
          isActive={timerIsActive}
          setIsActive={setTimerIsActive}
          isStrict={timerIsStrict}
          setIsStrict={setTimerIsStrict}
          interruptionCount={timerInterruptionCount}
          setInterruptionCount={setTimerInterruptionCount}
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
        return <SettingsView 
          navigateTo={navigateTo} 
          onResetTour={handleResetTour}
          appSettings={appSettings}
          setAppSettings={setAppSettings}
        />;
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
        return <FocusAnalysisView 
          navigateTo={navigateTo} 
          focusLogs={focusLogs} 
          activeSessionSeconds={timerIsActive ? (timerTotalTime - timerTimeLeft) : 0}
        />;
      case AppRoute.CALENDAR_ADMIN:
        return <CalendarAdminView navigateTo={navigateTo} events={calendarEvents} setEvents={setCalendarEvents} />;
      default:
        return <HomeView
          navigateTo={navigateTo}
          tasks={tasks}
          setTasks={setTasks}
          toggleTask={toggleTask}
          archiveTask={archiveTask}
          calendarEvents={calendarEvents}
          sections={homeSections}
          setSections={setHomeSections}
          visibleSubSections={visibleSubSections}
          setVisibleSubSections={setVisibleSubSections}
          userProfile={userProfile}
          focusLogs={focusLogs}
          activeSessionSeconds={timerIsActive ? (timerTotalTime - timerTimeLeft) : 0}
          isTourVisible={isTourVisible}
          timerTimeLeft={timerTimeLeft}
          timerTotalTime={timerTotalTime}
        />;
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
      localStorage.setItem(`focus_onboarding_${user.id}`, 'true');
      setUserProfile(prev => ({ ...prev, _onboardingDone: true }));

      // Explicitly go to HOME to start the tour
      navigateTo(AppRoute.HOME);

      // Step 1: 先儲存 user_profile JSON（最關鍵，不依賴額外欄位）
      try {
        await supabase.from('users').update({
          user_profile: { ...userProfile, _onboardingDone: true },
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      } catch (e) {
        console.error('Failed to save _onboardingDone to user_profile:', e);
      }

      // Step 2: 嘗試更新 has_completed_onboarding 欄位（若欄位不存在也沒關係）
      supabase.from('users')
        .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => { }, () => { });
    } else {
      navigateTo(AppRoute.HOME);
    }
  };

  const handleTourComplete = async () => {
    setIsTourVisible(false);
    setHasCompletedTour(true);

    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (user) {
      localStorage.setItem(`focus_tour_${user.id}`, 'true');
      setUserProfile(prev => ({ ...prev, _tourDone: true }));

      // Step 1: 先儲存 user_profile JSON
      try {
        await supabase.from('users').update({
          user_profile: { ...userProfile, _tourDone: true },
          updated_at: new Date().toISOString()
        }).eq('id', user.id);
      } catch (e) {
        console.error('Failed to save _tourDone to user_profile:', e);
      }

      // Step 2: 嘗試更新 has_completed_tour 欄位
      supabase.from('users')
        .update({ has_completed_tour: true, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(() => { }, () => { });
    }
  };

  // 讓使用者可以從設定頁重新觀看功能導覽
  const handleResetTour = () => {
    setHasCompletedTour(false);
    setIsTourVisible(false);
    if (user) {
      localStorage.removeItem(`focus_tour_${user.id}`);
      setUserProfile(prev => ({ ...prev, _tourDone: false }));
      supabase.from('users').update({
        has_completed_tour: false,
        updated_at: new Date().toISOString(),
        user_profile: { ...userProfile, _tourDone: false }
      }).eq('id', user.id).then(() => {
        // Force re-trigger check
        setTimeout(() => {
          navigateTo(AppRoute.HOME);
          // Small delay to ensure state propagates then show tour
          setTimeout(() => setIsTourVisible(true), 500);
        }, 100);
      }, (err) => {
        console.error("Reset tour sync failed:", err);
        navigateTo(AppRoute.HOME);
        setTimeout(() => setIsTourVisible(true), 500);
      });
    } else {
      navigateTo(AppRoute.HOME);
      setTimeout(() => setIsTourVisible(true), 500);
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
      setPlacedItems([]);
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
      setPlacedItems([]);
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

      {/* Feature Tour moved to bottom to ensure maximum z-index visibility */}
      <FeatureTour
        steps={tourSteps}
        isVisible={isTourVisible}
        onComplete={handleTourComplete}
      />
    </div>
  );
};

export default App;
