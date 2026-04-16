
import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Play, Zap, Flag, Coins, Star, Ticket, QrCode, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RaceTrackViewProps {
  navigateTo: (route: AppRoute) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  lastBetAmount: number;
  setLastBetAmount: React.Dispatch<React.SetStateAction<number>>;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  isPremium: boolean;
}

const TICKET_COST = 500;

const RaceTrackView: React.FC<RaceTrackViewProps> = ({ navigateTo, coins, setCoins, lastBetAmount, setLastBetAmount, setUserProfile, isPremium }) => {
  React.useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      const mainElement = document.querySelector('main');
      if (mainElement) { mainElement.scrollTop = 0; }
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
    setTimeout(resetScroll, 50);
  }, []);

  const [hasTicket, setHasTicket] = useState(false);
  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState([0, 0, 0, 0, 0]);
  const [bet, setBet] = useState(lastBetAmount);
  const [selectedHorse, setSelectedHorse] = useState(-1);
  const [resultStatus, setResultStatus] = useState<'win' | 'lose' | null>(null);
  const [showAdOverlay, setShowAdOverlay] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [gameCode, setGameCode] = useState('');

  const buyTicket = () => {
    if (coins < TICKET_COST) {
      alert(`需要 $${TICKET_COST} 金幣才能購票入場！`);
      return;
    }
    setCoins(c => c - TICKET_COST);
    setHasTicket(true);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val) && val.length <= 4) {
      setGameCode(val);
      if (val === '0000') {
        setCoins(0);
        setGameCode('');
        alert('👨‍💻 開發者代碼：金幣已歸零');
      } else if (val === '9999') {
        setCoins(9999);
        setGameCode('');
        alert('👨‍💻 開發者代碼：金幣已加至 9999');
      }
    }
  };

  // Ad Countdown Logic
  useEffect(() => {
    let timer: any;
    if (showAdOverlay && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown(prev => prev - 1);
      }, 1000);
    } else if (showAdOverlay && adCountdown === 0) {
      setShowAdOverlay(false);
      navigateTo(AppRoute.HOME);
    }
    return () => clearInterval(timer);
  }, [showAdOverlay, adCountdown, navigateTo]);

  useEffect(() => {
    let interval: any = null;
    if (racing) {
      interval = setInterval(() => {
        setPositions(prev => {
          const next = prev.map(pos => pos >= 100 ? pos : pos + Math.random() * 5);
          if (next.some(pos => pos >= 100)) {
            setRacing(false);
            const winner = next.indexOf(Math.max(...next));
            if (winner === selectedHorse) {
              setCoins(c => c + bet * 2);
              setUserProfile((prev: any) => ({
                ...prev,
                winsTowardsNextLevel: (prev.winsTowardsNextLevel || 0) + 1
              }));
              setResultStatus('win');
            } else {
              setResultStatus('lose');
            }
            // Ticket consumed after each race
            setHasTicket(false);
            setTimeout(() => {
              if (isPremium) {
                setResultStatus(null);
                navigateTo(AppRoute.HOME);
              } else {
                setResultStatus(null);
                setShowAdOverlay(true);
              }
            }, 2500);
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [racing, bet, setCoins, selectedHorse, isPremium, navigateTo, setUserProfile]);

  const startRace = () => {
    if (selectedHorse === -1) return alert('請先選擇一匹馬進行下注！');
    if (coins < bet) return alert('金幣不足以下注！');
    setLastBetAmount(bet);
    setCoins(c => c - bet);
    setPositions([0, 0, 0, 0, 0]);
    setRacing(true);
  };

  // --- TICKET GATE ---
  if (!hasTicket) {
    return (
      <div className="p-0 bg-gray-50 min-h-screen">
        <header className="px-6 pt-8 pb-4 flex items-center justify-between relative z-50">
          <button onClick={() => navigateTo(AppRoute.HOME)} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-all">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter text-gray-800 italic uppercase">Race Arena</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">VIP Entry Required</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-yellow-100/50">
            <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-inner">
              <Coins size={16} className="text-white font-bold" />
            </div>
            <span className="font-black text-gray-800 text-lg">{coins}</span>
          </div>
        </header>

        <div className="px-6 flex flex-col items-center justify-center min-h-[70vh] gap-8">
          <motion.div
            animate={{ y: [0, -12, 0], rotate: [-5, 5, -5] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="text-9xl drop-shadow-2xl"
          >
            🎟️
          </motion.div>

          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter">入場券</h2>
            <p className="text-gray-400 font-bold text-sm mt-2">購買入場券以進入賽馬場</p>
            <p className="text-gray-400 font-bold text-xs mt-1">每場比賽結束後需重新購票</p>
          </div>

          <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Ticket size={24} className="text-white" />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">入場費用</div>
                <div className="text-3xl font-black text-gray-800">💰 {TICKET_COST}</div>
              </div>
            </div>

            <div className="w-full space-y-2 text-sm">
              {[
                { icon: '🏇', text: '選擇你押注的馬匹' },
                { icon: '💰', text: '設定你的賭注金額' },
                { icon: '🏆', text: '贏得 2x 的賭注獎勵' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-gray-600 font-bold">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={buyTicket}
              disabled={coins < TICKET_COST}
              className={`w-full py-5 rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 ${
                coins < TICKET_COST
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-[1.02] active:scale-95 shadow-emerald-200'
              }`}
            >
              <Ticket size={20} />
              {coins < TICKET_COST ? '金幣不足' : `購票入場 -$${TICKET_COST}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RACE ARENA ---
  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between relative z-50">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-all">
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black tracking-tighter text-gray-800 italic uppercase">Race Arena</h1>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-0.5">High Stakes Betting</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-yellow-100/50 group hover:scale-105 transition-all">
          <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-transform">
            <Coins size={16} className="text-white font-bold" />
          </div>
          <span className="font-black text-gray-800 text-lg">{coins}</span>
        </div>
      </header>

      <div className="px-6 pb-8">
        {/* Race Track */}
        <div className={`rounded-[3.5rem] p-6 transition-all duration-700 mb-8 relative overflow-hidden border-[8px] border-white shadow-2xl ${racing ? 'bg-gray-900 border-emerald-500/30' : 'bg-gray-100'}`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)' }} />
          {/* Finish Line */}
          <div className="absolute top-0 bottom-0 right-12 w-6 bg-[repeating-linear-gradient(0deg,#fff,#fff_8px,#000_8px,#000_16px)] opacity-20 z-0" />
          <div className="absolute top-1/2 right-3 -translate-y-1/2 flex flex-col items-center gap-1 z-10 opacity-40">
            <Flag size={16} className={racing ? 'text-emerald-500' : 'text-gray-400'} />
          </div>

          {/* Tracks + Bet Buttons side by side, each row aligned */}
          <div className="space-y-6 relative z-10">
            {[1, 2, 3, 4, 5].map((h, i) => (
              <div key={h} className="flex items-center gap-3">
                {/* Horse number */}
                <div className={`text-[10px] font-black w-5 text-center shrink-0 ${racing ? 'text-gray-400' : 'text-gray-500'}`}>
                  0{h}
                </div>
                {/* Track bar */}
                <div className="flex-1 relative h-4 bg-gray-200/50 rounded-full backdrop-blur-sm border border-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${positions[i]}%` }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]"
                  />
                  {/* Horse */}
                  <motion.div
                    animate={racing ? { y: [0, -10, 0], rotate: [-12, 12, -12], scaleX: -1 } : { scaleX: -1 }}
                    transition={racing ? { y: { repeat: Infinity, duration: 0.25 }, rotate: { repeat: Infinity, duration: 0.25 } } : {}}
                    className="absolute -top-6 text-4xl transition-all duration-100 ease-linear drop-shadow-lg z-20"
                    style={{ left: `calc(${positions[i]}% - 20px)` }}
                  >
                    🏇
                  </motion.div>
                </div>
                {/* Bet button — aligned with each row */}
                <button
                  onClick={() => !racing && setSelectedHorse(i)}
                  disabled={racing}
                  className={`shrink-0 w-12 h-8 rounded-xl flex items-center justify-center transition-all border-2 text-xs font-black ${
                    selectedHorse === i
                      ? 'bg-emerald-500 border-emerald-400 text-white scale-105 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-white border-gray-100 text-gray-400 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                >
                  {selectedHorse === i ? <Star size={14} fill="white" /> : `P${i + 1}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Wager */}
        <div className="space-y-5">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex justify-between items-center group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-500 group-hover:rotate-12 transition-transform">
                <Coins size={24} />
              </div>
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wager Amount</div>
                <div className="text-xl font-black text-gray-800">💰 {bet}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBet(b => Math.max(100, b - 100))} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">-</button>
              <button onClick={() => setBet(b => b + 100)} className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors">+</button>
            </div>
          </div>

          {/* Ticket badge */}
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-[2rem] px-5 py-3">
            <Ticket size={18} className="text-emerald-600" />
            <span className="text-sm font-black text-emerald-700">入場券生效中 — 比賽結束後需重新購票</span>
          </div>

          <div className="flex gap-4">
             <div className="flex-1 bg-white p-5 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-500">
                   <Target size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="GAME CODE..." 
                  value={gameCode}
                  onChange={handleCodeChange}
                  className="w-full bg-transparent text-sm font-black placeholder:text-gray-300 focus:outline-none"
                />
             </div>
             <div className="bg-white px-5 rounded-[2rem] shadow-xl border border-gray-100 text-gray-400 flex items-center">
                <QrCode size={24} />
             </div>
          </div>

          <button
            onClick={startRace}
            disabled={racing || selectedHorse === -1 || coins < bet}
            className={`w-full py-6 rounded-[2.5rem] text-xl font-black uppercase tracking-widest shadow-2xl transition-all relative overflow-hidden flex items-center justify-center gap-3
              ${racing
                ? 'bg-gray-200 text-gray-400'
                : (selectedHorse === -1 || coins < bet)
                  ? 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-[1.02] active:scale-95 shadow-emerald-200'
              }
            `}
          >
            {racing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                <Zap size={24} />
              </motion.div>
            ) : <Play fill="white" size={24} />}
            {racing ? 'Racing...' : (selectedHorse === -1 ? 'Select Horse' : 'Start Race')}
          </button>
        </div>
      </div>

      {/* Result Animations */}
      <AnimatePresence>
        {resultStatus === 'win' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 0.5 }} className="text-9xl mb-4">🎉</motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-yellow-400 text-white px-8 py-4 rounded-full text-4xl font-black shadow-2xl border-4 border-white">YOU WIN! 💰</motion.div>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div key={i} initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: (Math.random() - 0.5) * 1000, y: (Math.random() - 0.5) * 1000, opacity: 0, rotate: Math.random() * 360 }} transition={{ duration: 1.5, ease: 'easeOut' }} className="absolute text-2xl">
                  {['✨', '⭐', '💎', '💰', '🎊'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {resultStatus === 'lose' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-9xl mb-4">😭</motion.div>
            <motion.div className="bg-gray-800 text-white px-8 py-4 rounded-full text-4xl font-black shadow-2xl border-4 border-gray-600">YOU LOSE...</motion.div>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <motion.div key={i} initial={{ y: -100, x: (Math.random() - 0.5) * 400, opacity: 0 }} animate={{ y: 500, opacity: [0, 1, 0] }} transition={{ duration: 2, delay: Math.random() * 1 }} className="absolute text-3xl">💧</motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Overlay */}
      {showAdOverlay && (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center text-center p-8">
          <div className="max-w-md w-full">
            <div className="relative mb-12">
               <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center mx-auto animate-pulse">
                  <Sparkles size={48} className="text-yellow-400" />
               </div>
               <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                  Ad Break
               </div>
            </div>
            
            <h3 className="text-3xl font-black text-white mb-4">Focus AI Premium</h3>
            <p className="text-white/60 text-base font-medium leading-relaxed mb-12">
              您正在觀看普通版廣告。<br />
              升級為 **Premium 尊享版** 即可永久跳過所有廣告，並解鎖完整專注數據報告！
            </p>
            
            <div className="flex flex-col items-center gap-6">
               <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                     <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                     <circle 
                        cx="40" 
                        cy="40" 
                        r="36" 
                        fill="none" 
                        stroke="#4f46e5" 
                        strokeWidth="4" 
                        strokeDasharray="226.2"
                        strokeDashoffset={226.2 * (1 - adCountdown / 5)}
                        className="transition-all duration-[1100ms] linear"
                     />
                  </svg>
                  <span className="text-2xl font-black text-white">{adCountdown}</span>
               </div>
               
               <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">
                  跳過廣告倒數中...
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceTrackView;
