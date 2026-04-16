import React, { useState } from 'react';
import { AppRoute, AppSettings } from '../types';
import ViewHeader from './ViewHeader';
import { RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

interface SettingsViewProps {
  navigateTo: (route: AppRoute) => void;
  onResetTour?: () => void;
  appSettings: AppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ navigateTo, onResetTour, appSettings, setAppSettings, isPremium, setIsPremium }) => {
  const [tab, setTab] = useState<'notif' | 'block'>('notif');
  const [tourReset, setTourReset] = useState(false);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings((prev: AppSettings) => ({ ...prev, [key]: value }));
  };

  const handleTimerEndNotifyToggle = () => {
    const newVal = !appSettings.timerEndNotify;
    updateSetting('timerEndNotify', newVal);
    if (newVal && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission().then(perm => {
        if (perm !== 'granted') {
          alert('請允許通知權限，才能接收專注提醒。');
        }
      });
    }
  };

  const handleFocusReminderToggle = () => {
    const newVal = !appSettings.focusReminder;
    updateSetting('focusReminder', newVal);
    if (newVal && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  };

  const Toggle = ({label, value, onToggle}: {label: string, value: boolean, onToggle: () => void}) => (
    <div 
      onClick={onToggle}
      className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 mb-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
    >
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-green-400' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} />
      </div>
    </div>
  );

  const NumberSelector = ({label, value, onChange, unit}: {label: string, value: number, onChange: (val: number) => void, unit: string}) => (
    <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm mb-4">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className="flex items-center gap-4">
        <button 
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all font-black"
        >
          -
        </button>
        <span className="text-indigo-600 font-black text-sm w-12 text-center">{value} {unit}</span>
        <button 
          onClick={() => onChange(Math.min(60, value + 1))}
          className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all font-black"
        >
          +
        </button>
      </div>
    </div>
  );

  const handleResetTour = () => {
    if (onResetTour) {
      onResetTour();
      setTourReset(true);
      setTimeout(() => setTourReset(false), 2000);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      <ViewHeader title="設定" onBack={() => navigateTo(AppRoute.HOME)} />
      <div className="p-6">
        <div className="bg-gray-200/50 rounded-full flex p-1 mb-8">
          <button 
            onClick={() => setTab('notif')}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all ${tab === 'notif' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400'}`}
          >
            專注時通知
          </button>
          <button 
            onClick={() => setTab('block')}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all ${tab === 'block' ? 'bg-white shadow-md text-gray-900' : 'text-gray-400'}`}
          >
            App 封鎖
          </button>
        </div>

        {tab === 'notif' ? (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">計時器與提醒</h3>
            <Toggle 
              label="專注完成通知" 
              value={appSettings.timerEndNotify} 
              onToggle={handleTimerEndNotifyToggle} 
            />
            <NumberSelector 
              label="專注結束前提醒 (分鐘)" 
              value={appSettings.timerWarnTime} 
              onChange={(val) => updateSetting('timerWarnTime', val)} 
              unit="m" 
            />
            <Toggle 
              label="定期專注提醒" 
              value={appSettings.focusReminder} 
              onToggle={handleFocusReminderToggle} 
            />
            {appSettings.focusReminder && (
              <NumberSelector 
                label="提醒間隔" 
                value={appSettings.focusReminderInterval} 
                onChange={(val) => updateSetting('focusReminderInterval', val)} 
                unit="m" 
              />
            )}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 mb-6">
                <p className="text-xs text-indigo-600 font-bold leading-relaxed">
                   開啟「App 封鎖」功能後，當你在專注模式時，FOCUS AI 會協助你過濾社群媒體的通知。
                </p>
             </div>
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">封鎖設定</h3>
             <Toggle 
               label="專注時封鎖社交 App" 
               value={appSettings.appBlockerFocus} 
               onToggle={() => updateSetting('appBlockerFocus', !appSettings.appBlockerFocus)} 
             />
             <Toggle 
               label="休息時解除封鎖" 
               value={appSettings.appBlockerBreak} 
               onToggle={() => updateSetting('appBlockerBreak', !appSettings.appBlockerBreak)} 
             />
          </div>
        )}

        <div className="mt-8">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 ml-2">實驗性功能</h3>
           <div 
             onClick={handleResetTour}
             className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 mb-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all"
           >
             <div className="flex items-center gap-3">
                <RotateCcw size={18} className={`text-indigo-500 ${tourReset ? 'animate-spin' : ''}`} />
                <span className="text-sm font-bold text-gray-700">重設功能導覽</span>
             </div>
             {tourReset ? <span className="text-[10px] font-bold text-green-500">Done!</span> : <ChevronRight size={18} className="text-gray-300" />}
           </div>

           <div 
             onClick={() => setIsPremium(!isPremium)}
             className={`flex justify-between items-center p-4 rounded-3xl border mb-4 shadow-sm cursor-pointer active:scale-[0.98] transition-all ${isPremium ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100'}`}
           >
             <div className="flex items-center gap-3">
                <span className="text-lg">💎</span>
                <span className={`text-sm font-bold ${isPremium ? 'text-indigo-600' : 'text-gray-700'}`}>進階版功能 (Premium)</span>
             </div>
             <div className={`w-12 h-6 rounded-full transition-colors relative ${isPremium ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPremium ? 'left-7' : 'left-1'}`} />
             </div>
           </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 font-bold mt-12 uppercase tracking-widest">
           Focus AI v3.0.4 • (c) 2026
        </p>
      </div>
    </div>
  );
};

export default SettingsView;
