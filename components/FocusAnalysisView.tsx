import React, { useState, useMemo } from 'react';
import { AppRoute, FocusLog } from '../types';
import ViewHeader from './ViewHeader';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { Clock, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface FocusAnalysisViewProps {
  navigateTo: (route: AppRoute) => void;
  focusLogs: FocusLog[];
  activeSessionSeconds?: number;
  isPremium: boolean;
  hasViewedAnalysis: boolean;
  setHasViewedAnalysis: (val: boolean) => void;
}

const FocusAnalysisView: React.FC<FocusAnalysisViewProps> = ({ 
  navigateTo, 
  focusLogs, 
  activeSessionSeconds = 0,
  isPremium,
  hasViewedAnalysis,
  setHasViewedAnalysis
}) => {
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('day');

  // Convert active seconds to minutes for the chart
  const activeMinutes = Math.floor(activeSessionSeconds / 60);

  // 處理數據：每日專注分鐘數
  const chartData = useMemo(() => {
    const now = new Date();
    const result = [];
    const todayStr = now.toISOString().split('T')[0];

    if (timeScale === 'day') {
      // 最近 7 天
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('zh-TW', { weekday: 'short' });
        
        const dayLogs = focusLogs.filter(log => log.startTime.startsWith(dateStr));
        let totalMinutes = dayLogs.reduce((acc, log) => acc + log.duration, 0);
        
        // Add live minutes if it's today
        if (dateStr === todayStr) {
          totalMinutes += activeMinutes;
        }

        const interruptions = dayLogs.reduce((acc, log) => acc + log.interruptionCount, 0);

        result.push({
          label: dayName,
          fullDate: dateStr,
          minutes: totalMinutes,
          interruptions: interruptions,
          count: dayLogs.length + (dateStr === todayStr && activeMinutes > 0 ? 1 : 0),
          isLive: dateStr === todayStr && activeMinutes > 0
        });
      }
    } else if (timeScale === 'week') {
      // 最近 4 週
      for (let i = 3; i >= 0; i--) {
        const start = new Date();
        start.setDate(now.getDate() - (i * 7 + now.getDay()));
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const weekLogs = focusLogs.filter(log => {
          const logDate = new Date(log.startTime);
          return logDate >= start && logDate <= end;
        });

        let totalWeekMinutes = weekLogs.reduce((acc, log) => acc + log.duration, 0);
        
        // Add live minutes if today falls in this week
        if (now >= start && now <= end) {
          totalWeekMinutes += activeMinutes;
        }

        result.push({
          label: `W${4-i}`,
          minutes: totalWeekMinutes,
          interruptions: weekLogs.reduce((acc, log) => acc + log.interruptionCount, 0),
        });
      }
    } else {
      // 最近 6 個月
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = d.toLocaleDateString('zh-TW', { month: 'short' });
        
        const monthLogs = focusLogs.filter(log => {
          const logDate = new Date(log.startTime);
          return logDate.getMonth() === d.getMonth() && logDate.getFullYear() === d.getFullYear();
        });

        let totalMonthMinutes = monthLogs.reduce((acc, log) => acc + log.duration, 0);
        
        // Add live minutes if today falls in this month
        if (now.getMonth() === d.getMonth() && now.getFullYear() === d.getFullYear()) {
          totalMonthMinutes += activeMinutes;
        }

        result.push({
          label: monthName,
          minutes: totalMonthMinutes,
          interruptions: monthLogs.reduce((acc, log) => acc + log.interruptionCount, 0),
        });
      }
    }
    return result;
  }, [focusLogs, timeScale, activeMinutes]);

  // 計算連續專注天數 (Streak)
  const currentStreak = useMemo(() => {
    // Treat active session as a log for streak purposes
    const effectiveLogs = [...focusLogs];
    if (activeMinutes > 0) {
      effectiveLogs.push({
        id: 'active',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: activeMinutes,
        interruptionCount: 0
      });
    }

    if (effectiveLogs.length === 0) return 0;
    
    // 取得所有唯一的專注日期 (YCYY-MM-DD)
    const dates: string[] = Array.from(new Set<string>(
      effectiveLogs
        .filter(log => log && log.startTime)
        .map(log => log.startTime.split('T')[0])
    )).sort((a, b) => b.localeCompare(a));

    if (dates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // 如果今天或昨天都沒有紀錄，則連續天數中斷
    if (dates[0] !== today && dates[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [focusLogs, activeMinutes]);

  const streakMessage = useMemo(() => {
    if (currentStreak === 0) return "開始您的第一場專注實驗吧！";
    if (currentStreak === 1) return "專注之旅才剛開始，明天也要繼續保持！";
    if (currentStreak < 5) return `太棒了！您已連續 ${currentStreak} 天達成目標，保持節奏！`;
    return `卓越的自律！您已連續 ${currentStreak} 天專注，正處於巔峰狀態！`;
  }, [currentStreak]);

  const totalMinutes = useMemo(() => focusLogs.reduce((acc, log) => acc + log.duration, 0) + activeMinutes, [focusLogs, activeMinutes]);
  const avgFocusTime = useMemo(() => {
    const sessionCount = focusLogs.length + (activeMinutes > 0 ? 1 : 0);
    return sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
  }, [totalMinutes, focusLogs.length, activeMinutes]);
  const totalInterruption = useMemo(() => focusLogs.reduce((acc, log) => acc + log.interruptionCount, 0), [focusLogs]);

  React.useEffect(() => {
    // If regular user visits, mark as viewed so next time IT WILL BE LOCKED
    if (!isPremium && !hasViewedAnalysis) {
      setHasViewedAnalysis(true);
    }
  }, [isPremium, hasViewedAnalysis, setHasViewedAnalysis]);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans relative">
      <ViewHeader title="專注數據報告" onBack={() => navigateTo(AppRoute.HOME)} />

      {/* Lock Overlay for Non-Premium who already viewed once */}
      {!isPremium && hasViewedAnalysis && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center mt-16">
           <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-500 mb-6 shadow-xl shadow-indigo-100/50">
              <Zap size={40} fill="currentColor" />
           </div>
           <h3 className="text-2xl font-black text-gray-800 mb-3">限時試用已結束</h3>
           <p className="text-gray-500 text-sm font-medium leading-relaxed mb-8 max-w-xs">
              普通版使用者僅能查看一次數據報告。
              升級為 **Premium 尊享版** 以解鎖無限次數據分析、分心阻斷建議與無廣告體驗！
           </p>
           <button 
             onClick={() => navigateTo(AppRoute.SETTINGS)}
             className="w-full max-w-xs py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-2xl active:scale-95 transition-all"
           >
              立即升級方案
           </button>
           <button 
             onClick={() => navigateTo(AppRoute.HOME)}
             className="mt-4 text-gray-400 text-xs font-bold hover:text-gray-600"
           >
              返回首頁
           </button>
        </div>
      )}

      <div className="p-6 max-w-2xl mx-auto space-y-8">
        {/* Time Scale Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-2xl shadow-inner">
          {(['day', 'week', 'month'] as const).map(scale => (
            <button
              key={scale}
              onClick={() => setTimeScale(scale)}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${timeScale === scale ? 'bg-white text-blue-600 shadow-sm scale-105' : 'text-gray-400'}`}
            >
              {scale === 'day' ? 'Daily' : scale === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`bg-gradient-to-br transition-all duration-500 ${activeMinutes > 0 ? 'from-indigo-500 to-indigo-600 shadow-indigo-100' : 'from-blue-500 to-blue-600 shadow-blue-100'} p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden group`}>
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Total Focus</div>
                {activeMinutes > 0 && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
              </div>
              <div className="text-3xl font-black">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            </div>
            <Clock className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform ${activeMinutes > 0 ? 'animate-spin-slow' : ''}`} />
          </div>
          <div className="bg-white border border-gray-100 p-5 rounded-[2rem] shadow-xl shadow-gray-100/50 relative overflow-hidden group">
             <div className="relative z-10">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Avg Session</div>
              <div className="text-3xl font-black text-gray-800">{avgFocusTime}m</div>
            </div>
            <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-yellow-500 opacity-5 group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white border border-gray-100 p-6 rounded-[2.5rem] shadow-xl shadow-gray-100/50">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-800">專注時長趨勢</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Focus Duration (minutes)</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl">
               <TrendingUp size={16} className="text-blue-500" />
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  cursor={{stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="minutes" 
                  stroke="#3b82f6" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorMin)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interruption Analysis */}
        <div className="bg-gray-900 p-6 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">分心阻斷分析</h3>
              <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">Interruption Logs</p>
            </div>
            <AlertCircle size={20} className="text-red-400" />
          </div>

          <div className="space-y-4 relative z-10">
             <div className="flex items-end gap-2">
                <span className="text-4xl font-black text-red-400">{totalInterruption}</span>
                <span className="text-xs font-bold opacity-60 mb-2">總計被中斷次數</span>
             </div>
             <p className="text-xs opacity-70 leading-relaxed font-medium">
                {totalInterruption > 0 
                  ? `本階段共偵測到 ${totalInterruption} 次分心行為。建議開啟「強制專注」來優化效率。` 
                  : "表現完美！目前未偵測到任何分心行為。繼續保持優良紀錄！"}
             </p>
             
             <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mt-2">
                <div 
                  className="h-full bg-red-400 rounded-full transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(10, (totalInterruption / (totalMinutes || 1)) * 100))}%` }}
                />
             </div>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
        </div>

        {/* Goal Progress Placeholder */}
        <div className="grid grid-cols-1 gap-4">
           <div className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                 <Target size={32} />
              </div>
              <div>
                 <h4 className="font-black text-gray-800">連續達成目標</h4>
                 <p className="text-xs text-gray-400 font-bold">{streakMessage}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FocusAnalysisView;
