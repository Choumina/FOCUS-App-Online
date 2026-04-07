
import React, { useState, useEffect, useRef } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Search, Mic, Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';

interface FocusTimerViewProps {
  navigateTo: (route: AppRoute) => void;
  totalTime: number;
  setTotalTime: (time: number) => void;
  timeLeft: number;
  setTimeLeft: (time: number) => void;
  isActive: boolean;
  setIsActive: (active: boolean) => void;
}

const FocusTimerView: React.FC<FocusTimerViewProps> = ({ 
  navigateTo, 
  totalTime, 
  setTotalTime, 
  timeLeft, 
  setTimeLeft, 
  isActive, 
  setIsActive 
}) => {
  const [tab, setTab] = useState<'timer' | 'tasks'>('timer');

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
  // 半徑 r = 110, 周長 = 2 * PI * 110 ≈ 691.15
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  // 進度偏移：當 timeLeft = totalTime 時，offset = 0 (全滿)；當 timeLeft = 0 時，offset = circumference (全空)
  const progressOffset = circumference * (1 - timeLeft / totalTime);

  // 產生刻度
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const angle = (i * 6) * (Math.PI / 180); // 360 / 60 = 6 degrees per tick
    const isMajor = i % 5 === 0;
    const tickRadius = 130; // 刻度圈的半徑，比進度條大一點
    const innerRadius = isMajor ? tickRadius - 8 : tickRadius - 4;
    
    const x1 = 144 + innerRadius * Math.cos(angle);
    const y1 = 144 + innerRadius * Math.sin(angle);
    const x2 = 144 + tickRadius * Math.cos(angle);
    const y2 = 144 + tickRadius * Math.sin(angle);
    
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
    <div className="flex flex-col h-full bg-white p-6 overflow-hidden">
      {/* 頂部導航 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="bg-gray-100 p-3 rounded-2xl">
          <ChevronLeft size={24} />
        </button>
        <div className="bg-gray-100 rounded-full flex p-1 flex-1 mx-4">
          <button 
            onClick={() => navigateTo(AppRoute.TASKS)}
            className="flex-1 py-2 text-sm font-bold text-gray-400"
          >
            Reminders
          </button>
          <button 
            className="flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded-full"
          >
            番茄鐘
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* 標題與輸入框 */}
        <h2 className="text-3xl font-bold mb-4 text-gray-800 leading-tight">我們現在該<br/>專注於什麼？</h2>
        
        <div className="w-full max-w-xs relative mb-8">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            placeholder="輸入任務名稱..." 
            className="w-full bg-gray-100 rounded-full py-2.5 px-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 border-none"
          />
          <div className="absolute inset-y-0 right-4 flex items-center text-gray-400">
            <Mic size={18} />
          </div>
        </div>

        {/* Timer Dial Area - 調整為 72 (288px) 以確保在手機螢幕完美顯示 */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-10">
          <svg className="w-full h-full transform -rotate-90 absolute inset-0">
            {/* 刻度圈 */}
            {ticks}
            {/* 背景軌道 */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth="12"
            />
            {/* 動態進度條 */}
            <circle
              cx="144"
              cy="144"
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Time Display and Adjusters - 調整尺寸以完美融入圓環內部 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="flex items-center gap-4">
              {!isActive && (
                <button 
                  onClick={() => adjustTime(-300)}
                  className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90 border border-gray-100 shadow-sm"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
              )}
              
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-gray-800 tabular-nums tracking-tighter">
                  {formatTime(timeLeft)}
                </span>
                {!isActive && (
                   <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-widest">SET TIME</p>
                )}
              </div>

              {!isActive && (
                <button 
                  onClick={() => adjustTime(300)}
                  className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all active:scale-90 border border-gray-100 shadow-sm"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 控制按鈕 */}
        <div className="flex gap-4 w-full px-6">
           <button 
            onClick={() => { setIsActive(!isActive); }}
            className={`flex-[2] py-4 rounded-[2rem] text-xl font-bold text-white shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2 ${isActive ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'}`}
          >
            {isActive ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
            {isActive ? 'Pause' : 'Start'}
          </button>
          <button 
            onClick={() => { 
              setIsActive(false);
              setTimeLeft(totalTime);
            }}
            className="flex-1 bg-gray-100 p-4 rounded-[2rem] text-gray-500 hover:bg-gray-200 transition-colors active:scale-90 shadow-sm flex items-center justify-center"
          >
            <RotateCcw size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FocusTimerView;
