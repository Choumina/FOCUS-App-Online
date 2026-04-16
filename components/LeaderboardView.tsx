import React, { useState, useEffect } from 'react';
import { AppRoute, FocusLog } from '../types';
import ViewHeader from './ViewHeader';
import { supabase } from '../supabase';
import { Loader2, Trophy, Users, Search, UserPlus, UserMinus, X, Clock, Heart, Star, Coins } from 'lucide-react';

interface LeaderboardViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: {
    name: string;
    avatar: string;
    level: number;
    id?: string;
  };
  coins: number;
  setCoins: (updater: React.SetStateAction<number>) => void;
  focusLogs: FocusLog[];
  placedItems: any[];
}

type RankCategory = 'points' | 'coins' | 'focus' | 'level' | 'pet';

interface Player {
  rank: number;
  name: string;
  score: number;
  scoreLabel: string;
  isMe: boolean;
  avatar: string;
  level: number;
  id: string;
}

const RANK_CATEGORIES: { key: RankCategory; label: string; icon: React.ReactNode; color: string; description: string }[] = [
  { key: 'points',  label: '積分',    icon: <Trophy size={14} />,  color: 'text-yellow-600', description: '總積分排名' },
  { key: 'coins',   label: '金幣',    icon: <Coins size={14} />,   color: 'text-amber-600',  description: '持有金幣排名' },
  { key: 'focus',   label: '專注',    icon: <Clock size={14} />,   color: 'text-blue-600',   description: '累計專注時間' },
  { key: 'level',   label: '等級',    icon: <Star size={14} />,    color: 'text-purple-600', description: '個人等級排名' },
  { key: 'pet',     label: '寵物',    icon: <Heart size={14} />,   color: 'text-pink-600',   description: '寵物等級排名' },
];

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ navigateTo, userProfile, coins, setCoins, focusLogs, placedItems }) => {
  const [tab, setTab] = useState<'area' | 'friends'>('area');
  const [category, setCategory] = useState<RankCategory>('points');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const totalFocusMinutes = focusLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const myPetLevel = placedItems.length > 0 ? Math.floor((placedItems[0].clickCount || 0) / 5) + 1 : 0;

  const fetchFollowing = async () => {
    if (!userProfile.id) return;
    try {
      const { data, error } = await supabase.from('friendships').select('friend_id').eq('user_id', userProfile.id);
      if (error) throw error;
      if (data) setFollowingIds(data.map(f => f.friend_id));
    } catch (err) {
      console.error('Failed to fetch following list:', err);
    }
  };

  const getScoreForCategory = (item: any, cat: RankCategory): { score: number; label: string } => {
    switch (cat) {
      case 'coins':
        return { score: item.game_data?.coins || 0, label: '💰 coins' };
      case 'focus':
        return { score: item.game_data?.focusMinutes || 0, label: 'min focus' };
      case 'level':
        return { score: item.user_profile?.level || 0, label: 'LV' };
      case 'pet':
        return { score: item.game_data?.petLevel || 0, label: 'Pet LV' };
      default:
        return { score: item.points || 0, label: 'pts' };
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        await fetchFollowing();
        let query = supabase.from('users').select('id, user_profile, points, game_data');
        if (tab === 'friends' && userProfile.id) {
          if (followingIds.length > 0) {
            query = query.in('id', followingIds);
          } else {
            setPlayers([]);
            setIsLoading(false);
            return;
          }
        }
        const { data, error } = await query.order('points', { ascending: false }).limit(1000);
        if (error) throw error;

        if (data) {
          const mappedPlayers = data
            .map((item) => {
              const { score, label } = getScoreForCategory(item, category);
              return {
                id: item.id,
                name: item.user_profile?.name || '未知使用者',
                score: score || 0,
                scoreLabel: label,
                isMe: item.id === userProfile.id,
                avatar: item.user_profile?.avatar || `https://picsum.photos/seed/${item.id}/100`,
                level: item.user_profile?.level || 1,
                rank: 0
              };
            })
            .sort((a, b) => b.score - a.score)
            .map((p, i) => ({ ...p, rank: i + 1 }));
          setPlayers(mappedPlayers);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeaderboard();
  }, [userProfile.id, tab, category, followingIds.length]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (searchQuery.trim() === '999') {
      setCoins(prev => prev + 9999);
      setSearchQuery('');
      alert('🎰 密技啟動！獲得 $9999 金幣！');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.from('users').select('id, user_profile, points, game_data').ilike('user_profile->>name', `%${searchQuery}%`).limit(10);
      if (error) throw error;
      if (data) {
        setSearchResults(data.map(item => {
          const { score, label } = getScoreForCategory(item, category);
          return {
            rank: 0, id: item.id,
            name: item.user_profile?.name || '未知使用者',
            score, scoreLabel: label,
            isMe: item.id === userProfile.id,
            avatar: item.user_profile?.avatar || `https://picsum.photos/seed/${item.id}/100`,
            level: item.user_profile?.level || 1
          };
        }));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (friendId: string) => {
    if (!userProfile.id) return;
    const isFollowing = followingIds.includes(friendId);
    try {
      if (isFollowing) {
        const { error } = await supabase.from('friendships').delete().eq('user_id', userProfile.id).eq('friend_id', friendId);
        if (error) throw error;
        setFollowingIds(prev => prev.filter(id => id !== friendId));
      } else {
        const { error } = await supabase.from('friendships').insert({ user_id: userProfile.id, friend_id: friendId });
        if (error) throw error;
        setFollowingIds(prev => [...prev, friendId]);
      }
    } catch (err) {
      console.error('Failed to update friendship:', err);
    }
  };

  const activeCat = RANK_CATEGORIES.find(c => c.key === category)!;

  return (
    <div className="bg-white min-h-screen pb-24">
      <ViewHeader title="積分排名" onBack={() => navigateTo(AppRoute.HOME)} />
      <div className="p-6 max-w-2xl mx-auto">

        {/* My Stats quick summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: '金幣', value: coins.toLocaleString(), icon: '💰' },
            { label: '專注(分)', value: totalFocusMinutes.toLocaleString(), icon: '⏱️' },
            { label: '寵物等級', value: `LV.${myPetLevel}`, icon: '🐾' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-50 rounded-[1.5rem] p-3 text-center border border-gray-100">
              <div className="text-xl mb-1">{stat.icon}</div>
              <div className="text-xs font-black text-gray-800">{stat.value}</div>
              <div className="text-[9px] text-gray-400 font-bold uppercase">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Area / Friends Tab */}
        <div className="bg-gray-100 rounded-full flex p-1 mb-4 shadow-inner">
          <button onClick={() => { setTab('area'); setSearchQuery(''); setSearchResults([]); }} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 ${tab === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
            <Trophy size={14} /> Global
          </button>
          <button onClick={() => { setTab('friends'); setSearchQuery(''); setSearchResults([]); }} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 ${tab === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
            <Users size={14} /> Friends
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {RANK_CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black transition-all border ${
                category === cat.key
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-blue-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜尋使用者名稱..."
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] py-4 px-12 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-bold placeholder:text-gray-300"
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-10 space-y-4">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-4">搜尋結果</h3>
            <div className="bg-blue-50/50 rounded-[2.5rem] p-4 border border-blue-100 space-y-3">
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center gap-4 p-3 bg-white rounded-2xl shadow-sm">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100">
                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-gray-800">{p.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold">LEVEL {p.level} · {p.score.toLocaleString()} {p.scoreLabel}</div>
                  </div>
                  {!p.isMe && (
                    <button onClick={() => toggleFollow(p.id)} className={`p-2.5 rounded-xl transition-all ${followingIds.includes(p.id) ? 'bg-gray-100 text-gray-400 hover:text-red-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105'}`}>
                      {followingIds.includes(p.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Heading */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-yellow-400 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-yellow-100 mb-3 rotate-3 animate-bounce duration-[3000ms]">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">
            {tab === 'area' ? '全球榮譽榜' : '好友競爭榜'}
          </h2>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${activeCat.color}`}>
            {activeCat.description}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-xs text-gray-400 font-bold animate-pulse">加載排名中...</p>
          </div>
        ) : (
          <div className="bg-gray-50/50 rounded-[3rem] p-4 md:p-8 space-y-4 border border-gray-100">
            {players.length > 0 ? players.map(p => (
              <div key={p.id} className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 group ${p.isMe ? 'bg-white ring-2 ring-blue-500 shadow-xl shadow-blue-100' : 'bg-transparent'}`}>
                <div className="w-10 text-base font-black italic flex justify-center">
                  {p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : <span className="text-gray-300 font-bold tracking-tighter">#{p.rank}</span>}
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-white ring-1 ring-gray-100">
                  <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black truncate flex items-center gap-2 ${p.isMe ? 'text-blue-600' : 'text-gray-800'}`}>
                    {p.name}
                    {p.isMe && <span className="text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">You</span>}
                  </div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Level {p.level} Collector</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-black ${p.isMe ? 'text-blue-600' : 'text-gray-800'}`}>{p.score.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{p.scoreLabel}</div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-gray-400 font-bold italic">暫無數據</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
