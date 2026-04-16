
import React, { useState, useRef, useEffect } from 'react';
import { AppRoute } from '../types';
import { Send, Sparkles, Home, RotateCcw, Plus, X, Maximize2, Zap } from 'lucide-react';
import { chatWithAssistant } from '../geminiService';
import { CalendarEvent, Task } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, ReferenceLine } from 'recharts';
import ConfirmationModal from './ConfirmationModal';

interface MessageMatrixItem {
  title: string;
  importance: number;
  urgency: number;
}

interface Message {
  role: 'user' | 'bot';
  text: string;
  type?: 'form_schedule' | 'form_task' | 'form_matrix_confirm' | 'form_matrix_input';
  isSubmitted?: boolean;
  matrixData?: MessageMatrixItem[];
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const MatrixChart: React.FC<{ data: MessageMatrixItem[] }> = ({ data }) => {
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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { tasks: string[], x: number, y: number } }[] }) => {
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
  isPremium: boolean;
  userIdentity?: UserIdentity;
}> = ({ navigateTo, setCalendarEvents, tasks = [], isPremium, userIdentity }) => {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('focus_ai_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load AI conversations", e);
    }
    return [{
      id: 'default',
      title: 'FOCUS AI 對話',
      messages: [],
      updatedAt: Date.now()
    }];
  });

  const [currentConvId, setCurrentConvId] = useState<string>('default');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEnterHint, setShowEnterHint] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Current messages derived from conversations
  const currentConversation = conversations.find(c => c.id === currentConvId);
  const messages = currentConversation?.messages || [];

  // Form states
  const [scheduleForm, setScheduleForm] = useState({
    wakeTime: '',
    sleepTime: '',
    sleepNeeded: '',
    commuteTime: '',
    departureTime: '',
    returnTime: '',
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

  // Sync with localStorage
  useEffect(() => {
    localStorage.setItem('focus_ai_conversations', JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    if (currentConvId) {
      localStorage.setItem('focus_ai_current_conv_id', currentConvId);
    } else {
      localStorage.removeItem('focus_ai_current_conv_id');
    }
  }, [currentConvId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const updateMessages = (newMessages: Message[] | ((prev: Message[]) => Message[])) => {
    setConversations(prev => prev.map(c => {
      if (c.id === 'default') {
        const msgs = typeof newMessages === 'function' ? newMessages(c.messages) : newMessages;
        return { ...c, messages: msgs, updatedAt: Date.now() };
      }
      return c;
    }));
  };

  const handleClearRecords = () => {
    updateMessages([]);
    setShowClearConfirm(false);
  };


  const handleSend = async (customMsg?: string) => {
    const msgToSend = customMsg || input.trim();
    if (!msgToSend) return;

    if (!customMsg) setInput('');
    setShowEnterHint(false);

    // Add user message
    updateMessages(prev => [...prev, { role: 'user', text: msgToSend }]);
    setIsTyping(true);

    if (msgToSend === '分析日常行程') {
      setTimeout(() => {
        updateMessages(prev => [...prev, {
          role: 'bot',
          text: '好的～請幫我填入下列的資料！',
          type: 'form_schedule'
        }]);
        setIsTyping(false);
      }, 600);
      return;
    } else if (msgToSend === '拆解學習任務') {
      setTimeout(() => {
        updateMessages(prev => [...prev, {
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

        updateMessages(prev => [...prev, {
          role: 'bot',
          text: `我看到你目前有 ${currentTasks.length} 個待辦事項：\n${currentTasks.map(t => `• ${t.title}`).join('\n')}\n\n請問未來的任務是否只有這些呢？`,
          type: 'form_matrix_confirm'
        }]);
        setIsTyping(false);
      }, 600);
      return;
    }

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const response = await chatWithAssistant(msgToSend, history);
    let botText = response.text;

    // Check for high school portfolio link
    if (userIdentity === 'high_school' && (msgToSend.includes('學習歷程') || botText.includes('學習歷程'))) {
      if (!botText.includes('shs.k12ea.gov.tw')) {
        botText += '\n\n💡 相關連結：你可以參考 [教育部學習歷程檔案數位學習課程](https://shs.k12ea.gov.tw/public/12basic/e-portfolio/index.html) 獲得更多細節。';
      }
    }

    updateMessages(prev => [...prev, { role: 'bot', text: botText }]);

    if (response.events && response.events.length > 0 && setCalendarEvents) {
      setCalendarEvents(prev => {
        const newEvents = [...prev];
        const HOUR_HEIGHT = 40;
        response.events.forEach((e: { title: string; startTime?: string; endTime?: string; date?: string }) => {
          if (e.startTime && e.endTime) {
            const startParts = e.startTime.trim().split(':');
            const endParts = e.endTime.trim().split(':');
            if (startParts.length === 2 && endParts.length === 2) {
              const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

              const dateToUse = e.date || new Date().toISOString().split('T')[0];

              newEvents.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                title: e.title,
                date: dateToUse,
                top: (startMinutes / 60) * HOUR_HEIGHT,
                height: Math.max(20, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT),
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
      prompt = `使用者提供了日常行程資料：\n1. 起床時間：${scheduleForm.wakeTime}\n2. 睡覺時間：${scheduleForm.sleepTime}\n3. 睡眠時長需求：${scheduleForm.sleepNeeded}\n4. 平日通勤時間：${scheduleForm.commuteTime}\n5. 出門時間：${scheduleForm.departureTime}\n6. 到家時間：${scheduleForm.returnTime}\n7. 額外目標：${scheduleForm.goals}\n\n請分析此行程並給予具體的生活建議與進度安排。回覆應包含對睡眠充足度與通勤壓力的點評。`;
      updateMessages(prev => prev.map((m, idx) =>
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    } else if (type === 'task') {
      prompt = `使用者提供了學習任務資料：\n1. 拆解任務：${taskForm.taskName}\n2. 呈現形式：${taskForm.format}\n3. 開始執行時間：${taskForm.startTime}\n4. 結束執行時間：${taskForm.endTime}\n\n請根據要求的格式與時間窗口，將此任務拆解為可執行的步驟，並安排進入行程。`;
      updateMessages(prev => prev.map((m, idx) =>
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    } else if (type === 'matrix') {
      prompt = `使用者提供了任務重要性與緊急度評分（1-5）：\n${matrixForm.tasks.map(t => `- ${t.title}: 重要性 ${t.importance}, 緊急度 ${t.urgency}`).join('\n')}\n\n請進行艾森豪矩陣分析並給予執行建議。`;
      updateMessages(prev => prev.map((m, idx) =>
        idx === prev.length - 1 ? { ...m, isSubmitted: true } : m
      ));
    }

    const response = await chatWithAssistant(prompt, messages);
    updateMessages(prev => [...prev, {
      role: 'bot',
      text: response.text,
      matrixData: response.matrixData
    }]);

    if (response.events && response.events.length > 0 && setCalendarEvents) {
      setCalendarEvents(prev => {
        const newEvents = [...prev];
        const HOUR_HEIGHT = 40;
        response.events.forEach((e: { title: string; startTime?: string; endTime?: string; date?: string }) => {
          if (e.startTime && e.endTime) {
            const startParts = e.startTime.trim().split(':');
            const endParts = e.endTime.trim().split(':');
            if (startParts.length === 2 && endParts.length === 2) {
              const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
              const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

              const dateToUse = e.date || new Date().toISOString().split('T')[0];

              newEvents.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                title: e.title,
                date: dateToUse,
                top: (startMinutes / 60) * HOUR_HEIGHT,
                height: Math.max(20, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT),
                color: 'bg-indigo-100'
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
      setScheduleForm({ wakeTime: '', sleepTime: '', sleepNeeded: '', commuteTime: '', departureTime: '', returnTime: '', goals: '' });
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
        handleSend();
        lastEnterTime.current = 0;
      } else {
        lastEnterTime.current = now;
        setShowEnterHint(true);
        setTimeout(() => setShowEnterHint(false), 500);
      }
    } else {
      lastEnterTime.current = 0;
      setShowEnterHint(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  return (
    <div className="flex h-[100dvh] bg-white relative overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-w-0 bg-white relative">
        <header className="px-4 h-16 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigateTo(AppRoute.HOME)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
              <Home size={22} />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-800 tracking-tight">FOCUS AI</h1>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Always Persistent</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
            title="清空對話紀錄"
          >
            <RotateCcw size={18} />
          </button>
        </header>

        {/* Chat Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-8 md:px-12 space-y-10 scroll-smooth">
          {(!currentConvId || messages.length === 0) ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto text-center space-y-10 animate-in fade-in zoom-in-95 duration-1000">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200 rotate-6 animate-pulse">
                  <Sparkles className="text-white" size={40} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                  <Zap size={20} className="text-yellow-500" fill="currentColor" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter">我是 FOCUS AI</h2>
                <p className="text-gray-500 text-base font-medium leading-relaxed max-w-md mx-auto">
                  我可以協助你拆解學習任務、安排每日行程，<br className="hidden md:block" />
                  或是為你目前的待辦事項進行優先級排序。
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-6">
                {[
                  { title: '分析日常行程', desc: '為你的每一天找到最佳節奏', color: 'blue' },
                  { title: '拆解學習任務', desc: '將大目標化為可執行的小步', color: 'indigo' },
                  { title: '任務重要性排序', desc: '使用艾森豪矩陣進行數位化分析', color: 'purple' },
                  { title: '制定讀書計畫', desc: '幫你規劃考前或專題的時程表', color: 'pink' }
                ].map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.title)}
                    className="p-5 bg-white border border-gray-100 rounded-3xl text-left hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50/50 transition-all group relative overflow-hidden active:scale-95"
                  >
                    <div className="relative z-10 flex flex-col gap-1.5">
                      <div className="text-sm font-black text-gray-800 flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${s.color}-500`}></div>
                        {s.title}
                      </div>
                      <div className="text-[10px] text-gray-400 font-bold">{s.desc}</div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-0 group-hover:opacity-10 transition-opacity">
                      <Sparkles size={80} className="text-gray-900" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-10 pb-20">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                  <div className={`flex gap-4 max-w-[90%] md:max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${m.role === 'user' ? 'bg-gray-900 text-white' : 'bg-blue-500 text-white'}`}>
                      {m.role === 'user' ? 'U' : <Sparkles size={14} />}
                    </div>
                    <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}>
                      <div className={`px-5 py-4 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed shadow-sm ${m.role === 'user' ? 'bg-gray-100 text-gray-800 rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                        {m.text}
                        {m.role === 'bot' && m.matrixData && <MatrixChart data={m.matrixData} />}

                        {m.role === 'bot' && m.type === 'form_matrix_confirm' && !m.isSubmitted && (
                          <div className="mt-6 flex gap-3">
                            <button onClick={() => handleSend('是的，只有這些。')} className="flex-1 py-3 bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-lg">是的</button>
                            <button onClick={() => handleSend('不，我還有其他任務。')} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-bold">要新增</button>
                          </div>
                        )}

                        {m.role === 'bot' && m.type === 'form_matrix_input' && !m.isSubmitted && (
                          <div className="mt-6 space-y-4">
                            {/* Matrix Input Form components as seen in the original code but rendered within the message bubble */}
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden text-xs">
                              {matrixForm.tasks.map((task, idx) => (
                                <div key={idx} className="p-3 border-b border-gray-50 flex items-center justify-between">
                                  <span className="font-bold truncate max-w-[100px]">{task.title}</span>
                                  <div className="flex gap-2">
                                    <input type="number" min="1" max="5" value={task.importance} onChange={e => {
                                      const newTasks = [...matrixForm.tasks];
                                      newTasks[idx].importance = parseInt(e.target.value) || 1;
                                      setMatrixForm({ tasks: newTasks });
                                    }} className="w-8 p-1 text-center bg-gray-50 rounded" />
                                    <input type="number" min="1" max="5" value={task.urgency} onChange={e => {
                                      const newTasks = [...matrixForm.tasks];
                                      newTasks[idx].urgency = parseInt(e.target.value) || 1;
                                      setMatrixForm({ tasks: newTasks });
                                    }} className="w-8 p-1 text-center bg-gray-50 rounded" />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button onClick={() => handleFormSubmit('matrix')} className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black">產生分析矩陣</button>
                          </div>
                        )}

                        {m.role === 'bot' && m.type === 'form_schedule' && !m.isSubmitted && (
                          <div className="mt-6 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="起床時間 (如 07:00)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.wakeTime} onChange={e => setScheduleForm({ ...scheduleForm, wakeTime: e.target.value })} />
                              <input type="text" placeholder="睡覺時間 (如 23:00)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.sleepTime} onChange={e => setScheduleForm({ ...scheduleForm, sleepTime: e.target.value })} />
                              <input type="text" placeholder="睡眠時長需求 (小時)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.sleepNeeded} onChange={e => setScheduleForm({ ...scheduleForm, sleepNeeded: e.target.value })} />
                              <input type="text" placeholder="平日通勤時間 (分)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.commuteTime} onChange={e => setScheduleForm({ ...scheduleForm, commuteTime: e.target.value })} />
                              <input type="text" placeholder="出門時間" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.departureTime} onChange={e => setScheduleForm({ ...scheduleForm, departureTime: e.target.value })} />
                              <input type="text" placeholder="到家時間" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={scheduleForm.returnTime} onChange={e => setScheduleForm({ ...scheduleForm, returnTime: e.target.value })} />
                            </div>
                            <textarea placeholder="你想額外完成的事 (選填)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner min-h-[60px]" value={scheduleForm.goals} onChange={e => setScheduleForm({ ...scheduleForm, goals: e.target.value })} />
                            <button onClick={() => handleFormSubmit('schedule')} className="w-full py-3 bg-blue-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-blue-100">分析日常行程 & 給予建議</button>
                          </div>
                        )}

                        {m.role === 'bot' && m.type === 'form_task' && !m.isSubmitted && (
                          <div className="mt-6 space-y-3">
                            <input type="text" placeholder="想拆解的任務名稱" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={taskForm.taskName} onChange={e => setTaskForm({ ...taskForm, taskName: e.target.value })} />
                            <input type="text" placeholder="呈現在行事曆的形式 (如: 讀書、實作)" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={taskForm.format} onChange={e => setTaskForm({ ...taskForm, format: e.target.value })} />
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="開始執行時間" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={taskForm.startTime} onChange={e => setTaskForm({ ...taskForm, startTime: e.target.value })} />
                              <input type="text" placeholder="結束執行時間" className="w-full p-3 bg-gray-50 rounded-xl text-xs border-none shadow-inner" value={taskForm.endTime} onChange={e => setTaskForm({ ...taskForm, endTime: e.target.value })} />
                            </div>
                            <button onClick={() => handleFormSubmit('task')} className="w-full py-3 bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-indigo-100">拆解任務並排入行程</button>
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold px-1 uppercase tracking-widest leading-none mt-1">
                        {m.role === 'user' ? '已發送' : 'Focus AI 助理'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start animate-pulse">
                  <div className="flex gap-4 max-w-[80%] items-start">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                      <Sparkles size={14} className="animate-spin duration-[3000ms]" />
                    </div>
                    <div className="bg-gray-50 px-5 py-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-300"></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ad Banner for Regular Users */}
              {!isPremium && (
                <div className="pt-10">
                  <div
                    onClick={() => navigateTo(AppRoute.SETTINGS)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-100/50 flex items-center justify-between cursor-pointer group hover:scale-[1.02] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <Zap size={24} fill="white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-widest mb-1">Focus AI Premium</h4>
                        <p className="text-[10px] opacity-80 font-bold">升級享有無限制 AI 任務拆解與極速連線</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Input Area */}
        <div className="pb-8 pt-4 px-4 bg-gradient-to-t from-white via-white to-transparent sticky bottom-0 z-50">
          <div className="max-w-3xl mx-auto w-full relative">
            <AnimatePresence>
              {showEnterHint && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute -top-12 right-0 bg-gray-900 border border-gray-800 text-white text-[10px] font-bold px-4 py-2 rounded-2xl shadow-2xl z-[60]"
                >
                  再按一次 Enter 發送訊息
                  <div className="absolute -bottom-1 right-6 w-2.5 h-2.5 bg-gray-900 rotate-45 border-r border-b border-gray-800"></div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group bg-white border-2 border-gray-100 focus-within:border-blue-200 rounded-[2rem] shadow-2xl shadow-gray-200/50 transition-all overflow-hidden flex items-end">
              <div className="flex-1 min-h-[64px] flex items-center">
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="詢問任何問題..."
                  className="w-full bg-transparent py-5 pl-8 pr-16 text-sm md:text-base font-medium text-gray-800 focus:outline-none transition-all resize-none max-h-[200px]"
                  style={{ height: 'auto' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
              </div>
              <div className="p-2.5">
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center transition-all ${input.trim() ? 'bg-blue-600 text-white shadow-lg active:scale-90 scale-100 translate-y-0' : 'bg-gray-100 text-gray-300 scale-95 translate-y-1'}`}
                >
                  <Send size={20} className={input.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 py-1 bg-gray-50 rounded-lg">Focus AI v3.0 Premium</p>
              <div className="h-1 w-1 bg-gray-200 rounded-full"></div>
              <p className="text-[10px] text-gray-400 font-medium">模型：Gemini 2.0 Flash</p>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearRecords}
        title="清空對話紀錄？"
        message="這將會永久刪除您與 FOCUS AI 的所有對話內容，此操作無法復原。"
        confirmText="確定清空"
        cancelText="取消"
      />
    </div>
  );
};

export default AIChatView;
