import React, { useState } from 'react';
import { AppRoute } from '../types';
import { Search, Mic, Play, Pause, RotateCcw, Plus, Minus, TrendingUp } from 'lucide-react';
import ViewHeader from './ViewHeader';

interface FocusTimerViewProps {
  navigateTo: (route: AppRoute) => void;
  totalTime: number;
  setTotalTime: (time: number) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  isStrict: boolean;
  setIsStrict: (strict: boolean) => void;
  interruptionCount: number;
  setInterruptionCount: (count: number | ((prev: number) => number)) => void;
}

const FocusTimerView: React.FC<FocusTimerViewProps> = ({ 
  navigateTo, 
  totalTime, 
  setTotalTime, 
  timeLeft, 
  setTimeLeft, 
  isActive, 
  setIsActive,
  isStrict,
  setIsStrict,
  interruptionCount,
  setInterruptionCount
}) => {
  const [taskName, setTaskName] = useState('');

  // 監聽分心偵測 (Visibility API)
  React.useEffect(() => {
    if (isActive && isStrict) {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setInterruptionCount(prev => prev + 1);
          // 可以加入音效或震動提示
          console.warn("偵測到分心！請保持在專注頁面。");
        }
      };
      
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
  }, [isActive, isStrict, setInterruptionCount]);

  // 全螢幕切換邏輯
  const toggleFullscreen = async (on: boolean) => {
    if (!isStrict) return;
    try {
      if (on) {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleStartToggle = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    if (isStrict) {
      toggleFullscreen(nextState);
    }
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 調整時間 (以 5 分鐘為單位)
  const adjustTime = (amount: number) => {
    if (isActive) return;
    const newTime = Math.max(300, totalTime + amount); // 最少 5 分鐘
    setTotalTime(newTime);
    setTimeLeft(newTime);
  };

  // 計算圓圈進度
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference * (1 - timeLeft / totalTime);

  // 產生刻度
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const angle = (i * 6) * (Math.PI / 180); 
    const isMajor = i % 5 === 0;
    const tickRadius = 130; 
    const innerRadius = isMajor ? tickRadius - 8 : tickRadius - 4;
    
    const x1 = 160 + innerRadius * Math.cos(angle);
    const y1 = 160 + innerRadius * Math.sin(angle);
    const x2 = 160 + tickRadius * Math.cos(angle);
    const y2 = 160 + tickRadius * Math.sin(angle);
    
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={isMajor ? "#94a3b8" : "#cbd5e1"}
        strokeWidth={isMajor ? "2" : "1"}
      />
    );
  });

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <ViewHeader 
        title="Focus Timer" 
        onBack={() => navigateTo(AppRoute.HOME)}
        rightElement={
          <div className="bg-gray-50 rounded-full flex p-1 ml-4 shadow-sm border border-gray-100">
            <button 
              onClick={() => navigateTo(AppRoute.TASKS)}
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400"
            >
              Tasks
            </button>
            <button 
              onClick={() => navigateTo(AppRoute.FOCUS_ANALYSIS)}
              className="p-2.5 text-gray-400 hover:text-blue-500 transition-colors"
              title="專注分析"
            >
              <TrendingUp size={20} />
            </button>
            <button 
              className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest bg-white shadow-sm rounded-full text-blue-500"
            >
              Timer
            </button>
          </div>
        }
      />

      <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-white to-gray-50/50">
        <h2 className="text-3xl font-black mb-6 text-gray-800 leading-tight tracking-tight">我們現在該<br/>專注於什麼？</h2>
        
        <div className="w-full max-w-xs relative mb-10 group">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-300 group-focus-within:text-blue-400 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="輸入任務名稱..." 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            disabled={isActive}
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] py-3.5 px-10 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-bold placeholder:text-gray-300 shadow-sm"
          />
          <div className="absolute inset-y-0 right-4 flex items-center text-gray-300">
            <Mic size={18} />
          </div>
        </div>

        <div id="focus-timer-display" className="relative w-80 h-80 flex items-center justify-center mb-12">
          <svg className="w-full h-full transform -rotate-90 absolute inset-0">
            {ticks}
            <circle cx="160" cy="160" r={radius} fill="transparent" stroke="#f8fafc" strokeWidth="14" />
            <circle
              cx="160" cy="160" r={radius} fill="transparent" stroke="url(#timerGradient)" strokeWidth="14"
              strokeDasharray={circumference} strokeDashoffset={progressOffset} strokeLinecap="round"
              className="transition-all duration-1000 ease-linear shadow-lg"
            />
            <defs>
              <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-6">
              {!isActive && (
                <button 
                  onClick={() => adjustTime(-300)}
                  disabled={isActive}
                  className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 border border-gray-100 shadow-sm disabled:opacity-30"
                >
                  <Minus size={20} strokeWidth={3} />
                </button>
              )}
              
              <div className="flex flex-col items-center">
                <span className="text-5xl font-black text-gray-800 tabular-nums tracking-tighter leading-none">
                  {formatTime(timeLeft)}
                </span>
                {!isActive && (
                   <p className="text-[10px] text-gray-300 font-bold mt-2 uppercase tracking-[0.2em]">REMAINING</p>
                )}
              </div>

              {!isActive && (
                <button 
                  onClick={() => adjustTime(300)}
                  disabled={isActive}
                  className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-90 border border-gray-100 shadow-sm disabled:opacity-30"
                >
                  <Plus size={20} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-3xl border border-gray-100">
          <div className="flex-1">
             <div className="text-xs font-black text-gray-800">嚴格模式 (Strict Mode)</div>
             <div className="text-[10px] text-gray-400 font-bold">開啟後將鎖定全螢幕並監測分心行為</div>
          </div>
          <button 
            onClick={() => !isActive && setIsStrict(!isStrict)}
            disabled={isActive}
            className={`w-12 h-6 rounded-full transition-all relative ${isStrict ? 'bg-blue-600' : 'bg-gray-200'} ${isActive ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isStrict ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {isActive && isStrict && interruptionCount > 0 && (
          <div className="mb-6 animate-bounce">
            <div className="px-4 py-2 bg-red-50 text-red-500 text-[10px] font-black rounded-full border border-red-100 shadow-sm flex items-center gap-2">
              ⚠️ 偵測到分心次數：{interruptionCount}
            </div>
          </div>
        )}

        <div className="flex gap-4 w-full px-4">
           <button 
            id="focus-start-btn"
            onClick={handleStartToggle}
            className={`flex-[2] py-5 rounded-3xl text-xl font-black text-white shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${isActive ? 'bg-orange-500 shadow-orange-200' : 'bg-blue-600 shadow-blue-200'}`}
          >
            {isActive ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            {isActive ? 'PAUSE' : 'START NOW'}
          </button>
          <button 
            onClick={() => { setIsActive(false); setTimeLeft(totalTime); }}
            className="flex-1 bg-gray-100 p-5 rounded-3xl text-gray-400 hover:bg-gray-200 transition-all active:scale-90 shadow-inner flex items-center justify-center"
          >
            <RotateCcw size={28} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusTimerView;
