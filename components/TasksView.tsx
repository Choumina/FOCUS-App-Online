
import React, { useState, useRef, useEffect } from 'react';
import { AppRoute, Task } from '../types';
import { ChevronLeft, Plus, CheckCircle2, Circle, Send, Trash2 } from 'lucide-react';

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

  const isAdding = isAddingProp !== undefined ? isAddingProp : localIsAdding;
  const setIsAdding = setIsAddingProp !== undefined ? setIsAddingProp : setLocalIsAdding;
  const newTitle = newTitleProp !== undefined ? newTitleProp : localNewTitle;
  const setNewTitle = setNewTitleProp !== undefined ? setNewTitleProp : setLocalNewTitle;

  const inputRef = useRef<HTMLInputElement>(null);

  // 當開啟新增模式時，自動聚焦輸入框
  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddTask = () => {
    if (newTitle.trim()) {
      const newTask: Task = {
        id: Date.now().toString(),
        title: newTitle.trim(),
        dueDate: new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        completed: false
      };
      setTasks(prev => {
        const newTasks = [...prev, newTask];
        return newTasks.sort((a, b) => {
          if (a.completed === b.completed) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return a.completed ? 1 : -1;
        });
      });
      setNewTitle('');
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => navigateTo(AppRoute.HOME)} className="bg-gray-100 p-3 rounded-2xl hover:bg-gray-200 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="bg-gray-100 rounded-full flex p-1 flex-1 mx-4">
          <button className="flex-1 py-2 text-sm font-bold bg-white shadow-sm rounded-full">
            Reminders
          </button>
          <button 
            onClick={() => navigateTo(AppRoute.FOCUS_TIMER)}
            className="flex-1 py-2 text-sm font-bold text-gray-400"
          >
            番茄鐘
          </button>
        </div>
      </div>

      <h1 className="text-4xl font-extrabold text-blue-500 mb-8">Reminders</h1>

      <div className="flex-1 space-y-6 overflow-y-auto pb-48">
        {tasks.map(task => (
          <div key={task.id} className="flex items-start gap-4 group">
            <div className="mt-1 cursor-pointer" onClick={() => {
              if (!task.completed) {
                setConfirmTask(task);
              } else {
                toggleTask(task.id);
              }
            }}>
              {task.completed ? (
                <CheckCircle2 size={24} className="text-blue-500" />
              ) : (
                <Circle size={24} className="text-gray-300 group-hover:text-blue-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={task.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setTasks(prev => prev.map(t => t.id === task.id ? { ...t, title: newTitle } : t));
                }}
                onBlur={(e) => {
                  if (!e.target.value.trim()) {
                    setTasks(prev => prev.filter(t => t.id !== task.id));
                  }
                }}
                className={`w-full text-lg font-bold bg-transparent focus:outline-none focus:border-b-2 focus:border-blue-200 ${task.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}
              />
              <input
                type="date"
                value={task.dueDate.replace(/\//g, '-')}
                onChange={(e) => {
                  const newDate = e.target.value.replace(/-/g, '/');
                  setTasks(prev => {
                    const updatedTasks = prev.map(t => t.id === task.id ? { ...t, dueDate: newDate } : t);
                    return updatedTasks.sort((a, b) => {
                      if (a.completed === b.completed) {
                        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                      }
                      return a.completed ? 1 : -1;
                    });
                  });
                }}
                className="text-xs text-gray-400 font-medium bg-transparent focus:outline-none focus:text-blue-500 cursor-pointer mt-1"
              />
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

      {/* 確認完成彈窗 */}
      {confirmTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-xs shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-blue-500" />
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

export default TasksView;
