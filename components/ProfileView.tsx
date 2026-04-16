import React from 'react';
import { AppRoute, UserProfile } from '../types';
import ViewHeader from './ViewHeader';
import { Mail, Bell, LogOut, Archive, ChevronLeft, Pencil } from 'lucide-react';

interface ProfileViewProps {
  navigateTo: (route: AppRoute) => void;
  onLogout: () => void;
  userProfile: UserProfile;
}

const ProfileView: React.FC<ProfileViewProps> = ({ navigateTo, onLogout, userProfile }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ViewHeader title="個人檔案" onBack={() => navigateTo(AppRoute.HOME)} />

      {/* Profile Info */}
      <div className="p-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md overflow-hidden">
            <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{userProfile.name}</h2>
          <p className="text-gray-400 font-medium text-center px-4 mt-1">{userProfile.bio}</p>
          
          <div className="mt-6 flex gap-3 flex-wrap justify-center">
            <div className="bg-blue-50 px-4 py-2 rounded-2xl">
              <span className="text-blue-600 font-bold text-sm">Lv. {userProfile.level}</span>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-2xl">
              <span className="text-orange-600 font-bold text-sm">Rank #1</span>
            </div>
            {userProfile.identity && (
              <div className={`px-4 py-2 rounded-2xl ${
                userProfile.identity === 'high_school' ? 'bg-blue-100' :
                userProfile.identity === 'university' ? 'bg-purple-100' : 'bg-green-100'
              }`}>
                <span className={`font-bold text-sm ${
                  userProfile.identity === 'high_school' ? 'text-blue-700' :
                  userProfile.identity === 'university' ? 'text-purple-700' : 'text-green-700'
                }`}>
                  {userProfile.identity === 'high_school' ? '🏫 高中職' :
                   userProfile.identity === 'university' ? '🎓 大學生' : '✨ 其他'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => navigateTo(AppRoute.PROFILE_EDIT)}
            className="mt-4 flex items-center gap-1.5 text-sm text-blue-500 font-bold px-4 py-2 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Pencil size={14} />編輯個人檔案
          </button>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <div 
            id="profile-account"
            onClick={() => navigateTo(AppRoute.PROFILE_ACCOUNT)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                <Mail size={20} />
              </div>
              <span className="font-bold text-gray-700">帳號設定</span>
            </div>
            <ChevronLeft className="rotate-180 text-gray-300" size={20} />
          </div>

          <div 
            id="profile-notifications"
            onClick={() => navigateTo(AppRoute.PROFILE_NOTIFICATIONS)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                <Bell size={20} />
              </div>
              <span className="font-bold text-gray-700">通知提醒</span>
            </div>
            <ChevronLeft className="rotate-180 text-gray-300" size={20} />
          </div>

          <div 
            id="profile-settings"
            onClick={() => navigateTo(AppRoute.SETTINGS)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors mt-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                {/* 齒輪圖示 (lucide icon) */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </div>
              <span className="font-bold text-gray-700">系統與導覽設定</span>
            </div>
            <ChevronLeft className="rotate-180 text-gray-300" size={20} />
          </div>

          <div 
            id="profile-archive"
            onClick={() => navigateTo(AppRoute.PROFILE_ARCHIVE)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors mt-3"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <Archive size={20} />
              </div>
              <span className="font-bold text-gray-700">封存</span>
            </div>
            <ChevronLeft className="rotate-180 text-gray-300" size={20} />
          </div>

          <div 
            id="profile-logout" 
            onClick={onLogout}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors mt-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500">
                <LogOut size={20} />
              </div>
              <span className="font-bold text-red-500">登出</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
