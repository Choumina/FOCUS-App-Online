import React, { useState, useRef } from 'react';
import { AppRoute, CalendarEvent, UserIdentity, UserProfile } from '../types';
import ViewHeader from './ViewHeader';
import { Camera, Check, GraduationCap, School, User } from 'lucide-react';

interface EditProfileViewProps {
  navigateTo: (route: AppRoute) => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  setCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

// 根據身份產生預設行事曆事件
const generatePresetEvents = (identity: UserIdentity): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const today = new Date();
  
  // Helper to add a single date event
  const addEvent = (date: string, hour: number, title: string, color: string, height = 1.5) => {
    events.push({
      id: `preset-${identity}-${date}-${hour}-${title}`,
      date,
      top: hour * 40,
      height: height * 40,
      title,
      color,
      isDraft: false,
      isPreset: true,
    });
  };

  // Helper to add a date range (full day indicators)
  const addRange = (start: string, end: string, title: string, color: string) => {
    const s = new Date(start);
    const e = new Date(end);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      addEvent(dateStr, 8, title, color, 12); // Covers prime time (8am to 8pm)
    }
  };

  // 1. ADD FIXED 2025/2026 ACADEMIC DATES
  if (identity === 'university') {
    // College 2025/2026 Schedule
    const years = [2025, 2026];
    years.forEach(y => {
      addRange(`${y}-04-13`, `${y}-04-19`, '🔴 期中考試週', 'bg-red-200');
      addRange(`${y}-06-08`, `${y}-06-14`, '🔴 期末考試週', 'bg-red-200');
      addRange(`${y}-10-19`, `${y}-10-25`, '🔴 期中考試週', 'bg-red-200');
      addRange(`${y}-12-14`, `${y}-12-20`, '🔴 期末考試週', 'bg-red-200');
      
      addRange(`${y}-04-01`, `${y}-04-07`, '🟢 春假連假 (Early Apr)', 'bg-green-200');
      addRange(`${y}-06-15`, `${y}-08-31`, '🟢 暑假：Summer Break', 'bg-green-100');
      addRange(`${y}-12-21`, `${y}-12-31`, '🟢 寒假：Winter Break', 'bg-green-100');
    });
  } else if (identity === 'high_school') {
    // High School 2025/2026 Schedule
    const years = [2025, 2026];
    years.forEach(y => {
      addRange(`${y}-05-11`, `${y}-05-17`, '🔴 高中段考週', 'bg-red-200');
      addRange(`${y}-06-21`, `${y}-06-28`, '🔴 高中期末考', 'bg-red-200');
      addRange(`${y}-10-05`, `${y}-10-11`, '🔴 高中段考週', 'bg-red-200');
      addRange(`${y}-11-16`, `${y}-11-22`, '🔴 高中段考週', 'bg-red-200');
      
      addRange(`${y}-02-01`, `${y}-02-07`, '📂 學習歷程檔案整理 (Early Feb)', 'bg-purple-200');
      addRange(`${y}-06-24`, `${y}-06-30`, '📂 學習歷程檔案上傳 (Late Jun)', 'bg-purple-200');
      addRange(`${y}-08-10`, `${y}-08-16`, '📂 學習歷程檔案確認 (Mid Aug)', 'bg-purple-200');
      
      addRange(`${y}-01-20`, `${y}-02-15`, '🟢 寒假：Winter Holiday', 'bg-green-100');
      addRange(`${y}-07-01`, `${y}-08-31`, '🟢 暑假：Summer Holiday', 'bg-green-100');
    });
  }

  // 2. ADD RELATIVE "DEFAULT WEEK" EVENTS FOR IMMEDIATE VISIBILITY
  const formatDate = (offset: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  };

  if (identity === 'high_school') {
    // Monday-Friday schedule
    for (let i = -today.getDay() + 1; i <= -today.getDay() + 5; i++) {
        addEvent(formatDate(i), 8, '🏫 早自習', 'bg-blue-100', 1);
        addEvent(formatDate(i), 9, '📖 國文/英文/數學', 'bg-blue-200', 3);
        addEvent(formatDate(i), 12, '🍱 午餐午休', 'bg-gray-100', 1);
        addEvent(formatDate(i), 13, '🔬 物理/化學/社會', 'bg-purple-200', 3);
        addEvent(formatDate(i), 19, '📝 晚自習', 'bg-indigo-100', 2.5);
    }
  } else if (identity === 'university') {
    addEvent(formatDate(0), 10, '🎓 必修：專業科目', 'bg-blue-200', 2);
    addEvent(formatDate(0), 14, '💻 實驗/實作', 'bg-purple-200', 3);
    addEvent(formatDate(1), 9, '🗣️ 通識：外語討論', 'bg-green-200', 1.5);
    addEvent(formatDate(1), 13, '📊 統計學', 'bg-blue-200', 2);
    addEvent(formatDate(2), 10, '💡 創業與創新', 'bg-orange-200', 2);
    addEvent(formatDate(2), 15, '🎨 藝術欣賞', 'bg-pink-100', 1.5);
    addEvent(formatDate(3), 11, '📚 讀書會/專題', 'bg-cyan-100', 2);
    addEvent(formatDate(4), 14, '🏃 體育/重訓', 'bg-green-100', 1);
  } else {
    addEvent(formatDate(0), 9, '☀️ 晨間日誌', 'bg-yellow-100', 1);
    addEvent(formatDate(0), 10, '🏢 專案開發', 'bg-blue-100', 3.5);
    addEvent(formatDate(1), 10, '💼 工作會議', 'bg-purple-100', 2);
    addEvent(formatDate(1), 14, '🎨 技能進修', 'bg-green-100', 2);
    addEvent(formatDate(3), 9, '🎯 週計畫覆盤', 'bg-orange-100', 1.5);
  }

  return events;
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
    setUserProfile((prev: UserProfile) => ({ ...prev, name, bio, avatar, identity }));

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
