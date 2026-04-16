import React, { useState, useMemo } from 'react';
import { AppRoute, Task, CalendarEvent } from '../types';
import { Calendar as CalendarIcon, Plus, GripVertical, User, BarChart2, Award, Zap } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'motion/react';

interface HomeViewProps {
  navigateTo: (route: AppRoute) => void;
  tasks: Task[];
  toggleTask: (id: string) => void;
  archiveTask: (id: string) => void;
  calendarEvents: CalendarEvent[];
  sections: string[];
  setSections: React.Dispatch<React.SetStateAction<string[]>>;
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
  };
  focusLogs: any[];
  isTourVisible?: boolean;
  timerTimeLeft: number;
  visibleSubSections: Record<string, string[]>;
  setVisibleSubSections: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const allSubSections: Record<string, { id: string, name: string }[]> = {
  focus: [
    { id: 'tasks', name: "Reminders" },
    { id: 'timer', name: '番茄鐘' },
    { id: 'analysis', name: '專注分析' }
  ],
  calendar: [
    { id: 'calendar_card', name: '月曆' }
  ],
  games: [
    { id: 'pets', name: '寵物專區' },
    { id: 'race', name: '賽馬場' },
    { id: 'ranking', name: '積分排名' }
  ]
};

const SortableItem = ({ id, children, isMenuOpen }: { id: string; children: React.ReactNode; isMenuOpen?: boolean; key?: React.Key }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : (isMenuOpen ? 40 : 1),
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`mb-6 ${isDragging ? 'opacity-50' : ''}`}>
      <div className="absolute -left-4 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing p-2 text-gray-300 hover:text-gray-500 z-20" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>
      {children}
    </div>
  );
};

const SortableSubItem = ({ id, children }: { id: string; children: React.ReactNode; key?: React.Key }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : 1,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50' : ''} cursor-grab active:cursor-grabbing`} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const HomeView: React.FC<HomeViewProps> = ({ navigateTo, tasks, toggleTask, archiveTask, calendarEvents, sections, setSections, userProfile, focusLogs, isTourVisible, timerTimeLeft, visibleSubSections, setVisibleSubSections }) => {

  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  // 當導覽啟動時，強制顯示所有相關區塊
  const effectiveVisibleSubSections = useMemo(() => {
    if (isTourVisible) {
      return {
        focus: ['tasks', 'timer', 'analysis'],
        calendar: ['calendar_card'],
        games: ['pets', 'race', 'ranking']
      };
    }
    return visibleSubSections;
  }, [visibleSubSections, isTourVisible]);

  const saveSubSections = (newVal: Record<string, string[]>) => {
    setVisibleSubSections(newVal);
  };

  const removeSubSection = (sectionId: string, subId: string) => {
    const newSubs = { ...visibleSubSections };
    newSubs[sectionId] = newSubs[sectionId].filter(id => id !== subId);
    saveSubSections(newSubs);
  };

  const addSubSection = (sectionId: string, subId: string) => {
    const newSubs = { ...visibleSubSections };
    if (!newSubs[sectionId].includes(subId)) {
      newSubs[sectionId] = [...newSubs[sectionId], subId];
    }
    saveSubSections(newSubs);
    setShowAddMenu(null);
  };

  // Safe Focus Logs Calculation
  const todayFocusStats = useMemo(() => {
    if (!focusLogs || !Array.isArray(focusLogs)) return { hours: 0, minutes: 0, totalMins: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysLogs = focusLogs.filter(l => l && l.startTime && l.startTime.startsWith(todayStr));
    const totalMins = todaysLogs.reduce((acc, l) => acc + (l.duration || 0), 0);
    
    return {
      hours: Math.floor(totalMins / 60),
      minutes: totalMins % 60,
      totalMins
    };
  }, [focusLogs]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDate = today.getDate();
  const monthName = today.toLocaleString('en-US', { month: 'long' });

  const getDominantColorForDate = (day: number) => {
    const dateStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const eventsForDay = calendarEvents.filter(e => e.date === dateStr && !e.isDraft);
    
    if (eventsForDay.length === 0) return null;

    const colorDurations: Record<string, number> = {};
    eventsForDay.forEach(event => {
      const color = event.color || 'bg-gray-100';
      colorDurations[color] = (colorDurations[color] || 0) + event.height;
    });

    let dominantColor = null;
    let maxDuration = 0;
    for (const [color, duration] of Object.entries(colorDurations)) {
      if (duration > maxDuration) {
        maxDuration = duration;
        dominantColor = color;
      }
    }

    // Map bg-* to border-*
    if (dominantColor) {
      return dominantColor.replace('bg-', 'border-').replace('-200', '-400').replace('-100', '-300');
    }
    return null;
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if we are dragging a main section
      if (sections.includes(activeId)) {
        setSections((items) => {
          const oldIndex = items.indexOf(activeId);
          const newIndex = items.indexOf(overId);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else {
        // Handle sub-section dragging
        const sectionId = Object.keys(visibleSubSections).find(key => 
          visibleSubSections[key].includes(activeId)
        );
        if (sectionId) {
          const newSubs = { ...visibleSubSections };
          const oldIndex = newSubs[sectionId].indexOf(activeId);
          const newIndex = newSubs[sectionId].indexOf(overId);
          if (newIndex !== -1) {
            newSubs[sectionId] = arrayMove(newSubs[sectionId], oldIndex, newIndex);
            saveSubSections(newSubs);
          }
        }
      }
    }
  };

  const renderSection = (id: string) => {
    switch (id) {
      case 'focus':
        const hiddenFocus = allSubSections.focus.filter(s => !effectiveVisibleSubSections.focus.includes(s.id));
        return (
          <div key="focus" className="pl-8 pr-6">
            <div className="flex justify-between items-center mb-3 relative">
              <h2 className="text-xl font-bold">Focus</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => navigateTo(AppRoute.FOCUS_ANALYSIS)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="專注分析報告"
                >
                  <BarChart2 size={20} />
                </button>
                <button 
                  onClick={() => setShowAddMenu(showAddMenu === 'focus' ? null : 'focus')}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
                {showAddMenu === 'focus' && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">新增區塊</p>
                    {hiddenFocus.length > 0 ? hiddenFocus.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => addSubSection('focus', s.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        {s.name} <Plus size={14} className="text-blue-500" />
                      </button>
                    )) : (
                      <p className="px-4 py-2 text-xs text-gray-400 italic">無可新增項目</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <SortableContext items={effectiveVisibleSubSections.focus} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {effectiveVisibleSubSections.focus.map(subId => (
                  <SortableSubItem key={subId} id={subId}>
                    {subId === 'tasks' ? (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        id="home-tasks"
                        onClick={() => navigateTo(AppRoute.TASKS)}
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-7 text-white shadow-2xl shadow-blue-200 cursor-pointer transform hover:scale-[1.01] transition-all relative group overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('focus', 'tasks'); }}
                          className="absolute top-4 right-4 w-6 h-6 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white hover:border-red-500"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        {/* Glassmorphism Progress Ring */}
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-2xl font-black tracking-tight">Reminders</h3>
                            <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-widest">Today's Missions</p>
                          </div>
                          <div className="relative w-14 h-14">
                            <svg className="w-full h-full -rotate-90">
                              <circle cx="28" cy="28" r="24" fill="transparent" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                              <circle 
                                cx="28" cy="28" r="24" fill="transparent" 
                                stroke="white" strokeWidth="4" 
                                strokeDasharray={150.8}
                                strokeDashoffset={150.8 * (1 - (tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)))}
                                strokeLinecap="round"
                                className="transition-all duration-1000"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">
                              {Math.round((tasks.filter(t => t.completed).length / Math.max(tasks.length, 1)) * 100)}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {tasks.length > 0 ? tasks.slice(0, 3).map(task => (
                            <motion.div 
                              initial={{ x: -10, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              key={task.id} 
                              className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10"
                            >
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!task.completed) {
                                    setConfirmTask(task);
                                  } else {
                                    toggleTask(task.id);
                                  }
                                }}
                                className={`w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-white border-white scale-90' : 'border-white/40 hover:border-white'}`}
                              >
                                {task.completed && <span className="text-blue-500 text-[10px] font-black">✓</span>}
                              </button>
                              <div className={task.completed ? 'opacity-40 line-through' : ''}>
                                <p className="text-sm font-bold truncate max-w-[140px]">{task.title}</p>
                                <p className="text-[9px] opacity-60 font-black">{task.dueDate}</p>
                              </div>
                            </motion.div>
                          )) : (
                            <p className="text-xs italic opacity-50 text-center py-4">No tasks for today</p>
                          )}
                        </div>
                      </motion.div>
                    ) : subId === 'timer' ? (
                      <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        id="home-timer"
                        onClick={() => navigateTo(AppRoute.FOCUS_TIMER)}
                        className="bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 rounded-[2.5rem] p-6 text-white shadow-2xl shadow-rose-200 cursor-pointer transform hover:scale-[1.02] transition-all relative group overflow-hidden"
                      >
                        {/* Animated background shape */}
                        <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('focus', 'timer'); }}
                          className="absolute top-4 right-4 w-6 h-6 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white hover:border-red-500"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        
                        <div className="flex justify-between items-center relative z-10">
                          <div className="w-12 h-12 bg-white/20 rounded-[1.25rem] flex items-center justify-center text-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                            🍅
                          </div>
                          <div className="text-right">
                              <div className="text-[40px] font-black tracking-tighter leading-none mb-1">
                                {Math.floor(timerTimeLeft / 60)}:{Math.floor(timerTimeLeft % 60).toString().padStart(2, '0')}
                              </div>
                              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">{timerTimeLeft > 0 ? 'Remaining' : 'Session End'}</div>
                          </div>
                        </div>
                        <h3 className="text-xl font-black mt-6 tracking-tight">番茄鐘</h3>
                        <div className="mt-2 flex gap-2">
                           <span className="px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-sm">Focus Mode</span>
                           <span className="px-3 py-1 bg-black/10 rounded-full text-[9px] font-black uppercase tracking-wider">Rest</span>
                        </div>
                      </motion.div>
                    ) : subId === 'analysis' ? (
                      <div 
                        id="home-analysis"
                        onClick={() => navigateTo(AppRoute.FOCUS_ANALYSIS)}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-6 text-white shadow-xl cursor-pointer transform hover:scale-[1.01] transition-transform relative group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('focus', 'analysis'); }}
                          className="absolute top-4 right-4 w-6 h-6 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white hover:border-red-500"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        <div className="flex justify-between items-center mb-2">
                           <div className="p-2 bg-white/20 rounded-xl">
                              <BarChart2 size={24} />
                           </div>
                           <div className="text-right">
                              <div className="text-[10px] font-black opacity-60 uppercase tracking-widest">Today's Focus</div>
                              <div className="text-xl font-black">
                                 {todayFocusStats.hours}h {todayFocusStats.minutes}m
                              </div>
                           </div>
                        </div>
                        <h3 className="text-xl font-bold mt-4">專注報告</h3>
                        <p className="text-[10px] opacity-70 font-bold mt-1">點擊查看詳細數據分析</p>
                      </div>
                    ) : null}
                  </SortableSubItem>
                ))}
              </div>
            </SortableContext>
          </div>
        );
      case 'calendar':
        const hiddenCalendar = allSubSections.calendar.filter(s => !effectiveVisibleSubSections.calendar.includes(s.id));
        return (
          <div key="calendar" className="pl-8 pr-6">
            <div className="flex justify-between items-center mb-4 relative">
              <h2 className="text-xl font-bold">行事曆</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowAddMenu(showAddMenu === 'calendar' ? null : 'calendar')}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
                {showAddMenu === 'calendar' && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">新增區塊</p>
                    {hiddenCalendar.length > 0 ? hiddenCalendar.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => addSubSection('calendar', s.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        {s.name} <Plus size={14} className="text-blue-500" />
                      </button>
                    )) : (
                      <p className="px-4 py-2 text-xs text-gray-400 italic">無可新增項目</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <SortableContext items={effectiveVisibleSubSections.calendar} strategy={verticalListSortingStrategy}>
              {effectiveVisibleSubSections.calendar.map(subId => (
                <SortableSubItem key={subId} id={subId}>
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    id="home-calendar"
                    onClick={() => navigateTo(AppRoute.CALENDAR_DETAIL)}
                    className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-8 shadow-xl shadow-gray-100 cursor-pointer relative group transition-all hover:border-red-100"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSubSection('calendar', 'calendar_card'); }}
                      className="absolute top-4 right-4 w-6 h-6 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white"
                    >
                      <span className="text-xs font-black">×</span>
                    </button>
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-2xl font-black text-gray-800 tracking-tighter">{monthName}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currentYear}</p>
                      </div>
                      <div className="p-3 bg-red-50 text-red-500 rounded-2xl">
                        <CalendarIcon size={24} />
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-gray-300 mb-4 tracking-tighter">
                      <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                    </div>
                    <div className="grid grid-cols-7 gap-y-4 text-center text-sm font-black items-center">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                        const dominantBorderColor = getDominantColorForDate(d);
                        const isToday = d === currentDate;
                        return (
                          <div key={d} className="relative flex justify-center items-center h-8 group/day">
                            <span 
                              className={`
                                w-8 h-8 flex items-center justify-center transition-all rounded-xl
                                ${isToday ? 'bg-red-500 text-white shadow-lg shadow-red-200 scale-110' : 'text-gray-700 hover:bg-gray-50'}
                              `}
                            >
                              {d}
                            </span>
                            {dominantBorderColor && !isToday && (
                              <div className={`absolute -bottom-1 w-1 h-1 rounded-full ${dominantBorderColor.replace('border-', 'bg-').replace('-400', '-500').replace('-300', '-400')} animate-pulse`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </SortableSubItem>
              ))}
            </SortableContext>
          </div>
        );
      case 'games':
        const hiddenGames = allSubSections.games.filter(s => !effectiveVisibleSubSections.games.includes(s.id));
        return (
          <div key="games" className="pl-8 pr-6" id="home-games-area">
            <div className="flex justify-between items-center mb-4 relative">
              <h2 className="text-xl font-bold">遊戲專區</h2>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowAddMenu(showAddMenu === 'games' ? null : 'games')}
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Plus size={24} strokeWidth={3} />
                </button>
                {showAddMenu === 'games' && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 py-2 min-w-[140px] animate-in fade-in zoom-in duration-200">
                    <p className="px-4 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">新增區塊</p>
                    {hiddenGames.length > 0 ? hiddenGames.map(s => (
                      <button 
                        key={s.id}
                        onClick={() => addSubSection('games', s.id)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between"
                      >
                        {s.name} <Plus size={14} className="text-blue-500" />
                      </button>
                    )) : (
                      <p className="px-4 py-2 text-xs text-gray-400 italic">無可新增項目</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <SortableContext items={effectiveVisibleSubSections.games} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {effectiveVisibleSubSections.games.map(subId => (
                  <SortableSubItem key={subId} id={subId}>
                    {subId === 'pets' ? (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        onClick={() => navigateTo(AppRoute.GAME_PETS)}
                        className="bg-gradient-to-br from-indigo-400 via-cyan-400 to-teal-300 rounded-[2.5rem] p-8 h-48 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.03] shadow-2xl shadow-cyan-100 group"
                      >
                        {/* Decorative Patterns */}
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/20 rounded-full blur-3xl animate-pulse" />
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'pets'); }}
                          className="absolute top-6 right-6 w-7 h-7 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        
                        <div className="relative z-10">
                          <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-md">寵物樂園</h3>
                          <p className="text-[10px] font-black text-white/80 mt-1 tracking-widest uppercase">My Little Sanctuary</p>
                          <div className="flex gap-2 mt-4">
                             <div className="px-3 py-1 bg-white/30 rounded-full text-[10px] font-black text-white backdrop-blur-md border border-white/20">收集寵物</div>
                             <div className="px-3 py-1 bg-black/10 rounded-full text-[10px] font-black text-white">裝飾空間</div>
                          </div>
                        </div>
                        
                        <div className="absolute -bottom-4 right-6 flex items-end select-none">
                          <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-7xl drop-shadow-2xl">🦦</motion.span>
                          <motion.span animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5, delay: 0.5 }} className="text-4xl mb-4 ml-[-10px] opacity-60">🐚</motion.span>
                          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-3xl mb-12 ml-[-5px] opacity-40">✨</motion.span>
                        </div>
                      </motion.div>
                    ) : subId === 'race' ? (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        onClick={() => navigateTo(AppRoute.GAME_RACE)}
                        className="bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 rounded-[2.5rem] p-7 cursor-pointer flex justify-between items-center transition-all hover:scale-[1.03] shadow-xl shadow-emerald-200 relative group overflow-hidden"
                      >
                         {/* Motion Lines */}
                         <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,transparent,transparent_20px,white_21px,white_22px)]" />
                         
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'race'); }}
                          className="absolute top-6 right-6 w-7 h-7 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="relative">
                            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center text-3xl shadow-lg border border-white/20 backdrop-blur-md">
                              🏇
                            </div>
                            <div className="absolute -top-2 -right-2 bg-red-500 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white animate-pulse">LIVE</div>
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-white tracking-widest uppercase italic drop-shadow-lg">賽馬競技</h3>
                            <p className="text-[10px] font-black text-emerald-100 tracking-tighter opacity-80">WIN COINS BY FOCUSING</p>
                          </div>
                        </div>
                        <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                           <Zap className="text-white opacity-20 absolute right-8" size={60} strokeWidth={3} />
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        onClick={() => navigateTo(AppRoute.LEADERBOARD)}
                        className="bg-gradient-to-br from-gray-900 via-amber-900 to-amber-700 rounded-[2.5rem] p-7 cursor-pointer flex justify-between items-center transition-all hover:scale-[1.03] shadow-2xl shadow-orange-200 relative group overflow-hidden border border-amber-500/30"
                      >
                        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 to-transparent" />
                        
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'ranking'); }}
                          className="absolute top-6 right-6 w-7 h-7 bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg z-50 hover:bg-red-500 hover:text-white"
                        >
                          <span className="text-xs font-black">×</span>
                        </button>
                        
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-amber-600 rounded-3xl flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(251,191,36,0.4)] border border-amber-200/50 backdrop-blur-sm">
                            🏆
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-tight">積分排行</h3>
                            <div className="flex items-center gap-2 mt-1">
                               <Award size={14} className="text-amber-400 animate-bounce" />
                               <span className="text-[10px] font-black text-amber-200/80 uppercase tracking-widest">Global Ranking</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right relative z-10 bg-black/40 p-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                           <div className="text-[10px] font-black text-amber-500/80 tracking-widest mb-1">YOUR RANK</div>
                           <div className="text-3xl font-black text-white italic tracking-tighter">#1</div>
                        </div>
                      </motion.div>
                    )}
                  </SortableSubItem>
                ))}
              </div>
            </SortableContext>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6 pl-4 pr-2" id="home-profile">
        <h1 className="text-3xl font-extrabold tracking-tight">F.O.C.U.S.</h1>
        <button 
          onClick={() => navigateTo(AppRoute.PROFILE)}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-all shadow-sm overflow-hidden active:scale-95"
        >
          {userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={20} />
          )}
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections} strategy={verticalListSortingStrategy}>
          {sections.map((id) => (
            <SortableItem key={id} id={id} isMenuOpen={showAddMenu === id}>
              {renderSection(id)}
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>

      {/* 確認完成彈窗 */}
      <ConfirmationModal
        isOpen={!!confirmTask}
        onClose={() => setConfirmTask(null)}
        onConfirm={() => {
          if (confirmTask) {
            archiveTask(confirmTask.id);
            setConfirmTask(null);
          }
        }}
        title="確認完成任務？"
        message={`「${confirmTask?.title}」完成後將會被移至封存區，並獲得 50 金幣獎勵。`}
        confirmText="確定完成"
        cancelText="取消"
      />
    </div>
  );
};

export default HomeView;
