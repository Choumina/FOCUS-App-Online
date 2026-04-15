import React, { useState } from 'react';
import { AppRoute } from '../types';
import ViewHeader from './ViewHeader';

const SettingsView: React.FC<{navigateTo: (route: AppRoute) => void}> = ({ navigateTo }) => {
  const [tab, setTab] = useState<'notif' | 'block'>('notif');
  
  const Toggle = ({label, value}: {label: string, value: boolean}) => (
    <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 mb-4 shadow-sm">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <div className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-green-400' : 'bg-gray-300'}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <ViewHeader title="設定" onBack={() => navigateTo(AppRoute.HOME)} />
      <div className="p-6">
        <div className="bg-gray-200/50 rounded-full flex p-1 mb-8">
          <button 
            onClick={() => setTab('notif')}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all ${tab === 'notif' ? 'bg-white shadow-md' : 'text-gray-400'}`}
          >
            專注時通知
          </button>
          <button 
            onClick={() => setTab('block')}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all ${tab === 'block' ? 'bg-white shadow-md' : 'text-gray-400'}`}
          >
            App 封鎖程式
          </button>
        </div>

        <div className="space-y-8">
          {tab === 'notif' ? (
            <>
              <div>
                <Toggle label="計時器結束時通知我" value={true} />
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <span className="text-sm font-bold text-gray-700">即將結束時長(分鐘)</span>
                  <span className="text-gray-400 text-sm">2 &gt;</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 px-2">可用來協助你準備開始休息或開始番茄鐘。</p>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">專注提醒</h3>
                <Toggle label="啟用番茄鐘專注提醒" value={true} />
                <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <span className="text-sm font-bold text-gray-700">Duration (min)</span>
                  <span className="text-gray-400 text-sm">10 &gt;</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 px-2">專注提醒會發出通知音來提醒你保持專注，可在你容易分心時幫助你回神專注。</p>
              </div>
            </>
          ) : (
            <div className="space-y-6">
               <div>
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">專注</h3>
                  <Toggle label="開啟App 封鎖程式" value={true} />
               </div>
               <div>
                  <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-wider">休息</h3>
                  <Toggle label="開啟App 封鎖程式" value={true} />
               </div>
               <button className="w-full py-4 bg-white text-red-500 rounded-3xl font-bold text-sm shadow-sm border border-red-50 border-gray-100">
                 REFRESH APP BLOCKER
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
