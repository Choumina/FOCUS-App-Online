import React, { useState } from 'react';
import { AppRoute } from '../types';
import ViewHeader from './ViewHeader';
import { RotateCcw, ChevronRight, ChevronLeft } from 'lucide-react';

interface SettingsViewProps {
  navigateTo: (route: AppRoute) => void;
  onResetTour?: () => void;
  appSettings: {
    timerEndNotify: boolean;
    timerWarnTime: number;
    focusReminder: boolean;
    focusReminderInterval: number;
    appBlockerFocus: boolean;
    appBlockerBreak: boolean;
  };
  setAppSettings: React.Dispatch<React.SetStateAction<any>>;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ navigateTo, onResetTour, appSettings, setAppSettings, isPremium, setIsPremium }) => {
  const [tab, setTab] = useState<'notif' | 'block'>('notif');
  const [tourReset, setTourReset] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setAppSettings((prev: any) => ({ ...prev, [key]: value }));
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
            App 封鎖程式
          </button>
        </div>

        <div className="space-y-8">
          {tab === 'notif' ? (
            <>
              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">計時器設定</h3>
                <Toggle 
                  label="計時器結束時通知我" 
                  value={appSettings.timerEndNotify} 
                  onToggle={handleTimerEndNotifyToggle} 
                />
                <NumberSelector 
                  label="即將結束時長" 
                  unit="分" 
                  value={appSettings.timerWarnTime} 
                  onChange={(val) => updateSetting('timerWarnTime', val)} 
                />
                <p className="text-[10px] text-gray-400 mt-2 px-2 leading-relaxed">可用來協助你準備開始休息或開始下一個番茄鐘。</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">專注提醒</h3>
                <Toggle 
                  label="啟用番茄鐘專注提醒" 
                  value={appSettings.focusReminder} 
                  onToggle={handleFocusReminderToggle} 
                />
                <NumberSelector 
                  label="提醒頻率" 
                  unit="分" 
                  value={appSettings.focusReminderInterval} 
                  onChange={(val) => updateSetting('focusReminderInterval', val)} 
                />
                <p className="text-[10px] text-gray-400 mt-2 px-2 leading-relaxed">專注提醒會在每隔設定時間後發出系統通知，提醒你保持專注。</p>

                {/* Permission Status Badge */}
                {'Notification' in window && (
                  <div className={`mt-3 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                    Notification.permission === 'granted' ? 'bg-green-50 text-green-600' :
                    Notification.permission === 'denied' ? 'bg-red-50 text-red-500' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    <span>{Notification.permission === 'granted' ? '✅' : Notification.permission === 'denied' ? '🚫' : '⚠️'}</span>
                    <span>{
                      Notification.permission === 'granted' ? '通知權限已授予' :
                      Notification.permission === 'denied' ? '通知已被封鎖，請至瀏覽器設定手動開啟' :
                      '尚未授予通知權限'
                    }</span>
                  </div>
                )}
              </div>

              {/* 導覽重置 */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">幫助與導覽</h3>
                <button
                  onClick={handleResetTour}
                  disabled={tourReset}
                  className="w-full flex items-center justify-between bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-60 mb-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <RotateCcw size={17} className="text-indigo-500" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-700">
                        {tourReset ? '已重置，返回首頁即可觀看 ✓' : '重新觀看功能導覽'}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">以氣泡方式逐一介紹各功能</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </button>
              </div>

              {/* 方案管理 */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">方案管理</h3>
                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                   <div className="flex items-start justify-between mb-6">
                      <div>
                         <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">目前方案</p>
                         <h4 className={`text-xl font-black ${isPremium ? 'text-indigo-600' : 'text-gray-800'}`}>
                           {isPremium ? 'Premium 尊享版' : 'Regular 普通版'}
                         </h4>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${isPremium ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                         {isPremium ? 'ACTIVE' : 'FREE'}
                      </div>
                   </div>
                   
                   <p className="text-xs text-gray-400 font-medium leading-relaxed mb-6">
                      {isPremium 
                        ? '您目前享有無限次數據分析、無廣告 AI 助理與極速連線體驗。' 
                        : '普通版使用者僅能查看一次數據分析報告，且包含 AI 廣告。'}
                   </p>

                   <button
                     onClick={() => setIsPremium(!isPremium)}
                     className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
                       isPremium 
                       ? 'bg-gray-100 text-gray-600' 
                       : 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-100'
                     }`}
                   >
                     {isPremium ? '切換回普通版' : '立即升級為 Premium'}
                   </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-6">
               <div>
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider font-black">專注時段 (Focus)</h3>
                  <Toggle 
                    label="開啟嚴格 App 封鎖" 
                    value={appSettings.appBlockerFocus} 
                    onToggle={() => updateSetting('appBlockerFocus', !appSettings.appBlockerFocus)} 
                  />
                  <p className="text-[10px] text-gray-400 mt-2 px-2 leading-relaxed">開啟後，在專注期間將無法切換至其他娛樂頁面，直到計時結束。</p>
               </div>
               <div>
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider font-black">休息時段 (Break)</h3>
                  <Toggle 
                    label="休息時限制娛樂 App" 
                    value={appSettings.appBlockerBreak} 
                    onToggle={() => updateSetting('appBlockerBreak', !appSettings.appBlockerBreak)} 
                  />
                  <p className="text-[10px] text-gray-400 mt-2 px-2 leading-relaxed">若您希望在休息時也能保持數位排毒，可以開啟此功能。</p>
               </div>
               <button className="w-full py-5 bg-white text-gray-400 rounded-3xl font-black text-xs shadow-sm border border-gray-100 uppercase tracking-widest active:scale-95 transition-all">
                 刷新封鎖引擎狀態
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
