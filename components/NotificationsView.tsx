
import React, { useState } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Bell, MessageSquare, Timer, Trophy } from 'lucide-react';

interface NotificationsViewProps {
  navigateTo: (route: AppRoute) => void;
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ navigateTo }) => {
  const [settings, setSettings] = useState({
    push: true,
    message: true,
    focus: true,
    achievements: false
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigateTo(AppRoute.PROFILE)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">通知提醒</h1>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <Bell size={20} />
              </div>
              <span className="font-bold text-gray-700">推送通知</span>
            </div>
            <div 
              onClick={() => toggle('push')}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${settings.push ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${settings.push ? 'right-1' : 'left-1'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <MessageSquare size={20} />
              </div>
              <span className="font-bold text-gray-700">訊息通知</span>
            </div>
            <div 
              onClick={() => toggle('message')}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${settings.message ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${settings.message ? 'right-1' : 'left-1'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                <Timer size={20} />
              </div>
              <span className="font-bold text-gray-700">專注時段提醒</span>
            </div>
            <div 
              onClick={() => toggle('focus')}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${settings.focus ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${settings.focus ? 'right-1' : 'left-1'}`} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Trophy size={20} />
              </div>
              <span className="font-bold text-gray-700">成就與排名</span>
            </div>
            <div 
              onClick={() => toggle('achievements')}
              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-200 ${settings.achievements ? 'bg-blue-500' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200 ${settings.achievements ? 'right-1' : 'left-1'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationsView;
