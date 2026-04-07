
import React from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, User, Mail, Phone, Calendar } from 'lucide-react';

interface AccountSettingsViewProps {
  navigateTo: (route: AppRoute) => void;
  onDeleteAccount: () => void;
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
    email: string;
    registrationDate: string;
  };
}

const AccountSettingsView: React.FC<AccountSettingsViewProps> = ({ navigateTo, onDeleteAccount, userProfile }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigateTo(AppRoute.PROFILE)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">帳號設定</h1>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">使用者名稱</p>
                <p className="font-bold text-gray-700">{userProfile.name}</p>
              </div>
            </div>
            <button 
              onClick={() => navigateTo(AppRoute.PROFILE_EDIT)}
              className="text-blue-500 text-sm font-bold"
            >
              編輯
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">電子郵件</p>
                <p className="font-bold text-gray-700">{userProfile.email}</p>
              </div>
            </div>
            <button 
              onClick={() => navigateTo(AppRoute.CHANGE_EMAIL)}
              className="text-blue-500 text-sm font-bold"
            >
              更改
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">註冊日期</p>
                <p className="font-bold text-gray-700">{userProfile.registrationDate}</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onDeleteAccount}
          className="w-full bg-white text-red-500 font-bold py-4 rounded-3xl shadow-sm hover:bg-red-50 transition-colors"
        >
          刪除帳號
        </button>
      </div>
    </div>
  );
};

export default AccountSettingsView;
