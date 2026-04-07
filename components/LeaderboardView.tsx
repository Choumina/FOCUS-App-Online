
import React, { useState } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Trophy } from 'lucide-react';

interface LeaderboardViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: {
    name: string;
    avatar: string;
    level: number;
  };
  coins: number;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ navigateTo, userProfile, coins }) => {
  const [tab, setTab] = useState<'area' | 'friends'>('area');
  
  const players = [
    { rank: 1, name: userProfile.name, score: coins, isMe: true, avatar: userProfile.avatar, level: userProfile.level },
    ...Array.from({length: 14}, (_, i) => ({
      rank: i + 2,
      name: `username_${i + 1}`,
      score: Math.max(0, coins - (i + 1) * 50),
      isMe: false,
      avatar: `https://picsum.photos/seed/${i + 10}/100`,
      level: Math.floor(Math.random() * 5)
    }))
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      <header className="flex items-center justify-center relative mb-6">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="absolute left-0 bg-gray-100 p-3 rounded-2xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">積分排名</h1>
      </header>

      <div className="bg-gray-100 rounded-full flex p-1 mb-8">
        <button 
          onClick={() => setTab('area')}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${tab === 'area' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
        >
          All Area
        </button>
        <button 
          onClick={() => setTab('friends')}
          className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${tab === 'friends' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
        >
          Friends
        </button>
      </div>

      <div className="flex flex-col items-center mb-8">
        <span className="text-4xl mb-2">🏆</span>
        <h2 className="text-2xl font-bold">Bronze League</h2>
      </div>

      <div className="bg-gray-50 rounded-[3rem] p-6 space-y-4">
        {players.map(p => (
          <div key={p.rank} className={`flex items-center gap-4 p-2 rounded-2xl ${p.isMe ? 'bg-blue-50 ring-1 ring-blue-100' : ''}`}>
            <div className="w-8 text-sm font-bold text-gray-400">
              {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : p.rank}
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
              <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className={`flex-1 text-sm font-bold ${p.isMe ? 'text-blue-600' : 'text-gray-700'}`}>
              {p.name} <span className="text-[10px] text-gray-400 font-normal ml-1">Lv.{p.level}</span> {p.isMe && <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full ml-1">YOU</span>}
            </div>
            <div className="text-sm font-bold text-gray-400">{p.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LeaderboardView;
