
import React, { useState, useRef, useEffect } from 'react';
import { AppRoute, Item } from '../types';
import { ChevronLeft, Plus, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameViewProps {
  navigateTo: (route: AppRoute) => void;
  coins: number;
  setCoins: React.Dispatch<React.SetStateAction<number>>;
  placedItems: {id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string}[];
  setPlacedItems: React.Dispatch<React.SetStateAction<{id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string}[]>>;
  activeAreas: string[];
  setActiveAreas: React.Dispatch<React.SetStateAction<string[]>>;
  purchasedBackgrounds: string[];
  setPurchasedBackgrounds: React.Dispatch<React.SetStateAction<string[]>>;
  areaBackgrounds: Record<string, string>;
  setAreaBackgrounds: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  areaNames: Record<string, string>;
  setAreaNames: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

const ITEMS: Item[] = [
  // Animals
  { id: 'a1', name: 'Puppy', price: 500, image: '🐶', type: 'asset' },
  { id: 'a2', name: 'Kitty', price: 500, image: '🐱', type: 'asset' },
  { id: 'a3', name: 'Bunny', price: 450, image: '🐰', type: 'asset' },
  { id: 'a4', name: 'Hamster', price: 300, image: '🐹', type: 'asset' },
  { id: 'a5', name: 'Fox', price: 600, image: '🦊', type: 'asset' },
  { id: 'a6', name: 'Bear', price: 700, image: '🐻', type: 'asset' },
  { id: 'a7', name: 'Panda', price: 800, image: '🐼', type: 'asset' },
  { id: 'a8', name: 'Koala', price: 750, image: '🐨', type: 'asset' },
  { id: 'a9', name: 'Tiger', price: 900, image: '🐯', type: 'asset' },
  { id: 'a10', name: 'Lion', price: 950, image: '🦁', type: 'asset' },
  { id: 'a11', name: 'Frog', price: 250, image: '🐸', type: 'asset' },
  { id: 'a12', name: 'Monkey', price: 400, image: '🐵', type: 'asset' },
  { id: 'a13', name: 'Chick', price: 200, image: '🐥', type: 'asset' },
  { id: 'a14', name: 'Penguin', price: 550, image: '🐧', type: 'asset' },
  { id: 'a15', name: 'Unicorn', price: 1200, image: '🦄', type: 'asset' },
  { id: 'a16', name: 'Dragon', price: 1500, image: '🐲', type: 'asset' },
  { id: 'a17', name: 'Sloth', price: 650, image: '🦥', type: 'asset' },
  { id: 'a18', name: 'Otter', price: 600, image: '🦦', type: 'asset' },
  { id: 'a19', name: 'Llama', price: 700, image: '🦙', type: 'asset' },
  { id: 'a20', name: 'Hedgehog', price: 350, image: '🦔', type: 'asset' },
  
  // Food & Treats
  { id: 'f1', name: 'Pizza', price: 150, image: '🍕', type: 'asset' },
  { id: 'f2', name: 'Burger', price: 150, image: '🍔', type: 'asset' },
  { id: 'f3', name: 'Fries', price: 100, image: '🍟', type: 'asset' },
  { id: 'f4', name: 'Taco', price: 120, image: '🌮', type: 'asset' },
  { id: 'f5', name: 'Sushi', price: 200, image: '🍣', type: 'asset' },
  { id: 'f6', name: 'Ramen', price: 180, image: '🍜', type: 'asset' },
  { id: 'f7', name: 'Ice Cream', price: 100, image: '🍦', type: 'asset' },
  { id: 'f8', name: 'Donut', price: 80, image: '🍩', type: 'asset' },
  { id: 'f9', name: 'Cake', price: 250, image: '🍰', type: 'asset' },
  { id: 'f10', name: 'Cookie', price: 50, image: '🍪', type: 'asset' },
  { id: 'f11', name: 'Pancakes', price: 140, image: '🥞', type: 'asset' },
  { id: 'f12', name: 'Bubble Tea', price: 110, image: '🧋', type: 'asset' },
  { id: 'f13', name: 'Coffee', price: 90, image: '☕', type: 'asset' },
  { id: 'f14', name: 'Popcorn', price: 70, image: '🍿', type: 'asset' },
  { id: 'f15', name: 'Strawberry', price: 40, image: '🍓', type: 'asset' },
  { id: 'f16', name: 'Watermelon', price: 60, image: '🍉', type: 'asset' },

  // Toys & Fun
  { id: 't1', name: 'Baseball', price: 250, image: '⚾', type: 'asset' },
  { id: 't2', name: 'Basketball', price: 250, image: '🏀', type: 'asset' },
  { id: 't3', name: 'Soccer Ball', price: 250, image: '⚽', type: 'asset' },
  { id: 't4', name: 'Skateboard', price: 350, image: '🛹', type: 'asset' },
  { id: 't5', name: 'Bicycle', price: 650, image: '🚲', type: 'asset' },
  { id: 't6', name: 'Game Console', price: 850, image: '🎮', type: 'asset' },
  { id: 't7', name: 'Laptop', price: 950, image: '💻', type: 'asset' },
  { id: 't8', name: 'Guitar', price: 750, image: '🎸', type: 'asset' },
  { id: 't9', name: 'Saxophone', price: 750, image: '🎷', type: 'asset' },
  { id: 't10', name: 'Slide', price: 550, image: '🛝', type: 'asset' },
  { id: 't11', name: 'Teddy Bear', price: 300, image: '🧸', type: 'asset' },
  { id: 't12', name: 'Balloon', price: 50, image: '🎈', type: 'asset' },
  { id: 't13', name: 'Kite', price: 150, image: '🪁', type: 'asset' },
  { id: 't14', name: 'Yo-Yo', price: 80, image: '🪀', type: 'asset' },
  { id: 't15', name: 'Puzzle', price: 120, image: '🧩', type: 'asset' },
  { id: 't16', name: 'Magic Wand', price: 400, image: '🪄', type: 'asset' },

  // Home & Nature
  { id: 'h1', name: 'Plant', price: 200, image: '🪴', type: 'asset' },
  { id: 'h2', name: 'Flower', price: 100, image: '🌸', type: 'asset' },
  { id: 'h3', name: 'Cactus', price: 150, image: '🌵', type: 'asset' },
  { id: 'h4', name: 'Cat Bed', price: 300, image: '🧺', type: 'asset' },
  { id: 'h5', name: 'Fish Bowl', price: 400, image: '🥣', type: 'asset' },
  { id: 'h6', name: 'Trophy', price: 500, image: '🏆', type: 'asset' },
  { id: 'h7', name: 'Crystal Ball', price: 600, image: '🔮', type: 'asset' },
  { id: 'h8', name: 'Rainbow', price: 1000, image: '🌈', type: 'asset' },
  { id: 'h9', name: 'Cloud', price: 300, image: '☁️', type: 'asset' },
  { id: 'h10', name: 'Star', price: 400, image: '⭐', type: 'asset' },
  { id: 'h11', name: 'Moon', price: 500, image: '🌙', type: 'asset' },
  { id: 'h12', name: 'Sun', price: 600, image: '☀️', type: 'asset' },
];

const BACKGROUNDS: Item[] = [
  { id: 'default', name: 'Default', price: 0, image: '🎨', type: 'background' },
  { id: 'b1', name: 'Meadow', price: 500, image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b2', name: 'Wooden', price: 250, image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b3', name: 'Marble', price: 750, image: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b4', name: 'Space', price: 1200, image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b5', name: 'Cyber', price: 1000, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b6', name: 'Zen', price: 600, image: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b8', name: 'Forest', price: 550, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b9', name: 'Castle', price: 1500, image: 'https://images.unsplash.com/photo-1533154683836-84ea7a0bc310?auto=format&fit=crop&q=80&w=500', type: 'background' },
  { id: 'b10', name: 'Desert', price: 450, image: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=500', type: 'background' },
];

const GameView: React.FC<GameViewProps> = ({ 
  navigateTo, coins, setCoins, placedItems, setPlacedItems, activeAreas, setActiveAreas,
  purchasedBackgrounds, setPurchasedBackgrounds, areaBackgrounds, setAreaBackgrounds,
  areaNames, setAreaNames
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentAreaId, setCurrentAreaId] = useState('blue');

  useEffect(() => {
    // Ensure we start at the 'blue' area
    const scrollToBlue = () => {
      if (scrollContainerRef.current) {
        const blueIndex = activeAreas.indexOf('blue');
        if (blueIndex !== -1) {
          const width = scrollContainerRef.current.offsetWidth;
          scrollContainerRef.current.scrollLeft = blueIndex * width;
        }
      }
    };
    
    scrollToBlue();
    // Extra safety for initial render
    requestAnimationFrame(scrollToBlue);
    const timer = setTimeout(scrollToBlue, 100);
    return () => clearTimeout(timer);
  }, []); // Only on mount to avoid jumping while user is interacting

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const width = scrollContainerRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (activeAreas[index]) {
        setCurrentAreaId(activeAreas[index]);
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [activeAreas]);

  useEffect(() => {
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

  const [activeTab, setActiveTab] = useState<'items' | 'backgrounds'>('items');

  const buyItem = (item: Item) => {
    if (item.type === 'asset') {
      // Check if current area already has 10 items
      const itemsInCurrentArea = placedItems.filter(p => p.areaId === currentAreaId).length;
      if (itemsInCurrentArea >= 10) {
        alert("此區域已達10個寵物上限！");
        return;
      }
    }

    if (item.type === 'background') {
      if (item.id === 'default') {
        setAreaBackgrounds(prev => {
          const next = { ...prev };
          delete next[currentAreaId];
          return next;
        });
        return;
      }
      if (purchasedBackgrounds.includes(item.id)) {
        // Already owned, just apply it
        setAreaBackgrounds(prev => ({ ...prev, [currentAreaId]: item.id }));
        return;
      }
    }

    if (coins >= item.price) {
      setCoins(prev => prev - item.price);
      if (item.type === 'asset') {
        setPlacedItems(prev => [...prev, {
          id: Date.now().toString(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          char: item.image,
          isReacting: false,
          clickCount: 0,
          areaId: currentAreaId
        }]);
      } else if (item.type === 'background') {
        setPurchasedBackgrounds(prev => [...prev, item.id]);
        setAreaBackgrounds(prev => ({ ...prev, [currentAreaId]: item.id }));
      }
    } else {
      alert("Not enough coins!");
    }
  };

  const addArea = () => {
    if (activeAreas.length >= 3) return;
    
    setActiveAreas(prev => {
      const next = [...prev];
      if (!next.includes('yellow')) {
        next.push('yellow');
      } else if (!next.includes('green')) {
        next.push('green');
      }
      
      const order = ['yellow', 'blue', 'green'];
      return order.filter(id => next.includes(id));
    });
  };

  const removeArea = (areaId: string) => {
    if (areaId === 'blue') return;
    setActiveAreas(prev => prev.filter(id => id !== areaId));
  };

  const handleEmojiClick = (id: string) => {
    setPlacedItems(prev => {
      const item = prev.find(p => p.id === id);
      if (!item) return prev;
      
      const newClickCount = (item.clickCount || 0) + 1;
      
      return prev.map(p => 
        p.id === id ? { ...p, isReacting: true, clickCount: newClickCount } : p
      );
    });
    
    // Reset reaction state after normal animation
    setTimeout(() => {
      setPlacedItems(prev => prev.map(item => 
        item.id === id ? { ...item, isReacting: false } : item
      ));
    }, 800);
  };

  const removeEmoji = (id: string) => {
    setPlacedItems(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-6 flex items-center justify-center relative">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="absolute left-6 bg-white p-3 rounded-2xl shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">寵物專區</h1>
        <div className="absolute right-6 bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-gray-100 z-50">
          <span className="text-yellow-600 font-bold">💰</span>
          <span className="font-bold">{coins}</span>
        </div>
      </header>

      <div className="px-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">My Pets</h2>
          <button 
            onClick={addArea}
            className={`text-gray-400 transition-opacity ${activeAreas.length >= 3 ? 'opacity-30 cursor-not-allowed' : 'hover:text-blue-500'}`}
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Areas Container */}
        <div className="relative">
          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            <style>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {activeAreas.map(areaId => (
              <AreaBox 
                key={areaId}
                areaId={areaId}
                items={placedItems.filter(item => item.areaId === areaId)}
                handleEmojiClick={handleEmojiClick}
                removeEmoji={removeEmoji}
                onRemove={() => removeArea(areaId)}
                background={BACKGROUNDS.find(b => b.id === areaBackgrounds[areaId])}
                areaName={areaNames[areaId] || ''}
                setAreaName={(name) => setAreaNames(prev => ({ ...prev, [areaId]: name }))}
              />
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-2">
            {activeAreas.map((areaId) => (
              <div 
                key={areaId}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentAreaId === areaId ? 'w-4 bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-t-[3rem] p-6">
        <div className="bg-gray-100 rounded-full flex p-1 mb-6">
          <button 
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${activeTab === 'items' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
          >
            Items
          </button>
          <button 
            onClick={() => setActiveTab('backgrounds')}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${activeTab === 'backgrounds' ? 'bg-white shadow-sm' : 'text-gray-400'}`}
          >
            Backgrounds
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {(activeTab === 'items' ? ITEMS : BACKGROUNDS).map(item => (
            <button 
              key={item.id}
              onClick={() => buyItem(item)}
              className="bg-gray-50 p-4 rounded-3xl flex flex-col items-center border border-gray-100 hover:bg-white hover:shadow-md transition-all active:scale-95"
            >
              <p className="text-sm font-bold mb-2 text-gray-700">{item.name}</p>
              <div className="h-16 flex items-center justify-center mb-2 overflow-hidden rounded-xl">
                {item.type === 'background' ? (
                  item.id === 'default' ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-2xl">
                      {item.image}
                    </div>
                  ) : (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  )
                ) : (
                  <span className="text-4xl">{item.image}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-yellow-700">
                {item.type === 'background' && (item.id === 'default' || purchasedBackgrounds.includes(item.id)) ? (
                  <span className="text-blue-500">
                    {item.id === 'default' 
                      ? (!areaBackgrounds[currentAreaId] ? 'Active' : 'Apply')
                      : (areaBackgrounds[currentAreaId] === item.id ? 'Active' : 'Apply')
                    }
                  </span>
                ) : (
                  <>
                    <span>💰</span>
                    <span>{item.price}</span>
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GameView;

interface AreaBoxProps {
  areaId: string;
  items: {id: string, x: number, y: number, char: string, isReacting: boolean, clickCount: number, areaId: string}[];
  handleEmojiClick: (id: string) => void;
  removeEmoji: (id: string) => void;
  onRemove: () => void;
  background?: Item;
  areaName: string;
  setAreaName: (name: string) => void;
}

const AreaBox: React.FC<AreaBoxProps> = ({ areaId, items, handleEmojiClick, removeEmoji, onRemove, background, areaName, setAreaName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showRemove, setShowRemove] = useState(false);
  const hoverTimer = useRef<any>(null);

  const getGradient = () => {
    switch (areaId) {
      case 'yellow': return 'from-yellow-200 to-yellow-400';
      case 'green': return 'from-green-200 to-green-400';
      default: return 'from-cyan-300 to-blue-400';
    }
  };

  const handleMouseEnter = () => {
    if (areaId === 'blue') return;
    hoverTimer.current = setTimeout(() => {
      setShowRemove(true);
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
    }
    setShowRemove(false);
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative flex-shrink-0 w-full aspect-square rounded-[3rem] shadow-inner overflow-hidden border-[8px] border-white touch-none snap-center`}
    >
      {background ? (
        <img 
          src={background.image} 
          alt={background.name} 
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${getGradient()}`} />
      )}

      {/* Area Name Input */}
      <div className="absolute top-6 right-6 z-40">
        <input 
          type="text"
          value={areaName}
          onChange={(e) => setAreaName(e.target.value)}
          placeholder="輸入專案名稱..."
          className="bg-white/60 backdrop-blur-md border border-white/40 rounded-xl px-3 py-1.5 text-[10px] font-bold text-black placeholder:text-black/40 focus:outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-400 transition-all w-32 text-right shadow-sm"
        />
      </div>
      
      {/* Remove Button */}
      <AnimatePresence>
        {showRemove && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute top-6 left-6 z-50 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          >
            ✕
          </motion.button>
        )}
      </AnimatePresence>

      {items.map(item => (
        <EmojiItem 
          key={item.id}
          item={item}
          handleEmojiClick={handleEmojiClick}
          removeEmoji={removeEmoji}
        />
      ))}
    </div>
  );
};

interface EmojiItemProps {
  item: any;
  handleEmojiClick: (id: string) => void;
  removeEmoji: (id: string) => void;
}

const EmojiItem: React.FC<EmojiItemProps> = ({ item, handleEmojiClick, removeEmoji }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const lastTap = useRef(0);

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      removeEmoji(item.id);
    } else {
      handleEmojiClick(item.id);
    }
    lastTap.current = now;
  };

  return (
    <motion.div 
      ref={itemRef}
      onTap={handleTap}
      animate={{
        scale: item.isReacting ? [1, 1.4, 1] : 1,
        rotate: item.isReacting ? [0, 15, -15, 0] : 0,
      }}
      transition={{ 
        scale: { duration: 0.5 },
        rotate: { duration: 0.5 },
      }}
      className="absolute text-4xl z-30 flex items-center justify-center select-none w-12 h-12"
      style={{ 
        left: `${item.x}%`, 
        top: `${item.y}%`,
        translateX: "-50%",
        translateY: "-50%",
      }}
    >
      <div className="relative">
        {item.char}
        <AnimatePresence>
          {item.isReacting && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.8, 1.3, 1.5],
              }}
              exit={{ opacity: 0 }}
              className="absolute -inset-3 border-4 border-yellow-400 rounded-full pointer-events-none z-[-1]"
              style={{ 
                boxShadow: '0 0 20px rgba(251, 191, 36, 0.9)',
                filter: 'blur(1px)'
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
