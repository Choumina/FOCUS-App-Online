
import React, { useState, useEffect } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Play, QrCode } from 'lucide-react';
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
    <div className="p-6 bg-white min-h-screen">
      <header className="flex items-center justify-center relative mb-8">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="absolute left-0 bg-gray-100 p-3 rounded-2xl">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">賽馬場</h1>
        <div className="absolute right-0 bg-white px-4 py-2 rounded-full shadow-sm flex items-center gap-2 border">
          <span className="text-yellow-600">💰</span>
          <span className="font-bold">{coins}</span>
        </div>
      </header>

      <div className={`rounded-[3rem] p-8 transition-colors duration-500 mb-8 relative overflow-hidden ${racing ? 'bg-green-300' : 'bg-gray-100'}`}>
        {/* Finish Line */}
        <div className="absolute top-0 bottom-0 right-12 w-1 border-r-2 border-dashed border-gray-400 z-0" />
        
        <div className="space-y-8 relative z-10">
          {[1, 2, 3, 4, 5].map((h, i) => (
            <div key={h} className="relative h-2 bg-gray-300 rounded-full">
              {racing && <div className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full" style={{ width: `${positions[i]}%` }} />}
              
              {/* Horse */}
              <div 
                className="absolute -top-6 text-4xl transition-all duration-100 ease-linear transform scale-x-[-1]"
                style={{ left: `calc(${positions[i]}% - 20px)` }}
              >
                🏇
              </div>

              {/* Betting Mark at the end */}
              <button
                onClick={() => !racing && setSelectedHorse(i)}
                className={`absolute -right-10 -top-4 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  selectedHorse === i 
                    ? 'bg-yellow-500 text-white scale-110 shadow-lg' 
                    : 'bg-white text-gray-300 hover:bg-gray-200'
                }`}
                disabled={racing}
              >
                <span className="text-xs font-bold">{selectedHorse === i ? '💰' : '○'}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-3xl flex justify-between items-center">
          <span className="font-bold text-gray-600">下注金額 : 💰 {bet}</span>
          <div className="flex flex-col">
              <button onClick={() => setBet(b => b + 100)} className="text-blue-500">▲</button>
              <button onClick={() => setBet(b => Math.max(0, b - 100))} className="text-blue-500">▼</button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-3xl flex justify-between items-center">
          <span className="font-bold text-gray-600">加入我的賽馬場 : <span className="text-blue-500">0310</span></span>
          <button className="bg-white p-2 rounded-xl shadow-sm"><QrCode size={20} /></button>
        </div>

        <input 
          type="text" 
          placeholder="輸入遊戲代碼..." 
          value={gameCode}
          onChange={handleCodeChange}
          className="w-full bg-gray-50 p-4 rounded-3xl border-none focus:ring-2 focus:ring-blue-400"
        />

        <button 
          onClick={startRace}
          disabled={racing}
          className="w-full py-4 bg-blue-500 text-white rounded-full text-2xl font-bold shadow-xl flex items-center justify-center gap-3 disabled:bg-gray-300"
        >
          <Play fill="white" size={24} /> Play
        </button>
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
