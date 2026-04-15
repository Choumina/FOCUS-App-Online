import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import ViewHeader from './ViewHeader';
import { supabase } from '../supabase';
import { Loader2, Trophy, Users, Search, UserPlus, UserMinus, X } from 'lucide-react';

interface LeaderboardViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: {
    name: string;
    avatar: string;
    level: number;
    id?: string;
  };
  coins: number;
}

interface Player {
  rank: number;
  name: string;
  score: number;
  isMe: boolean;
  avatar: string;
  level: number;
  id: string;
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ navigateTo, userProfile, coins }) => {
  const [tab, setTab] = useState<'area' | 'friends'>('area');
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const fetchFollowing = async () => {
    if (!userProfile.id) return;
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', userProfile.id);
      
      if (error) throw error;
      if (data) setFollowingIds(data.map(f => f.friend_id));
    } catch (err) {
      console.error("Failed to fetch following list:", err);
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        await fetchFollowing();

        let query = supabase.from('users').select('id, user_profile, points');

        if (tab === 'friends' && userProfile.id) {
          // 只獲取已關注的好友
          if (followingIds.length > 0) {
            query = query.in('id', followingIds);
          } else {
            setPlayers([]);
            setIsLoading(false);
            return;
          }
        }

        const { data, error } = await query
          .order('points', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data) {
          const mappedPlayers = data.map((item, index) => ({
            rank: index + 1,
            id: item.id,
            name: item.user_profile?.name || '未知使用者',
            score: item.points || 0,
            isMe: item.id === userProfile.id,
            avatar: item.user_profile?.avatar || `https://picsum.photos/seed/${item.id}/100`,
            level: item.user_profile?.level || 1
          }));
          setPlayers(mappedPlayers);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [userProfile.id, tab, followingIds.length]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, user_profile, points')
        .ilike('user_profile->>name', `%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      if (data) {
        setSearchResults(data.map(item => ({
          rank: 0,
          id: item.id,
          name: item.user_profile?.name || '未知使用者',
          score: item.points || 0,
          isMe: item.id === userProfile.id,
          avatar: item.user_profile?.avatar || `https://picsum.photos/seed/${item.id}/100`,
          level: item.user_profile?.level || 1
        })));
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFollow = async (friendId: string) => {
    if (!userProfile.id) return;
    const isFollowing = followingIds.includes(friendId);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('friendships')
          .delete()
          .eq('user_id', userProfile.id)
          .eq('friend_id', friendId);
        if (error) throw error;
        setFollowingIds(prev => prev.filter(id => id !== friendId));
      } else {
        const { error } = await supabase
          .from('friendships')
          .insert({ user_id: userProfile.id, friend_id: friendId });
        if (error) throw error;
        setFollowingIds(prev => [...prev, friendId]);
      }
    } catch (err) {
      console.error("Failed to update friendship:", err);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <ViewHeader title="積分排名" onBack={() => navigateTo(AppRoute.HOME)} />
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-gray-100 rounded-full flex p-1 mb-6 shadow-inner">
          <button 
            onClick={() => { setTab('area'); setSearchQuery(''); setSearchResults([]); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 ${tab === 'area' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            <Trophy size={14} /> Global
          </button>
          <button 
            onClick={() => { setTab('friends'); setSearchQuery(''); setSearchResults([]); }}
            className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-full transition-all flex items-center justify-center gap-2 ${tab === 'friends' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
          >
            <Users size={14} /> Friends
          </button>
        </div>

        {/* 搜尋好友 */}
        <div className="relative mb-8 group">
          <div className="absolute inset-y-0 left-4 flex items-center text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={18} />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜尋使用者名稱..." 
            className="w-full bg-gray-50 border-2 border-gray-100 rounded-[2rem] py-4 px-12 text-sm text-gray-700 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all font-bold placeholder:text-gray-300"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setSearchResults([]); }}
              className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* 搜尋結果 */}
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
                      <div className="text-[10px] text-gray-400 font-bold">LEVEL {p.level}</div>
                   </div>
                   {!p.isMe && (
                     <button 
                        onClick={() => toggleFollow(p.id)}
                        className={`p-2.5 rounded-xl transition-all ${followingIds.includes(p.id) ? 'bg-gray-100 text-gray-400 hover:text-red-500' : 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:scale-105'}`}
                     >
                        {followingIds.includes(p.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                     </button>
                   )}
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-yellow-400 rounded-[2rem] flex items-center justify-center shadow-xl shadow-yellow-100 mb-4 rotate-3 animate-bounce duration-[3000ms]">
            <span className="text-4xl">🏆</span>
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {tab === 'area' ? '全球榮譽榜' : '好友競爭榜'}
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Season 1: Focus Legend</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-xs text-gray-400 font-bold animate-pulse">加載排名中...</p>
          </div>
        ) : (
          <div className="bg-gray-50/50 rounded-[3rem] p-4 md:p-8 space-y-4 border border-gray-100">
            {players.length > 0 ? players.map(p => (
              <div 
                key={p.id} 
                className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 group ${p.isMe ? 'bg-white ring-2 ring-blue-500 shadow-xl shadow-blue-100' : 'bg-transparent'}`}
              >
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
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">POINTS</div>
                </div>
              </div>
            )) : (
              <div className="py-20 text-center text-gray-400 font-bold italic">
                暫無數據
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
