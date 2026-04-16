import React, { useState, useRef } from 'react';
import { AppRoute, CalendarEvent, UserIdentity } from '../types';
import ViewHeader from './ViewHeader';
import { Camera, Check, GraduationCap, School, User } from 'lucide-react';

interface EditProfileViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: {
    name: string;
    bio: string;
    avatar: string;
    identity?: UserIdentity;
  };
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  setCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

// 根據身份產生預設行事曆事件
const generatePresetEvents = (identity: UserIdentity): CalendarEvent[] => {
  const today = new Date();

  const makeEvent = (dayOffset: number, hour: number, title: string, color: string, heightHours = 1): CalendarEvent => {
    const d = new Date(today);
    d.setDate(today.getDate() + dayOffset);
    const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    return {
      id: `preset-${identity}-${dayOffset}-${hour}`,
      date: dateStr,
      top: hour * 40,
      height: heightHours * 40,
      title,
      color,
      isDraft: false,
      isPreset: true,
    };
  };

  if (identity === 'high_school') {
    return [
      makeEvent(0, 8, '🏫 早自習', 'bg-blue-200', 1),
      makeEvent(0, 9, '📖 國文課', 'bg-blue-200', 1),
      makeEvent(0, 10, '📐 數學課', 'bg-purple-200', 1),
      makeEvent(0, 13, '🔬 自然科', 'bg-green-200', 2),
      makeEvent(0, 17, '📝 回家作業時間', 'bg-yellow-200', 2),
      makeEvent(1, 8, '🏫 早自習', 'bg-blue-200', 1),
      makeEvent(1, 9, '🌍 英文課', 'bg-orange-200', 1),
      makeEvent(1, 12, '🍱 午休', 'bg-gray-100', 1),
      makeEvent(1, 16, '🏃 課後運動', 'bg-green-200', 1),
      makeEvent(2, 9, '📊 社會科', 'bg-yellow-200', 1),
      makeEvent(2, 14, '🎨 藝術課', 'bg-pink-200', 1),
      makeEvent(2, 16, '📚 自習時間', 'bg-blue-100', 1.5),
      makeEvent(5, 10, '📝 模擬考複習', 'bg-red-200', 3),
      makeEvent(6, 10, '🎯 週計畫整理', 'bg-purple-200', 1),
    ];
  } else if (identity === 'university') {
    return [
      makeEvent(0, 9, '📖 必修課 - 微積分', 'bg-blue-200', 1.5),
      makeEvent(0, 13, '💻 程式設計實習', 'bg-purple-200', 2),
      makeEvent(0, 18, '📚 社團/讀書會', 'bg-green-200', 1.5),
      makeEvent(1, 10, '🎓 專業選修課', 'bg-orange-200', 2),
      makeEvent(1, 14, '🔬 實驗課', 'bg-green-200', 3),
      makeEvent(2, 9, '📝 英文課', 'bg-yellow-200', 1.5),
      makeEvent(2, 14, '💡 自主學習', 'bg-blue-100', 2),
      makeEvent(2, 19, '🎮 休閒時間', 'bg-gray-100', 1),
      makeEvent(3, 10, '👨‍💻 專題討論', 'bg-pink-200', 2),
      makeEvent(4, 9, '📖 期末複習', 'bg-red-200', 2),
      makeEvent(4, 14, '🤝 求職準備/履歷', 'bg-purple-200', 1.5),
      makeEvent(5, 11, '☕ 自由學習/看書', 'bg-blue-100', 2),
      makeEvent(6, 14, '🗓️ 下週規劃', 'bg-yellow-200', 1),
    ];
  } else {
    // other
    return [
      makeEvent(0, 9, '☀️ 晨間規劃', 'bg-yellow-200', 0.5),
      makeEvent(0, 10, '📋 工作/學習任務', 'bg-blue-200', 3),
      makeEvent(0, 14, '🍵 午休', 'bg-gray-100', 1),
      makeEvent(0, 17, '🏃 運動時間', 'bg-green-200', 1),
      makeEvent(1, 9, '📚 自我進修', 'bg-purple-200', 2),
      makeEvent(1, 14, '💼 個人專案', 'bg-blue-200', 2),
      makeEvent(2, 10, '📝 覆盤與反思', 'bg-orange-200', 1),
      makeEvent(4, 10, '🎯 週目標設定', 'bg-red-200', 1),
      makeEvent(6, 10, '📖 閱讀時間', 'bg-green-200', 1.5),
      makeEvent(6, 15, '🗓️ 下週規劃', 'bg-yellow-200', 1),
    ];
  }
};

const identityOptions: { value: UserIdentity; label: string; emoji: string; desc: string; icon: React.ReactNode; color: string; bg: string }[] = [
  {
    value: 'high_school',
    label: '高中職生',
    emoji: '🏫',
    desc: '課表、作業、模擬考',
    icon: <School size={20} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
  },
  {
    value: 'university',
    label: '大學生',
    emoji: '🎓',
    desc: '選修、實習、社團',
    icon: <GraduationCap size={20} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    value: 'other',
    label: '其他',
    emoji: '✨',
    desc: '工作、自學、個人規劃',
    icon: <User size={20} />,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
  },
];

const EditProfileView: React.FC<EditProfileViewProps> = ({ navigateTo, userProfile, setUserProfile, setCalendarEvents }) => {
  const [name, setName] = useState(userProfile.name);
  const [bio, setBio] = useState(userProfile.bio);
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [identity, setIdentity] = useState<UserIdentity>(userProfile.identity ?? 'other');
  const [identityChanged, setIdentityChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    setUserProfile((prev: any) => ({ ...prev, name, bio, avatar, identity }));

    // 如果身份有改變，更新預設行事曆事件
    if (identityChanged && setCalendarEvents) {
      const presets = generatePresetEvents(identity);
      setCalendarEvents(prev => {
        // 移除舊的預設事件，保留使用者自建事件
        const userEvents = prev.filter(e => !e.isPreset);
        return [...userEvents, ...presets];
      });
    }

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

  const handleIdentityChange = (val: UserIdentity) => {
    setIdentity(val);
    setIdentityChanged(val !== userProfile.identity);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ViewHeader 
        title="編輯個人檔案" 
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

      <div className="p-6 space-y-6">
        {/* 大頭貼 */}
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

        {/* 姓名 & 簡介 */}
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

        {/* 身份選擇 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <label className="text-xs text-gray-400 font-bold uppercase ml-1 block mb-1">我的身份</label>
          <p className="text-xs text-gray-400 ml-1 mb-4">選擇後將自動套用對應的行事曆範本</p>
          <div className="space-y-3">
            {identityOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => handleIdentityChange(opt.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${identity === opt.value ? `${opt.bg} border-current ${opt.color} shadow-sm` : 'bg-gray-50 border-transparent text-gray-600 hover:bg-gray-100'}`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <div className="flex-1 text-left">
                  <div className={`font-bold text-sm ${identity === opt.value ? opt.color : 'text-gray-700'}`}>{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${identity === opt.value ? 'border-current bg-current' : 'border-gray-300'}`}>
                  {identity === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>

          {identityChanged && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
              <span className="text-amber-500 text-sm">⚠️</span>
              <p className="text-xs text-amber-700 font-medium">
                儲存後將更新行事曆範本，你自己新增的行程不受影響。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfileView;
