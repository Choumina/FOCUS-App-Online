
import React, { useState, useRef, useEffect } from 'react';
import { AppRoute } from '../types';
import { Search, Mic, Send, Sparkles, Home, RotateCcw, Calendar, CheckCircle2, Plus, X, Maximize2 } from 'lucide-react';
import { chatWithAssistant } from '../geminiService';
import { CalendarEvent, Task } from '../types';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';

interface Message {
  role: 'user' | 'bot';
  text: string;
  type?: 'form_schedule' | 'form_task' | 'form_matrix_confirm' | 'form_matrix_input';
  isSubmitted?: boolean;
  matrixData?: any[];
}

const MatrixChart: React.FC<{ data: any[] }> = ({ data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Group tasks by their coordinates to handle overlaps
  const groupedDataMap = new Map<string, { x: number, y: number, tasks: string[] }>();
  
  data.forEach(item => {
    const key = `${item.urgency}-${item.importance}`;
    if (groupedDataMap.has(key)) {
      groupedDataMap.get(key)!.tasks.push(item.title);
    } else {
      groupedDataMap.set(key, {
        x: item.urgency,
        y: item.importance,
        tasks: [item.title]
      });
    }
  });

  const chartData = Array.from(groupedDataMap.values()).map(group => ({
    x: group.x,
    y: group.y,
    tasks: group.tasks,
    // Display label: if multiple tasks, show count; otherwise show title
    label: group.tasks.length > 1 ? `${group.tasks[0]} 等 ${group.tasks.length} 項` : group.tasks[0]
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const { tasks, x, y } = payload[0].payload;
      return (
        <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-2xl max-w-[200px]">
          <div className="text-[10px] font-black text-indigo-500 mb-2 uppercase tracking-wider">
            評分: 重要 {y} / 緊急 {x}
          </div>
          <div className="space-y-1.5">
            {tasks.map((task: string, i: number) => (
              <div key={i} className="text-xs font-bold text-gray-700 flex gap-2">
                <span className="text-indigo-300">•</span>
                {task}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = (isLarge: boolean) => (
    <div className={`${isLarge ? 'h-[500px] w-full' : 'h-[250px] w-full'} bg-white rounded-2xl p-2 relative`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="緊急度" 
            domain={[0, 6]} 
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: '緊急度', position: 'insideBottomRight', offset: -10, fontSize: 10, fontWeight: 'bold' }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="重要性" 
            domain={[0, 6]} 
            ticks={[1, 2, 3, 4, 5]}
            label={{ value: '重要性', position: 'insideLeft', angle: -90, offset: 10, fontSize: 10, fontWeight: 'bold' }}
          />
          <ZAxis type="number" range={[150, 150]} />
          <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <ReferenceLine x={3} stroke="#e2e8f0" strokeWidth={2} />
          <ReferenceLine y={3} stroke="#e2e8f0" strokeWidth={2} />
          <Scatter name="任務" data={chartData} fill="#6366f1">
            <LabelList dataKey="label" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#475569' }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Quadrant Labels */}
      <div className="absolute inset-0 pointer-events-none flex flex-wrap opacity-20 font-black text-[10px] uppercase tracking-widest p-10">
        <div className="w-1/2 h-1/2 flex items-start justify-center pt-2">重要不緊急</div>
        <div className="w-1/2 h-1/2 flex items-start justify-center pt-2">重要且緊急</div>
        <div className="w-1/2 h-1/2 flex items-end justify-center pb-2">不重要不緊急</div>
        <div className="w-1/2 h-1/2 flex items-end justify-center pb-2">不重要但緊急</div>
      </div>
    </div>
  );

  return (
    <div className="mt-4 relative group">
      <div className="border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        {renderChart(false)}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Maximize2 size={16} className="text-indigo-600" />
        </button>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors z-10"
            >
              <X size={24} className="text-gray-600" />
            </button>
            <h3 className="text-xl md:text-2xl font-black text-gray-800 mb-6 pr-12">艾森豪矩陣分析</h3>
            {renderChart(true)}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                <div className="text-xs font-bold text-red-600 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  第一象限：立即執行
                </div>
                <div className="text-[10px] text-red-400">重要且緊急的任務，應優先處理。</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="text-xs font-bold text-blue-600 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  第二象限：計劃執行
                </div>
                <div className="text-[10px] text-blue-400">重要但不緊急，應安排時間完成。</div>
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <div className="text-xs font-bold text-orange-600 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  第三象限：授權委派
                </div>
                <div className="text-[10px] text-orange-400">不重要但緊急，考慮請人協助。</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="text-xs font-bold text-gray-600 mb-1 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                  第四象限：延後或刪除
                </div>
                <div className="text-[10px] text-gray-400">不重要且不緊急，可暫緩處理。</div>
              </div>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-bold md:hidden"
            >
              返回對話
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const AIChatView: React.FC<{
  navigateTo: (route: AppRoute) => void;
  setCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  tasks?: Task[];
}> = ({ navigateTo, setCalendarEvents, tasks = [] }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('focus_ai_messages');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEnterHint, setShowEnterHint] = useState(false);
  
  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    wakeTime: '',
    sleepDuration: '',
    commuteTime: '',
    goals: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    taskName: '',
    format: '',
    startTime: '',
    endTime: ''
  });

  const [matrixForm, setMatrixForm] = useState<{
    tasks: { title: string; importance: number; urgency: number }[];
  }>({
    tasks: []
  });

  const lastEnterTime = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('focus_ai_messages', JSON.stringify(messages));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleReset = () => {
    setMessages([]);
    localStorage.removeItem('focus_ai_messages');
    // Reset forms too
    setScheduleForm({ wakeTime: '', sleepDuration: '', commuteTime: '', goals: '' });
    setTaskForm({ taskName: '', format: '', startTime: '', endTime: '' });
  };

  const handleSend = async (customMsg?: string) => {
    const msgToSend = customMsg || input.trim();
    if (!msgToSend) return;
    
    if (!customMsg) setInput('');
    setShowEnterHint(false);
    
    setMessages(prev => [...prev, { role: 'user', text: msgToSend }]);
    setIsTyping(true);

    if (msgToSend === '分析日常行程') {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: '好的～請幫我填入下列的資料！',
          type: 'form_schedule'
        }]);
        setIsTyping(false);
      }, 600);
      return;
    } else if (msgToSend === '拆解學習任務') {
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: '當然沒問題，你想拆解的任務是什麼呢？\n\n請告訴我它最終要以何種形式呈現呢？\n以及它開始執行、結束執行的時間。',
          type: 'form_task'
        }]);
        setIsTyping(false);
      }, 600);
      return;
    } else if (msgToSend === '任務重要性排序') {
      setTimeout(() => {
        const currentTasks = tasks.filter(t => !t.completed).map(t => ({
          title: t.title,
          importance: 3,
          urgency: 3
        }));
        setMatrixForm({ tasks: currentTasks });
        
        setMessages(prev => [...prev, { 
          role: 'bot', 
          text: `我看到你目前有 ${currentTasks.length} 個待辦事項：\n${currentTasks.map(t => `• ${t.title}`).join('\n')}\n\n請問未來的任務是否只有這些呢？`,
          type: 'form_matrix_confirm'
        }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    const response = await chatWithAssistant(msgToSend, messages);
    setMessages(prev => [...prev, { role: 'bot', text: response.text }]);
    
    if (response.events && response.events.length > 0 && setCalendarEvents) {
      setCalendarEvents(prev => {
        const newEvents = [...prev];
        response.events.forEach((e: any) => {
          if (e.startTime && e.endTime) {
            const startParts = e.startTime.split(':');
            const endParts = e.endTime.split(':');
            if (startParts.length === 2 && endParts.length === 2) {
              const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
              newEvents.push({
                id: Date.now().toString() + Math.random(),
                title: e.title,
                date: e.date,
                top: startMinutes,
                height: endMinutes - startMinutes,
                color: 'bg-blue-100'
              });
            }
          }
        });
        return newEvents;
      });
    }
    setIsTyping(false);
  };

  const handleFormSubmit = async (type: 'schedule' | 'task' | 'matrix') => {
    setIsTyping(true);
    
    let prompt = '';
    if (type === 'schedule') {
      prompt = `使用者提供了日常行程資料：\n1. 起床時間：${scheduleForm.wakeTime}\n2. 睡眠需求：${scheduleForm.sleepDuration}\n3. 通勤時間：${scheduleForm.commuteTime}\n4. 想完成的事：${scheduleForm.goals}\n\n請分析並安排行程，並以「行程安排：[內容]」的格式回覆。`;
      setMessages(prev => prev.map((m, idx) => 
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    } else if (type === 'task') {
      prompt = `使用者提供了學習任務資料：\n1. 任務名稱：${taskForm.taskName}\n2. 呈現形式：${taskForm.format}\n3. 開始時間：${taskForm.startTime}\n4. 結束時間：${taskForm.endTime}\n\n請拆解此任務，並以「任務拆解：[內容]」的格式回覆。`;
      setMessages(prev => prev.map((m, idx) => 
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    } else if (type === 'matrix') {
      prompt = `使用者提供了任務重要性與緊急度評分（1-5）：\n${matrixForm.tasks.map(t => `- ${t.title}: 重要性 ${t.importance}, 緊急度 ${t.urgency}`).join('\n')}\n\n請根據這些評分進行艾森豪矩陣分析，並在 matrixData 欄位中回傳這些資料。`;
      setMessages(prev => prev.map((m, idx) => 
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    }

    const response = await chatWithAssistant(prompt, messages);
    setMessages(prev => [...prev, { 
      role: 'bot', 
      text: response.text,
      matrixData: response.matrixData 
    }]);
    
    if (response.events && response.events.length > 0 && setCalendarEvents) {
      setCalendarEvents(prev => {
        const newEvents = [...prev];
        response.events.forEach((e: any) => {
          if (e.startTime && e.endTime) {
            const startParts = e.startTime.split(':');
            const endParts = e.endTime.split(':');
            if (startParts.length === 2 && endParts.length === 2) {
              const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
              newEvents.push({
                id: Date.now().toString() + Math.random(),
                title: e.title,
                date: e.date,
                top: startMinutes,
                height: endMinutes - startMinutes,
                color: 'bg-blue-100'
              });
            }
          }
        });
        return newEvents;
      });
    }
    setIsTyping(false);

    // Clear forms
    if (type === 'schedule') {
      setScheduleForm({ wakeTime: '', sleepDuration: '', commuteTime: '', goals: '' });
    } else if (type === 'task') {
      setTaskForm({ taskName: '', format: '', startTime: '', endTime: '' });
    } else {
      setMatrixForm({ tasks: [] });
    }

    // 自動記錄到 Calendar (模擬邏輯)
    if (setCalendarEvents) {
      const newEvent: CalendarEvent = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        top: 200,
        height: 100,
        title: type === 'schedule' ? `行程：${scheduleForm.goals}` : `任務：${taskForm.taskName}`,
        color: type === 'schedule' ? 'bg-blue-500' : 'bg-purple-500'
      };
      setCalendarEvents(prev => [...prev, newEvent]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const now = Date.now();
      const timeDiff = now - lastEnterTime.current;

      if (timeDiff < 500) {
        // 500ms 內按第二次，發送
        handleSend();
        lastEnterTime.current = 0;
      } else {
        // 第一次按 Enter，顯示提示
        lastEnterTime.current = now;
        setShowEnterHint(true);
        // 500ms 後自動隱藏提示
        setTimeout(() => {
          setShowEnterHint(false);
        }, 500);
      }
    } else {
      // 按其他鍵重置計數
      lastEnterTime.current = 0;
      setShowEnterHint(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <header className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="w-8"></div> {/* Spacer for centering */}
        <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-500" size={20} fill="currentColor" fillOpacity={0.2} />
            <h1 className="text-lg font-bold text-indigo-600 tracking-tight">FOCUS AI</h1>
        </div>
        <button 
          onClick={handleReset}
          className="p-2 text-gray-300 hover:text-red-400 transition-colors"
          title="重置對話"
        >
          <RotateCcw size={18} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Welcome Header - Always visible at the top */}
        <div className="text-center py-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <h2 className="text-5xl font-black text-blue-500/80 mb-4 tracking-tighter">FOCUS AI</h2>
            <p className="text-gray-400 text-xs font-medium">「組織你的學術任務。輸入你的任務目標或每日行程。」</p>
        </div>

        {/* Initial Bot Message - Shown when no messages exist */}
        {messages.length === 0 && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-500 delay-300">
            <div className="max-w-[90%] p-4 rounded-3xl shadow-sm text-base font-medium bg-gray-100/80 text-gray-800 rounded-tl-none">
              你好！我是 FOCUS AI。今天有什麼我可以幫你安排的任務嗎？
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-4 rounded-3xl shadow-sm text-base font-medium whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-blue-500 text-white rounded-tr-none' : 'bg-gray-100/80 text-gray-800 rounded-tl-none'}`}>
              {m.text}
              
              {m.role === 'bot' && m.matrixData && (
                <MatrixChart data={m.matrixData} />
              )}

              {m.role === 'bot' && m.type === 'form_matrix_confirm' && !m.isSubmitted && (
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => {
                      setMessages(prev => [...prev, { role: 'user', text: '是的，只有這些。' }]);
                      setMessages(prev => [...prev, { 
                        role: 'bot', 
                        text: '好的，請為這些任務進行評分（1-5 分）：',
                        type: 'form_matrix_input'
                      }]);
                    }}
                    className="flex-1 py-3 bg-indigo-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-indigo-600 transition-all"
                  >
                    是的
                  </button>
                  <button 
                    onClick={() => {
                      setMessages(prev => [...prev, { role: 'user', text: '不，我還有其他任務。' }]);
                      setMessages(prev => [...prev, { 
                        role: 'bot', 
                        text: '沒問題！請在下方新增任務並進行評分：',
                        type: 'form_matrix_input'
                      }]);
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-2xl text-sm font-bold shadow-lg hover:bg-gray-300 transition-all"
                  >
                    不，我要新增
                  </button>
                </div>
              )}

              {m.role === 'bot' && m.type === 'form_matrix_input' && !m.isSubmitted && (
                <div className="mt-6 space-y-4">
                  <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                      <div className="text-xs font-black text-gray-500 uppercase tracking-wider">任務評分清單</div>
                      <div className="text-[10px] text-gray-400 font-bold">1-5 分評分</div>
                    </div>
                    
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      <div className="divide-y divide-gray-50">
                        {matrixForm.tasks.map((task, idx) => (
                          <div key={idx} className="p-4 flex flex-col gap-3 hover:bg-gray-50/30 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                              <div className="text-sm font-bold text-gray-800 leading-tight">{task.title}</div>
                              <button 
                                onClick={() => {
                                  const newTasks = [...matrixForm.tasks];
                                  newTasks.splice(idx, 1);
                                  setMatrixForm({ tasks: newTasks });
                                }}
                                className="p-1 text-gray-300 hover:text-red-400 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">重要性</span>
                                <input 
                                  type="number" 
                                  min="1" max="5"
                                  value={task.importance}
                                  onChange={e => {
                                    const newTasks = [...matrixForm.tasks];
                                    newTasks[idx].importance = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                                    setMatrixForm({ tasks: newTasks });
                                  }}
                                  className="w-full p-2 text-xs bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-400/30 text-center font-bold"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">緊急度</span>
                                <input 
                                  type="number" 
                                  min="1" max="5"
                                  value={task.urgency}
                                  onChange={e => {
                                    const newTasks = [...matrixForm.tasks];
                                    newTasks[idx].urgency = Math.min(5, Math.max(1, parseInt(e.target.value) || 1));
                                    setMatrixForm({ tasks: newTasks });
                                  }}
                                  className="w-full p-2 text-xs bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-indigo-400/30 text-center font-bold"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* 新增任務行 - 與上方同級 */}
                        <div className="p-4 bg-indigo-50/30 border-t border-indigo-100/50 space-y-3">
                          <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">快速新增任務</div>
                          <input 
                            type="text"
                            id="new-matrix-task-title"
                            placeholder="輸入任務名稱..."
                            className="w-full p-3 text-sm bg-white border border-indigo-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400/30 font-medium"
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-indigo-300 whitespace-nowrap">重要性</span>
                              <input 
                                type="number" 
                                id="new-matrix-task-imp"
                                defaultValue="3"
                                min="1" max="5"
                                className="w-full p-2 text-xs bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400/30 text-center font-bold"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-indigo-300 whitespace-nowrap">緊急度</span>
                              <input 
                                type="number" 
                                id="new-matrix-task-urg"
                                defaultValue="3"
                                min="1" max="5"
                                className="w-full p-2 text-xs bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400/30 text-center font-bold"
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const titleInput = document.getElementById('new-matrix-task-title') as HTMLInputElement;
                              const impInput = document.getElementById('new-matrix-task-imp') as HTMLInputElement;
                              const urgInput = document.getElementById('new-matrix-task-urg') as HTMLInputElement;
                              
                              if (titleInput.value.trim()) {
                                setMatrixForm(prev => ({
                                  tasks: [...prev.tasks, { 
                                    title: titleInput.value.trim(), 
                                    importance: parseInt(impInput.value) || 3, 
                                    urgency: parseInt(urgInput.value) || 3 
                                  }]
                                }));
                                titleInput.value = '';
                                impInput.value = '3';
                                urgInput.value = '3';
                              }
                            }}
                            className="w-full py-2.5 bg-white border-2 border-dashed border-indigo-200 text-indigo-500 rounded-2xl text-xs font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                          >
                            <Plus size={14} />
                            新增至清單
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleFormSubmit('matrix')}
                    disabled={matrixForm.tasks.length === 0}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-base font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:shadow-none"
                  >
                    <CheckCircle2 size={20} />
                    產生分析矩陣
                  </button>
                </div>
              )}
              
              {m.role === 'bot' && m.type === 'form_schedule' && !m.isSubmitted && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">1. 平日或假日起床時間</div>
                    <input 
                      type="text" 
                      placeholder="請輸入時間..."
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                      value={scheduleForm.wakeTime}
                      onChange={e => setScheduleForm({...scheduleForm, wakeTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">2. 睡眠需求時長</div>
                    <input 
                      type="text" 
                      placeholder="請輸入時長..."
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                      value={scheduleForm.sleepDuration}
                      onChange={e => setScheduleForm({...scheduleForm, sleepDuration: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">3. 日常通勤時間時長</div>
                    <input 
                      type="text" 
                      placeholder="請輸入時長..."
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all"
                      value={scheduleForm.commuteTime}
                      onChange={e => setScheduleForm({...scheduleForm, commuteTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">4. 你想完成的事</div>
                    <textarea 
                      placeholder="請輸入內容..."
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all min-h-[80px] resize-none"
                      value={scheduleForm.goals}
                      onChange={e => setScheduleForm({...scheduleForm, goals: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={() => handleFormSubmit('schedule')}
                    className="w-full py-3 bg-blue-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <CheckCircle2 size={16} />
                    確認送出
                  </button>
                </div>
              )}

              {m.role === 'bot' && m.type === 'form_task' && !m.isSubmitted && (
                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">你想拆解的任務是什麼呢？</div>
                    <input 
                      type="text" 
                      placeholder="請輸入任務..."
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                      value={taskForm.taskName}
                      onChange={e => setTaskForm({...taskForm, taskName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">它最終要以何種形式呈現呢？</div>
                    <input 
                      type="text" 
                      placeholder="例如：報告、筆記"
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                      value={taskForm.format}
                      onChange={e => setTaskForm({...taskForm, format: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">開始執行時間</div>
                    <input 
                      type="text" 
                      placeholder="例如：2026/03/15"
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                      value={taskForm.startTime}
                      onChange={e => setTaskForm({...taskForm, startTime: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500 font-bold ml-1">結束執行時間</div>
                    <input 
                      type="text" 
                      placeholder="例如：2026/03/20"
                      className="w-full p-3 text-sm bg-white border-none rounded-2xl shadow-inner focus:outline-none focus:ring-2 focus:ring-purple-400/30 transition-all"
                      value={taskForm.endTime}
                      onChange={e => setTaskForm({...taskForm, endTime: e.target.value})}
                    />
                  </div>
                  <button 
                    onClick={() => handleFormSubmit('task')}
                    className="w-full py-3 bg-purple-500 text-white rounded-2xl text-sm font-bold shadow-lg hover:bg-purple-600 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <CheckCircle2 size={16} />
                    確認送出
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none animate-pulse text-gray-400 text-[10px] flex items-center gap-2 font-bold">
               <Sparkles size={10} className="animate-spin duration-[3000ms]" />
               AI 正在思考中...
             </div>
           </div>
        )}
      </div>

      {/* 底部輸入區域 - 改為 Flex 佈局的一部分，確保在最下方 */}
      <div className="p-4 bg-white border-t border-gray-50">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide no-scrollbar">
            {['分析日常行程', '拆解學習任務', '任務重要性排序'].map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSuggestionClick(s)}
                  className="whitespace-nowrap bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-500 transition-all active:scale-95"
                >
                    {s}
                </button>
            ))}
        </div>

        <div className="flex items-center gap-2 relative">
          {/* Enter 提示氣泡 */}
          {showEnterHint && (
            <div className="absolute -top-12 right-0 bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-xl shadow-xl animate-bounce pointer-events-none z-[60]">
              再按一次 Enter 發送
              <div className="absolute -bottom-1 right-5 w-2 h-2 bg-gray-800 rotate-45"></div>
            </div>
          )}

          <button 
            onClick={() => navigateTo(AppRoute.HOME)}
            className="w-12 h-12 flex-shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-500 transition-all active:scale-90 border border-gray-100"
          >
            <Home size={20} />
          </button>

          <div className="flex-1 relative h-12">
            <div className="absolute inset-y-0 left-4 flex items-center text-gray-400">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="詢問 FOCUS AI..." 
              className="w-full h-full bg-gray-50 border border-gray-100 rounded-full pl-10 pr-12 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
            <div className="absolute inset-y-0 right-2 flex items-center">
               <button 
                 onClick={() => handleSend()} 
                 className="bg-indigo-500 w-8 h-8 rounded-full text-white shadow-md flex items-center justify-center hover:bg-indigo-600 transition-all transform active:scale-95"
               >
                  <Send size={14} className="ml-0.5" />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatView;
