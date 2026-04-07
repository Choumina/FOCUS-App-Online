
import React from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, User, Mail, Shield, Bell, LogOut, Archive } from 'lucide-react';

interface ProfileViewProps {
  navigateTo: (route: AppRoute) => void;
  onLogout: () => void;
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
    level: number;
  };
}

const ProfileView: React.FC<ProfileViewProps> = ({ navigateTo, onLogout, userProfile }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white p-6 flex items-center gap-4 shadow-sm">
        <button 
          onClick={() => navigateTo(AppRoute.HOME)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">個人檔案</h1>
      </div>

      {/* Profile Info */}
      <div className="p-6">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md overflow-hidden">
            <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">{userProfile.name}</h2>
          <p className="text-gray-400 font-medium text-center px-4 mt-1">{userProfile.bio}</p>
          
          <div className="mt-6 flex gap-3">
            <div className="bg-blue-50 px-4 py-2 rounded-2xl">
              <span className="text-blue-600 font-bold text-sm">Lv. {userProfile.level}</span>
            </div>
            <div className="bg-orange-50 px-4 py-2 rounded-2xl">
              <span className="text-orange-600 font-bold text-sm">Rank #1</span>
            </div>
          </div>
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
            id="profile-archive"
            onClick={() => navigateTo(AppRoute.PROFILE_ARCHIVE)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
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
