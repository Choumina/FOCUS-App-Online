
import React, { useState } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Mail, Check } from 'lucide-react';

interface ChangeEmailViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
}

const ChangeEmailView: React.FC<ChangeEmailViewProps> = ({ navigateTo, userProfile, setUserProfile }) => {
  const [email, setEmail] = useState(userProfile.email);

  const handleSave = () => {
    setUserProfile((prev: any) => ({ ...prev, email }));
    navigateTo(AppRoute.PROFILE_ACCOUNT);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo(AppRoute.PROFILE_ACCOUNT)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">更改電子郵件</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-500 text-white p-2 rounded-xl shadow-md hover:bg-blue-600 transition-colors"
        >
          <Check size={20} />
        </button>
      </div>

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
