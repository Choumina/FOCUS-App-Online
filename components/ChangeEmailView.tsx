import React, { useState } from 'react';
import { AppRoute, UserProfile } from '../types';
import ViewHeader from './ViewHeader';
import { Mail, Check } from 'lucide-react';

interface ChangeEmailViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ChangeEmailView: React.FC<ChangeEmailViewProps> = ({ navigateTo, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState(userProfile.email);

  const handleSave = () => {
    setUserProfile((prev: UserProfile) => ({ ...prev, email }));
    navigateTo(AppRoute.PROFILE_ACCOUNT);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ViewHeader 
        title="更改電子郵件" 
        onBack={() => navigateTo(AppRoute.PROFILE_ACCOUNT)}
        rightElement={
          <button 
            onClick={handleSave}
            className="bg-blue-500 text-white p-2.5 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-600 active:scale-90 transition-all"
          >
            <Check size={20} strokeWidth={3} />
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase ml-1">電子郵件地址</label>
            <div className="relative mt-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                placeholder="example@mail.com"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 px-1">
            更改後，系統將會發送驗證信至您的新信箱。請確保輸入正確的地址。
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangeEmailView;
