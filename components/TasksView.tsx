import React, { useState, useRef, useEffect } from 'react';
import { AppRoute, Task } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { CheckCircle2, Circle, Trash2, Sparkles, Loader2, X } from 'lucide-react';
import { generateTaskBreakdown } from '../geminiService';
import ViewHeader from './ViewHeader';
import { motion, AnimatePresence } from 'motion/react';

interface TasksViewProps {
  navigateTo: (route: AppRoute) => void;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  toggleTask: (id: string) => void;
  archiveTask: (id: string) => void;
  isAdding?: boolean;
  setIsAdding?: (val: boolean) => void;
  newTitle?: string;
  setNewTitle?: (val: string) => void;
}

const TasksView: React.FC<TasksViewProps> = ({ 
  navigateTo, tasks, setTasks, toggleTask, archiveTask,
  isAdding: isAddingProp, setIsAdding: setIsAddingProp, 
  newTitle: newTitleProp, setNewTitle: setNewTitleProp
}) => {
  const [localIsAdding, setLocalIsAdding] = useState(false);
  const [localNewTitle, setLocalNewTitle] = useState('');
  const [confirmTask, setConfirmTask] = useState<Task | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);
  const [breakdownResults, setBreakdownResults] = useState<{taskId: string, subtasks: any[]}>({ taskId: '', subtasks: [] });
  
  const isAdding = isAddingProp !== undefined ? isAddingProp : localIsAdding;
  const setIsAdding = setIsAddingProp !== undefined ? setIsAddingProp : setLocalIsAdding;
  const newTitle = newTitleProp !== undefined ? newTitleProp : localNewTitle;
  const setNewTitle = setNewTitleProp !== undefined ? setNewTitleProp : setLocalNewTitle;
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const addTask = () => {
    if (newTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        dueDate: new Date().toISOString().split('T')[0],
        completed: false
      };
      setTasks([...tasks, newTask]);
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTask();
    if (e.key === 'Escape') setIsAdding(false);
  };

  const handleToggle = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      setConfirmTask(task);
    } else {
      toggleTask(id);
    }
  };

  const handleAINestedBreakdown = async (task: Task) => {
    if (isBreakingDown === task.id) {
      setIsBreakingDown(null);
      return;
    }
    
    setIsBreakingDown(task.id);
    const results = await generateTaskBreakdown(task.title);
    if (results) {
      setBreakdownResults({ taskId: task.id, subtasks: results });
    } else {
      setBreakdownResults({ taskId: task.id, subtasks: [] });
    }
  };

  const addSubtaskAsMain = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: title,
      dueDate: new Date().toISOString().split('T')[0],
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ViewHeader 
        title="Reminders" 
        onBack={() => navigateTo(AppRoute.HOME)}
      />

      <div className="p-6 space-y-6">
        {tasks.length === 0 && !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">目前沒有待辦事項</p>
          </div>
        )}

        {/* 任務清單 */}
        {tasks.map(task => (
          <div key={task.id} className="group relative flex items-start gap-4 bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <button 
              onClick={() => handleToggle(task.id)}
              className={`mt-1 transition-colors ${task.completed ? 'text-blue-500' : 'text-gray-300 hover:text-blue-400'}`}
            >
              {task.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
            </button>
            <div className="flex-1">
              <h3 className={`font-bold transition-all ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {task.title}
              </h3>
              
              <div className="flex items-center gap-3 mt-1.5">
                {!task.completed && (
                  <button 
                    onClick={() => handleAINestedBreakdown(task)}
                    className="flex items-center gap-1.5 text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full hover:bg-indigo-100 transition-colors"
                  >
                    {isBreakingDown === task.id ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                    AI 拆解
                  </button>
                )}
                <span className="text-[10px] text-gray-400 font-medium">截止日期: {task.dueDate}</span>
              </div>

              {/* AI 拆解結果面板 */}
              <AnimatePresence>
                {isBreakingDown === task.id && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-4 space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-indigo-50"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-400 px-1">
                       <div className="flex items-center gap-1">
                        <Sparkles size={10} /> AI 建議的步驟
                       </div>
                       <button onClick={() => setIsBreakingDown(null)}><X size={14} /></button>
                    </div>
                    {breakdownResults.taskId === task.id && breakdownResults.subtasks?.length > 0 ? (
                      breakdownResults.subtasks.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 group/sub">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">{sub.title}</span>
                            {sub.description && <span className="text-[10px] text-gray-400">{sub.description}</span>}
                          </div>
                          <button 
                            onClick={() => addSubtaskAsMain(sub.title)}
                            className="opacity-0 group-hover/sub:opacity-100 p-1.5 bg-white text-indigo-500 rounded-xl shadow-sm text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                          >
                            加入清單
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-[10px] text-gray-400 italic py-2 flex items-center gap-2">
                        {isBreakingDown === task.id && !breakdownResults.subtasks.length ? (
                          <><Loader2 size={10} className="animate-spin" /> 分析中...</>
                        ) : "無建議步驟"}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}
              className="mt-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
            >
              <Trash2 size={20} />
            </button>
          </div>
        ))}

        {/* 動態新增任務列 */}
        {isAdding && (
          <div className="flex items-start gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
            <div className="mt-1">
              <Circle size={24} className="text-blue-300 animate-pulse" />
            </div>
            <div className="flex-1 border-b-2 border-blue-100 pb-2">
              <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={onKeyDown}
                onBlur={() => !newTitle && setIsAdding(false)}
                placeholder="輸入新任務..."
                className="w-full text-lg font-bold text-gray-800 focus:outline-none bg-transparent"
              />
              <p className="text-xs text-blue-400 font-medium mt-1 italic">按 Enter 儲存任務</p>
            </div>
          </div>
        )}
      </div>

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

export default TasksView;
