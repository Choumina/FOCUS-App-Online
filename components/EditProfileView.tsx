
import React, { useState, useRef } from 'react';
import { AppRoute } from '../types';
import { ChevronLeft, Camera, Check } from 'lucide-react';

interface EditProfileViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
  };
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
}

const EditProfileView: React.FC<EditProfileViewProps> = ({ navigateTo, userProfile, setUserProfile }) => {
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setUserProfile((prev: any) => ({ ...prev, name, bio, avatar }));
    navigateTo(AppRoute.PROFILE_ACCOUNT);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRandomAvatar = () => {
    const randomId = Math.floor(Math.random() * 1000);
    setAvatar(`https://picsum.photos/seed/${randomId}/200`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigateTo(AppRoute.PROFILE_ACCOUNT)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">編輯個人檔案</h1>
        </div>
        <button 
          onClick={handleSave}
          className="bg-blue-500 text-white p-2 rounded-xl shadow-md hover:bg-blue-600 transition-colors"
        >
          <Check size={20} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <button 
              onClick={handleImageClick}
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-blue-600 transition-colors"
            >
              <Camera size={16} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          <div className="flex gap-4 mt-4">
            <p className="text-sm text-blue-500 font-bold cursor-pointer" onClick={handleImageClick}>更換大頭貼</p>
            <p className="text-sm text-gray-400 font-bold cursor-pointer" onClick={handleRandomAvatar}>隨機生成</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase ml-1">姓名</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase ml-1">個人簡介</label>
            <textarea 
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full mt-1 bg-gray-50 border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileView;
