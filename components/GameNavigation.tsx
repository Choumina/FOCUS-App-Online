
import React from 'react';
import { AppRoute } from '../types';

interface GameNavigationProps {
  currentRoute: AppRoute;
  navigateTo: (route: AppRoute) => void;
}

const GameNavigation: React.FC<GameNavigationProps> = ({ currentRoute, navigateTo }) => {
  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 w-max">
      <div className="bg-white/80 backdrop-blur-md p-1 rounded-full flex shadow-lg border border-white/20">
        <button 
          onClick={() => navigateTo(AppRoute.GAME_PETS)}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentRoute === AppRoute.GAME_PETS ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          寵物專區
        </button>
        <button 
          onClick={() => navigateTo(AppRoute.GAME_RACE)}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentRoute === AppRoute.GAME_RACE ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          賽馬場
        </button>
        <button 
          onClick={() => navigateTo(AppRoute.LEADERBOARD)}
          className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${currentRoute === AppRoute.LEADERBOARD ? 'bg-blue-500 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
        >
          積分
        </button>
      </div>
    </div>
  );
};

export default GameNavigation;
