
import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Play, QrCode, Zap, Trophy, Flag, Coins, Star, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RaceTrackViewProps {
  navigateTo: (route: AppRoute) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  lastBetAmount: number;
  setLastBetAmount: React.Dispatch<React.SetStateAction<number>>;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
}

const RaceTrackView: React.FC<RaceTrackViewProps> = ({ navigateTo, coins, setCoins, lastBetAmount, setLastBetAmount, setUserProfile }) => {
  React.useEffect(() => {
    const resetScroll = () => {
      window.scrollTo(0, 0);
      const mainElement = document.querySelector('main');
      if (mainElement) {
        mainElement.scrollTop = 0;
      }
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
    setTimeout(resetScroll, 50);
  }, []);

  const [racing, setRacing] = useState(false);
  const [positions, setPositions] = useState([0, 0, 0, 0, 0]);
  const [bet, setBet] = useState(lastBetAmount);
  const [selectedHorse, setSelectedHorse] = useState(-1);
  const [gameCode, setGameCode] = useState('');
  const [resultStatus, setResultStatus] = useState<'win' | 'lose' | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // 只允許數字且長度最多 4 位
    if (/^\d*$/.test(val) && val.length <= 4) {
      setGameCode(val);
      
      // 特殊代碼邏輯
      if (val === '0000') {
        setCoins(0);
        setGameCode('');
        alert('開發者代碼：金幣已歸零');
      } else if (val === '9999') {
        setCoins(999999); // 假設最大值
        setGameCode('');
        alert('開發者代碼：金幣已加至最大值');
      }
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (racing) {
      interval = setInterval(() => {
        setPositions(prev => {
          const next = prev.map(pos => pos >= 100 ? pos : pos + Math.random() * 5);
          if (next.some(pos => pos >= 100)) {
            setRacing(false);
            const winner = next.indexOf(Math.max(...next));
            
            // Win logic based on selected horse
            if (winner === selectedHorse) {
              setCoins(c => c + bet * 2);
              // Increment wins for leveling
              setUserProfile((prev: any) => ({
                ...prev,
                winsTowardsNextLevel: (prev.winsTowardsNextLevel || 0) + 1
              }));
              setResultStatus('win');
            } else {
              setResultStatus('lose');
            }

            setTimeout(() => {
              setResultStatus(null);
            }, 2000);
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [racing, bet, setCoins, selectedHorse]);

  const startRace = () => {
    if (selectedHorse === -1) return alert("請先選擇一匹馬進行下注！");
    if (coins < bet) return alert("Not enough coins");
    setLastBetAmount(bet);
    setCoins(c => c - bet);
    setPositions([0, 0, 0, 0, 0]);
    setRacing(true);
  };

  return (
    <div className="p-0 bg-gray-50 min-h-screen">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between relative z-50">
        <button 
          onClick={() => navigateTo(AppRoute.HOME)} 
          className="bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm border border-gray-100 hover:scale-110 active:scale-95 transition-all"
        >
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
        <div className={`rounded-[3.5rem] p-10 transition-all duration-700 mb-8 relative overflow-hidden border-[8px] border-white shadow-2xl ${racing ? 'bg-gray-900 border-emerald-500/30' : 'bg-gray-100'}`}>
          {/* Animated Background Patern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)' }} />
          
          {/* Finish Line Indicator */}
          <div className="absolute top-0 bottom-0 right-16 w-8 bg-[repeating-linear-gradient(0deg,#fff,#fff_10px,#000_10px,#000_20px)] opacity-20 z-0" />
          <div className="absolute top-1/2 right-4 -translate-y-1/2 flex flex-col items-center gap-2 z-10 opacity-40">
             <Flag size={20} className={racing ? 'text-emerald-500' : 'text-gray-400'} />
             <div className="text-[10px] font-black uppercase tracking-widest writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>Goal</div>
          </div>
          
          <div className="space-y-10 relative z-10">
            {[1, 2, 3, 4, 5].map((h, i) => (
              <div key={h} className="relative h-3 bg-gray-200/50 rounded-full backdrop-blur-sm">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${positions[i]}%` }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                />
                
                {/* Horse with Gallop Animation */}
                <motion.div 
                  animate={racing ? {
                    y: [0, -10, 0],
                    rotate: [-10, 10, -10],
                    scaleX: -1
                  } : { scaleX: -1 }}
                  transition={racing ? {
                    y: { repeat: Infinity, duration: 0.3 },
                    rotate: { repeat: Infinity, duration: 0.3 }
                  } : {}}
                  className="absolute -top-7 text-5xl transition-all duration-100 ease-linear drop-shadow-lg"
                  style={{ left: `calc(${positions[i]}% - 25px)` }}
                >
                  🏇
                </motion.div>

                {/* Horse Number Label */}
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">0{h}</div>

                {/* Betting Marker for Horse */}
                <button
                  onClick={() => !racing && setSelectedHorse(i)}
                  className={`absolute -right-12 -top-3 w-9 h-9 rounded-2xl flex items-center justify-center transition-all border-2 ${
                    selectedHorse === i 
                      ? 'bg-emerald-500 border-white text-white scale-110 shadow-xl rotate-12' 
                      : 'bg-white border-gray-100 text-gray-300 hover:bg-emerald-50 hover:border-emerald-200'
                  }`}
                  disabled={racing}
                >
                   {selectedHorse === i ? <Star size={18} fill="white" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />}
                </button>
              </div>
            ))}
          </div>
        </div>

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
                <button 
                  onClick={() => setBet(b => Math.max(100, b - 100))} 
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  -
                </button>
                <button 
                  onClick={() => setBet(b => b + 100)} 
                  className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-xl font-black text-gray-400 hover:bg-emerald-50 hover:text-emerald-500 transition-colors"
                >
                  +
                </button>
            </div>
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
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
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
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div 
              animate={{ 
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="text-9xl mb-4"
            >
              🎉
            </motion.div>
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-yellow-400 text-white px-8 py-4 rounded-full text-4xl font-black shadow-2xl border-4 border-white"
            >
              YOU WIN! 💰
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    opacity: 1 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 1000, 
                    y: (Math.random() - 0.5) * 1000,
                    opacity: 0,
                    rotate: Math.random() * 360
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute text-2xl"
                >
                  {['✨', '⭐', '💎', '💰', '🎊'][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {resultStatus === 'lose' && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-9xl mb-4"
            >
              😭
            </motion.div>
            <motion.div 
              className="bg-gray-800 text-white px-8 py-4 rounded-full text-4xl font-black shadow-2xl border-4 border-gray-600"
            >
              YOU LOSE...
            </motion.div>
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ y: -100, x: (Math.random() - 0.5) * 400, opacity: 0 }}
                  animate={{ y: 500, opacity: [0, 1, 0] }}
                  transition={{ duration: 2, delay: Math.random() * 1 }}
                  className="absolute text-3xl"
                >
                  💧
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RaceTrackView;
