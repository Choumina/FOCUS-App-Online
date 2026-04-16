
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppRoute, CalendarEvent } from '../types';
import { ChevronLeft, List, Search, Calendar, ChevronRight, Settings2 } from 'lucide-react';

interface CalendarDetailViewProps {
  navigateTo: (route: AppRoute) => void;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  isTourActive?: boolean;
}

const CalendarDetailView: React.FC<CalendarDetailViewProps> = ({ navigateTo, events, setEvents, isTourActive }) => {
  const hours = Array.from({length: 25}, (_, i) => i.toString().padStart(2, '0') + ':00');
  const HOUR_HEIGHT = 40; // 1小時 = 40像素
  
  const [indicatorTop, setIndicatorTop] = useState(() => {
    const now = new Date();
    return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setIndicatorTop((now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT);
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  const [currentTimeLabel, setCurrentTimeLabel] = useState(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().getDate());
  const [viewMode, setViewMode] = useState<'day' | 'month'>(() => {
    const saved = localStorage.getItem('calendar_view_mode');
    return (saved === 'day' || saved === 'month') ? saved : 'month';
  });
  
  const [displayDate, setDisplayDate] = useState(new Date());
  const currentYear = displayDate.getFullYear();
  const currentMonth = displayDate.getMonth() + 1;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const handlePrevMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth - 2, 1));
  };

  const handleNextMonth = () => {
    setDisplayDate(new Date(currentYear, currentMonth, 1));
  };
  
  // Event resizing state
  const [resizingEventId, setResizingEventId] = useState<string | null>(null);
  const [initialResizeY, setInitialResizeY] = useState(0);
  const [initialResizeHeight, setInitialResizeHeight] = useState(0);

  // Event moving state
  const [movingEventId, setMovingEventId] = useState<string | null>(null);
  const [initialMoveY, setInitialMoveY] = useState(0);
  const [initialEventTop, setInitialEventTop] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dateScrollRef = useRef<HTMLDivElement>(null);

  const updateTimeFromPixels = (pixels: number) => {
    // 直覺計算：總分鐘 = (像素 / 40) * 60
    const totalMinutes = (pixels / HOUR_HEIGHT) * 60;
    
    // 限制在 00:00 (0分) 到 24:00 (1440分)
    const clampedMinutes = Math.max(0, Math.min(totalMinutes, 24 * 60));
    
    const h = Math.floor(clampedMinutes / 60);
    const m = Math.floor(clampedMinutes % 60);
    
    const formattedH = h.toString().padStart(2, '0');
    const formattedM = m.toString().padStart(2, '0');
    
    setCurrentTimeLabel(`${formattedH}:${formattedM}`);
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let newY = e.clientY - rect.top;

    // 限制範圍在 0px 到 960px (24小時 * 40px)
    newY = Math.max(0, Math.min(newY, 24 * HOUR_HEIGHT));
    
    // 吸附到整點 (每小時) 的邏輯
    const snapThreshold = 8; // 距離整點 8 像素內會吸附
    const nearestHourY = Math.round(newY / HOUR_HEIGHT) * HOUR_HEIGHT;
    if (Math.abs(newY - nearestHourY) < snapThreshold) {
      newY = nearestHourY;
    }
    
    setIndicatorTop(newY);
    updateTimeFromPixels(newY);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setResizingEventId(null);
    setMovingEventId(null);
    document.body.style.overflow = '';
  }, []);

  const handleResizeMove = useCallback((e: PointerEvent) => {
    if (!resizingEventId) return;
    
    const deltaY = e.clientY - initialResizeY;
    let newHeight = Math.max(20, initialResizeHeight + deltaY); // 最少 30 分鐘 (20px)
    
    // 吸附到 15 分鐘 (10px) 的邏輯
    const snapThreshold = 5;
    const snapUnit = 10;
    const nearestSnap = Math.round(newHeight / snapUnit) * snapUnit;
    if (Math.abs(newHeight - nearestSnap) < snapThreshold) {
      newHeight = nearestSnap;
    }

    setEvents(prev => prev.map(ev => ev.id === resizingEventId ? { ...ev, height: newHeight } : ev));
  }, [resizingEventId, initialResizeY, initialResizeHeight]);

  const handleEventMove = useCallback((e: PointerEvent) => {
    if (!movingEventId) return;
    
    const deltaY = e.clientY - initialMoveY;
    
    // 如果移動超過 5px，標記為已移動 (區分點擊和拖曳)
    if (Math.abs(deltaY) > 5) {
      setHasMoved(true);
    }
    
    let newTop = initialEventTop + deltaY;
    
    // 限制範圍在 0px 到 960px (24小時 * 40px)
    newTop = Math.max(0, Math.min(newTop, 24 * HOUR_HEIGHT));
    
    // 吸附到 15 分鐘 (10px) 的邏輯
    const snapThreshold = 5;
    const snapUnit = 10;
    const nearestSnap = Math.round(newTop / snapUnit) * snapUnit;
    if (Math.abs(newTop - nearestSnap) < snapThreshold) {
      newTop = nearestSnap;
    }

    setEvents(prev => prev.map(ev => ev.id === movingEventId ? { ...ev, top: newTop } : ev));
  }, [movingEventId, initialMoveY, initialEventTop]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    if (resizingEventId) {
      window.addEventListener('pointermove', handleResizeMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    if (movingEventId) {
      window.addEventListener('pointermove', handleEventMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointermove', handleEventMove);
    };
  }, [isDragging, resizingEventId, movingEventId, handlePointerMove, handleResizeMove, handleEventMove, handlePointerUp]);

  useEffect(() => {
    // 進入頁面時，自動捲動到目前時間的位置
    const mainElement = document.querySelector('main');
    if (mainElement && containerRef.current) {
      // 稍微往上偏移一點，讓指示線出現在畫面偏上方
      const scrollY = containerRef.current.offsetTop + indicatorTop - 150;
      mainElement.scrollTo({ top: Math.max(0, scrollY), behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('calendar_view_mode', viewMode);
  }, [viewMode]);
  
  // 導覽期間，強制切換至月曆視圖以確保導覽氣泡能正確對齊元素
  useEffect(() => {
    if (isTourActive) {
      setViewMode('month');
    }
  }, [isTourActive]);

  useEffect(() => {
    // 捲動日期列，讓選中日期置中
    if (dateScrollRef.current) {
      const selectedElement = dateScrollRef.current.querySelector(`[data-date="${selectedDate}"]`) as HTMLElement;
      if (selectedElement) {
        const container = dateScrollRef.current;
        const scrollLeft = selectedElement.offsetLeft - container.offsetWidth / 2 + selectedElement.offsetWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [selectedDate]);

  useEffect(() => {
    const handleAdd = () => {
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        date: `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`,
        top: indicatorTop,
        height: 40, // 預設 1 小時高度
        title: '',
        color: 'bg-gray-100', // 預設顏色
        isDraft: true,
      };
      setEvents(prev => [...prev, newEvent]);
    };
    window.addEventListener('calendar-add-event', handleAdd);
    return () => window.removeEventListener('calendar-add-event', handleAdd);
  }, [indicatorTop, currentYear, currentMonth, selectedDate, setEvents]);

  return (
    <div className="bg-white min-h-screen relative select-none">
      <header className="p-6">
        <div className="flex items-center justify-between mb-8">
            <button onClick={() => navigateTo(AppRoute.HOME)} className="bg-gray-100 p-3 rounded-2xl hover:bg-gray-200 transition-colors">
              <ChevronLeft size={24} />
            </button>
            <div className="bg-gray-100 rounded-full flex gap-1 p-1">
                <button 
                  onClick={() => setViewMode(viewMode === 'day' ? 'month' : 'day')}
                  className={`p-2 transition-all ${viewMode === 'month' ? 'bg-white rounded-full shadow-sm text-red-500' : 'text-gray-600 hover:bg-white hover:rounded-full'}`}
                >
                  {viewMode === 'day' ? <Calendar size={18}/> : <List size={18}/>}
                </button>
                <button className="p-2 text-gray-600 hover:bg-white hover:rounded-full transition-all"><Search size={18}/></button>
                <button
                  onClick={() => navigateTo(AppRoute.CALENDAR_ADMIN)}
                  className="p-2 text-gray-600 hover:bg-white hover:rounded-full transition-all"
                  title="後台管理"
                >
                  <Settings2 size={18}/>
                </button>
            </div>
        </div>
        
        <div 
          ref={dateScrollRef}
          className="flex items-center mb-4 overflow-x-auto gap-4 pb-2 no-scrollbar scroll-smooth"
          style={{ paddingLeft: 'calc(50% - 20px)', paddingRight: 'calc(50% - 20px)' }}
        >
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const date = new Date(currentYear, currentMonth - 1, d);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            return (
              <div 
                key={d} 
                data-date={d}
                onClick={() => setSelectedDate(d)}
                className="flex-shrink-0 flex flex-col items-center gap-1 cursor-pointer transition-all"
              >
                <span className={`text-[10px] font-bold uppercase ${d === selectedDate ? 'text-red-500' : 'text-gray-400'}`}>
                  {dayName}
                </span>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all ${d === selectedDate ? 'bg-red-500 text-white shadow-md' : 'text-gray-800 hover:bg-gray-100'}`}>
                  {d}
                </div>
              </div>
            );
          })}
        </div>
        
        <h2 className="text-center font-bold text-gray-800 border-t border-b py-3 border-gray-100 mb-4 text-xs tracking-tight uppercase">
          {new Date(currentYear, currentMonth - 1, selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </h2>
      </header>

      {viewMode === 'day' ? (
        <>
          {/* 時間軸主容器 - ml-20 增加左側間距，讓標籤不會太靠近螢幕邊緣 */}
          <div ref={containerRef} className="relative mt-4 pb-10 touch-none ml-20 mr-6">
              {hours.map((h, i) => (
                  <div 
                    key={h} 
                    className="relative border-t border-gray-100" 
                    style={{ height: i === hours.length - 1 ? '0px' : `${HOUR_HEIGHT}px` }}
                  >
                      {/* 整點文字：調整 -left-16，使其在左側並有適度留白 */}
                      <span className="absolute -left-16 -top-3 text-[11px] font-black text-gray-400 w-14 text-right pr-2">
                        {h}
                      </span>
                  </div>
              ))}
              
              {/* 渲染事件 */}
              {events.filter(e => e.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`).map(event => (
                <div
                  key={event.id}
                  className={`absolute left-0 right-0 ${event.color || 'bg-gray-100'}/80 backdrop-blur-sm rounded-lg p-2 border border-gray-200 shadow-sm z-20 overflow-hidden transition-colors`}
                  style={{
                    top: `${event.top}px`,
                    height: `${event.height}px`,
                  }}
                >
                  {event.isDraft ? (
                    <div className="flex flex-col h-full relative">
                      <input
                        type="text"
                        value={event.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, title: newTitle } : ev));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (event.title.trim() === '') {
                              setEvents(prev => prev.filter(ev => ev.id !== event.id));
                            } else {
                              setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, isDraft: false } : ev));
                            }
                          } else if (e.key === 'Escape') {
                            e.currentTarget.blur();
                          }
                        }}
                        onBlur={() => {
                          // 延遲執行 blur 邏輯，讓點擊顏色按鈕的事件可以先觸發
                          setTimeout(() => {
                            setEvents(prev => {
                              const currentEvent = prev.find(ev => ev.id === event.id);
                              if (!currentEvent || !currentEvent.isDraft) return prev;
                              if (currentEvent.title.trim() === '') {
                                return prev.filter(ev => ev.id !== event.id);
                              }
                              return prev.map(ev => ev.id === event.id ? { ...ev, isDraft: false } : ev);
                            });
                          }, 150);
                        }}
                        className="bg-transparent text-sm font-bold text-gray-700 focus:outline-none w-full flex-1"
                        placeholder="New Event"
                        autoFocus
                      />
                      <div className="absolute right-0 top-0 flex flex-row gap-1">
                        {['bg-blue-200', 'bg-green-200', 'bg-yellow-200'].map(color => (
                          <button
                            key={color}
                            onPointerDown={(e) => {
                              e.preventDefault(); // 防止 input 失去焦點
                              setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, color } : ev));
                            }}
                            className={`w-4 h-4 rounded-full ${color} border-2 ${event.color === color ? 'border-gray-500' : 'border-transparent'}`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`text-sm font-bold text-gray-700 h-full flex items-start pt-1 ${movingEventId === event.id ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setMovingEventId(event.id);
                        setInitialMoveY(e.clientY);
                        setInitialEventTop(event.top);
                        setHasMoved(false);
                        document.body.style.overflow = 'hidden';
                      }}
                      onPointerUp={() => {
                        if (!hasMoved) {
                          // 如果沒有移動，則視為點擊編輯
                          setEvents(prev => prev.map(ev => ev.id === event.id ? { ...ev, isDraft: true } : ev));
                        }
                      }}
                    >
                      {event.title}
                    </div>
                  )}
                  
                  {/* Resize Handle */}
                  {!event.isDraft && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize flex justify-center items-end pb-1"
                      onPointerDown={(e) => {
                        e.stopPropagation(); // 避免觸發編輯
                        setResizingEventId(event.id);
                        setInitialResizeY(e.clientY);
                        setInitialResizeHeight(event.height);
                        document.body.style.overflow = 'hidden';
                      }}
                    >
                      <div className="w-8 h-1 bg-gray-300 rounded-full" />
                    </div>
                  )}
                </div>
              ))}
    
              {/* 紅色指示線 (Indicator) */}
              <div 
                className="absolute left-0 right-0 flex items-center z-30 pointer-events-none"
                style={{ 
                  top: `${indicatorTop}px`,
                  transform: 'translateY(-50%)' 
                }}
              >
                  <div 
                    onPointerDown={() => {
                      setIsDragging(true);
                      document.body.style.overflow = 'hidden';
                    }}
                    className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full z-40 font-black shadow-lg cursor-ns-resize active:scale-110 transition-transform pointer-events-auto -ml-16 mr-2"
                  >
                    {currentTimeLabel}
                  </div>
    
                  {/* 紅色橫線 */}
                  <div className="flex-1 h-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] relative pointer-events-none">
                    {/* 增加觸控熱區 */}
                    <div 
                      onPointerDown={() => setIsDragging(true)}
                      className="absolute -top-5 -bottom-5 left-0 right-0 cursor-ns-resize pointer-events-auto" 
                    />
                  </div>
              </div>
          </div>
        </>
      ) : (
        <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-gray-800">
              {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button onClick={handleNextMonth} className="p-2 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div id="calendar-grid" className="grid grid-cols-7 gap-2 mb-4">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(wd => (
              <div key={wd} className="text-center text-[10px] font-bold text-gray-400 uppercase py-2">
                {wd}
              </div>
            ))}
            {(() => {
              const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
              const days = [];
              for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
              for (let i = 1; i <= daysInMonth; i++) days.push(i);
              
              const today = new Date();
              const isCurrentMonth = today.getMonth() + 1 === currentMonth && today.getFullYear() === currentYear;

              return days.map((d, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    if (d) {
                      setSelectedDate(d);
                      setViewMode('day');
                    }
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer relative
                    ${d === selectedDate ? 'bg-red-500 text-white shadow-lg scale-105 z-10' : d ? 'hover:bg-gray-100 text-gray-800' : ''}
                    ${isCurrentMonth && d === today.getDate() && d !== selectedDate ? 'border-2 border-red-200' : ''}
                  `}
                >
                  {d && (
                    <>
                      <span className="text-sm font-bold">{d}</span>
                      <div className="flex gap-0.5 mt-1">
                        {events.filter(e => e.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`).slice(0, 3).map((e, idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${d === selectedDate ? 'bg-white/60' : (e.color?.replace('bg-', 'bg-').replace('-200', '-400') || 'bg-red-400')}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ));
            })()}
          </div>
          
          <div id="calendar-events" className="mt-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Events for {selectedDate}</h3>
            <div className="space-y-3">
              {events.filter(e => e.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`).length > 0 ? (
                events.filter(e => e.date === `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${selectedDate.toString().padStart(2, '0')}`).map(e => (
                  <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className={`w-2 h-8 rounded-full ${e.color || 'bg-red-400'}`} />
                    <div>
                      <div className="text-sm font-bold text-gray-800">{e.title || 'Untitled Event'}</div>
                      <div className="text-[10px] text-gray-400 font-medium">
                        {Math.floor(e.top / HOUR_HEIGHT).toString().padStart(2, '0')}:{Math.floor((e.top % HOUR_HEIGHT) / HOUR_HEIGHT * 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm italic">No events scheduled</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarDetailView;
