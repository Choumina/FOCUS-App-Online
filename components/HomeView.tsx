
import React, { useState } from 'react';
import { AppRoute, Task, CalendarEvent } from '../types';
import { Calendar as CalendarIcon, MoreHorizontal, Plus, ChevronRight, MessageCircle, Clock, GripVertical, User } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HomeViewProps {
  navigateTo: (route: AppRoute) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
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
}

const allSubSections: Record<string, { id: string, name: string }[]> = {
  focus: [
    { id: 'tasks', name: "Reminders" },
    { id: 'timer', name: '番茄鐘' }
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

const HomeView: React.FC<HomeViewProps> = ({ navigateTo, tasks, setTasks, toggleTask, archiveTask, calendarEvents, sections, setSections, userProfile }) => {
  const [visibleSubSections, setVisibleSubSections] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('focus_visible_subsections');
    return saved ? JSON.parse(saved) : {
      focus: ['tasks', 'timer'],
      calendar: ['calendar_card'],
      games: ['pets', 'race', 'ranking']
    };
  });

  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);

  const saveSubSections = (newVal: Record<string, string[]>) => {
    setVisibleSubSections(newVal);
    localStorage.setItem('focus_visible_subsections', JSON.stringify(newVal));
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
        const hiddenFocus = allSubSections.focus.filter(s => !visibleSubSections.focus.includes(s.id));
        return (
          <div key="focus" className="pl-8 pr-6">
            <div className="flex justify-between items-center mb-3 relative">
              <h2 className="text-xl font-bold">Focus</h2>
              <div className="flex items-center gap-1">
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

            <SortableContext items={visibleSubSections.focus} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {visibleSubSections.focus.map(subId => (
                  <SortableSubItem key={subId} id={subId}>
                    {subId === 'tasks' ? (
                      <div 
                        id="home-tasks"
                        onClick={() => navigateTo(AppRoute.TASKS)}
                        className="bg-gradient-to-br from-blue-300 to-indigo-400 rounded-3xl p-6 text-white shadow-xl cursor-pointer transform hover:scale-[1.01] transition-transform relative group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('focus', 'tasks'); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                        >
                          <span className="text-[10px] font-black">×</span>
                        </button>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Reminders</h3>
                        </div>
                        <div className="space-y-3">
                          {tasks.slice(0, 2).map(task => (
                            <div key={task.id} className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!task.completed) {
                                    setConfirmTask(task);
                                  } else {
                                    toggleTask(task.id);
                                  }
                                }}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-white border-white' : 'border-white/50'}`}
                              >
                                {task.completed && <span className="text-blue-400 text-[10px] font-bold">✓</span>}
                              </button>
                              <div className={task.completed ? 'opacity-50 line-through' : ''}>
                                <p className="text-sm font-medium">{task.title}</p>
                                <p className="text-[10px] opacity-70">{task.dueDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div 
                        id="home-timer"
                        onClick={() => navigateTo(AppRoute.FOCUS_TIMER)}
                        className="bg-gradient-to-br from-pink-300 to-purple-400 rounded-3xl p-6 text-white shadow-lg cursor-pointer transform hover:scale-[1.01] transition-transform relative group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('focus', 'timer'); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                        >
                          <span className="text-[10px] font-black">×</span>
                        </button>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-2xl">🍅</span>
                        </div>
                        <h3 className="text-lg font-bold mt-4">番茄鐘</h3>
                      </div>
                    )}
                  </SortableSubItem>
                ))}
              </div>
            </SortableContext>
          </div>
        );
      case 'calendar':
        const hiddenCalendar = allSubSections.calendar.filter(s => !visibleSubSections.calendar.includes(s.id));
        return (
          <div key="calendar" className="pl-8 pr-6">
            <div className="flex justify-between items-center mb-4 relative">
              <h2 className="text-xl font-bold">Calendar</h2>
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
            
            <SortableContext items={visibleSubSections.calendar} strategy={verticalListSortingStrategy}>
              {visibleSubSections.calendar.map(subId => (
                <SortableSubItem key={subId} id={subId}>
                  <div 
                    id="home-calendar"
                    onClick={() => navigateTo(AppRoute.CALENDAR_DETAIL)}
                    className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm cursor-pointer relative group"
                  >
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeSubSection('calendar', 'calendar_card'); }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                    >
                      <span className="text-[10px] font-black">×</span>
                    </button>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-red-500">{monthName} {currentYear} <ChevronRight className="inline" size={16} /></h3>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-4 text-gray-400">
                          <ChevronRight className="rotate-180" size={20} />
                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-gray-400 mb-2">
                      <span>SUN</span><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span>
                    </div>
                    <div className="grid grid-cols-7 gap-y-3 text-center text-sm font-medium items-center">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
                        const dominantBorderColor = getDominantColorForDate(d);
                        return (
                          <div key={d} className="relative flex justify-center items-center h-8">
                            <span 
                              className={`
                                ${d === currentDate ? 'bg-red-500 text-white rounded-full flex items-center justify-center w-8 h-8' : 'w-8 h-8 flex items-center justify-center'}
                              `}
                            >
                              {d}
                            </span>
                            {dominantBorderColor && (
                              <div className={`absolute bottom-0 w-1.5 h-1.5 rounded-full ${dominantBorderColor.replace('border-', 'bg-').replace('-400', '-500').replace('-300', '-400')}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SortableSubItem>
              ))}
            </SortableContext>
          </div>
        );
      case 'games':
        const hiddenGames = allSubSections.games.filter(s => !visibleSubSections.games.includes(s.id));
        return (
          <div key="games" className="pl-8 pr-6" id="home-games-area">
            <div className="flex justify-between items-center mb-4 relative">
              <h2 className="text-xl font-bold">Game Areas</h2>
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
            <SortableContext items={visibleSubSections.games} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {visibleSubSections.games.map(subId => (
                  <SortableSubItem key={subId} id={subId}>
                    {subId === 'pets' ? (
                      <div 
                        onClick={() => navigateTo(AppRoute.GAME_PETS)}
                        className="bg-gradient-to-br from-cyan-400 via-cyan-300 to-teal-300 rounded-[2.5rem] p-8 h-44 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'pets'); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                        >
                          <span className="text-[10px] font-black">×</span>
                        </button>
                        <h3 className="text-4xl font-bold text-white relative z-10 tracking-tight">寵物專區</h3>
                        <div className="absolute inset-0 flex items-center justify-around select-none">
                          <span className="text-5xl mt-16 opacity-60">🦦</span>
                          <span className="text-3xl mb-12 opacity-40">🎮</span>
                          <span className="text-4xl mt-6 opacity-60">🧸</span>
                        </div>
                      </div>
                    ) : subId === 'race' ? (
                      <div 
                        onClick={() => navigateTo(AppRoute.GAME_RACE)}
                        className="bg-gradient-to-r from-emerald-400 to-green-400 rounded-[2rem] p-6 cursor-pointer flex justify-between items-center transition-all hover:scale-[1.01] relative group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'race'); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                        >
                          <span className="text-[10px] font-black">×</span>
                        </button>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">🏇</span>
                          <h3 className="text-2xl font-bold text-white">賽馬場</h3>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => navigateTo(AppRoute.LEADERBOARD)}
                        className="bg-gradient-to-r from-orange-400 to-yellow-400 rounded-[2rem] p-6 cursor-pointer flex justify-between items-center transition-all hover:scale-[1.01] relative group"
                      >
                        <button 
                          onClick={(e) => { e.stopPropagation(); removeSubSection('games', 'ranking'); }}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30 hover:text-red-500"
                        >
                          <span className="text-[10px] font-black">×</span>
                        </button>
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">🏆</span>
                          <h3 className="text-2xl font-bold text-white">積分排名</h3>
                        </div>
                      </div>
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
      <div className="flex justify-between items-center mb-6 pl-4 pr-2">
        <h1 className="text-3xl font-extrabold tracking-tight">F.O.C.U.S.</h1>
        <button 
          id="home-profile"
          onClick={() => navigateTo(AppRoute.PROFILE)}
          className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors shadow-sm overflow-hidden"
        >
          {userProfile.avatar ? (
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
      {confirmTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-center text-gray-800 mb-2">確認完成任務？</h3>
            <p className="text-gray-500 text-center text-sm mb-8">
              「{confirmTask.title}」完成後將會被移至封存區，並獲得 50 金幣獎勵。
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  archiveTask(confirmTask.id);
                  setConfirmTask(null);
                }}
                className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all"
              >
                確定完成
              </button>
              <button 
                onClick={() => setConfirmTask(null)}
                className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold active:scale-95 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeView;
