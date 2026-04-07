
import React from 'react';
import { AppRoute } from '../types';
import { Gamepad2, Sparkles, Clock } from 'lucide-react';

interface NavigationProps {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute) => void;
  fab?: React.ReactNode;
}

const Navigation: React.FC<NavigationProps> = ({ currentRoute, navigateTo, fab }) => {
  const isFocusActive = currentRoute === AppRoute.HOME || [AppRoute.FOCUS_TIMER, AppRoute.TASKS].includes(currentRoute);
  const isGameActive = [AppRoute.GAME_PETS, AppRoute.GAME_RACE, AppRoute.LEADERBOARD].includes(currentRoute);
  const isAIActive = currentRoute === AppRoute.AI_CHAT;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] flex items-center gap-3 z-50">
      
      {/* 主功能膠囊 (Focus & Game) */}
      <div className="flex-1 h-[60px] bg-white/95 backdrop-blur-xl rounded-full shadow-2xl flex items-center px-2 border border-gray-100/50">
        
        {/* Focus 按鈕 */}
        <button 
          id="nav-focus"
          onClick={() => isFocusActive ? null : navigateTo(AppRoute.HOME)}
          className={`flex flex-col items-center justify-center flex-1 h-[48px] rounded-2xl transition-all duration-300 ${isFocusActive ? 'text-blue-500 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Clock size={20} strokeWidth={isFocusActive ? 2.5 : 2} />
          <span className={`text-[10px] mt-0.5 font-bold ${isFocusActive ? 'opacity-100' : 'opacity-60'}`}>Focus</span>
        </button>

        {/* 分隔線 */}
        <div className="w-[1px] h-6 bg-gray-100 mx-1"></div>

        {/* Game 按鈕 */}
        <button 
          id="nav-game"
          onClick={() => navigateTo(AppRoute.GAME_PETS)}
          className={`flex flex-col items-center justify-center flex-1 h-[48px] rounded-2xl transition-all duration-300 ${isGameActive ? 'text-blue-500 bg-blue-50/50' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Gamepad2 size={20} strokeWidth={isGameActive ? 2.5 : 2} />
          <span className={`text-[10px] mt-0.5 font-bold ${isGameActive ? 'opacity-100' : 'opacity-60'}`}>Game</span>
        </button>
      </div>
      
      {/* 獨立 AI 圓鈕 - 使用 Sparkles 圖示並優化漸層 */}
      <div className="relative flex-shrink-0">
        {fab && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2">
            {fab}
          </div>
        )}
        <button 
          id="nav-ai"
          onClick={() => navigateTo(AppRoute.AI_CHAT)}
          className={`relative w-[60px] h-[60px] flex-shrink-0 rounded-full transition-all duration-500 transform active:scale-90 flex flex-col items-center justify-center shadow-[0_10px_25px_-5px_rgba(79,70,229,0.4)] ${
            isAIActive 
            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
            : 'bg-gradient-to-tr from-indigo-600 via-violet-500 to-purple-500 text-white hover:shadow-[0_15px_30px_-5px_rgba(79,70,229,0.6)] hover:-translate-y-0.5'
          }`}
        >
          <Sparkles size={24} strokeWidth={2.2} className={`${isAIActive ? 'animate-pulse' : ''}`} />
          <span className="text-[10px] mt-0.5 font-black uppercase tracking-widest leading-none">AI</span>
          {isAIActive && (
            <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Navigation;
