
import React, { useState, useMemo } from 'react';
import { AppRoute, FocusLog } from '../types';
import ViewHeader from './ViewHeader';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, Cell, PieChart, Pie
} from 'recharts';
import { Calendar, Clock, Zap, Target, TrendingUp, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface FocusAnalysisViewProps {
  navigateTo: (route: AppRoute) => void;
  focusLogs: FocusLog[];
}

const FocusAnalysisView: React.FC<FocusAnalysisViewProps> = ({ navigateTo, focusLogs }) => {
  const [timeScale, setTimeScale] = useState<'day' | 'week' | 'month'>('day');

  // 處理數據：每日專注分鐘數
  const chartData = useMemo(() => {
    const now = new Date();
    const result = [];

    if (timeScale === 'day') {
      // 最近 7 天
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('zh-TW', { weekday: 'short' });
        
        const dayLogs = focusLogs.filter(log => log.startTime.startsWith(dateStr));
        const totalMinutes = dayLogs.reduce((acc, log) => acc + log.duration, 0);
        const interruptions = dayLogs.reduce((acc, log) => acc + log.interruptionCount, 0);

        result.push({
          label: dayName,
          fullDate: dateStr,
          minutes: totalMinutes,
          interruptions: interruptions,
          count: dayLogs.length
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

        result.push({
          label: `W${4-i}`,
          minutes: weekLogs.reduce((acc, log) => acc + log.duration, 0),
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

        result.push({
          label: monthName,
          minutes: monthLogs.reduce((acc, log) => acc + log.duration, 0),
          interruptions: monthLogs.reduce((acc, log) => acc + log.interruptionCount, 0),
        });
      }
    }
    return result;
  }, [focusLogs, timeScale]);

  const totalMinutes = useMemo(() => focusLogs.reduce((acc, log) => acc + log.duration, 0), [focusLogs]);
  const avgFocusTime = useMemo(() => focusLogs.length > 0 ? Math.round(totalMinutes / focusLogs.length) : 0, [totalMinutes, focusLogs]);
  const totalInterruption = useMemo(() => focusLogs.reduce((acc, log) => acc + log.interruptionCount, 0), [focusLogs]);

  return (
    <div className="bg-white min-h-screen pb-20 font-sans">
      <ViewHeader title="專注數據報告" onBack={() => navigateTo(AppRoute.HOME)} />

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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1">Total Focus</div>
              <div className="text-3xl font-black">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</div>
            </div>
            <Clock className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform" />
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
                 <p className="text-xs text-gray-400 font-bold">您已連續 3 天完成預定目標！</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FocusAnalysisView;
