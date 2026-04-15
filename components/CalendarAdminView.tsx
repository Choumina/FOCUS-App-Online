import React, { useState, useMemo } from 'react';
import { AppRoute, CalendarEvent } from '../types';
import ViewHeader from './ViewHeader';
import {
  Trash2, Pencil, Plus, Check, X, Calendar, ChevronDown, ChevronUp, Tag, Clock
} from 'lucide-react';

interface CalendarAdminViewProps {
  navigateTo: (route: AppRoute) => void;
  events: CalendarEvent[];
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
}

const COLOR_OPTIONS = [
  { value: 'bg-blue-200',   label: '藍色',   dot: 'bg-blue-400' },
  { value: 'bg-green-200',  label: '綠色',   dot: 'bg-green-400' },
  { value: 'bg-yellow-200', label: '黃色',   dot: 'bg-yellow-400' },
  { value: 'bg-red-200',    label: '紅色',   dot: 'bg-red-400' },
  { value: 'bg-purple-200', label: '紫色',   dot: 'bg-purple-400' },
  { value: 'bg-pink-200',   label: '粉色',   dot: 'bg-pink-400' },
  { value: 'bg-orange-200', label: '橙色',   dot: 'bg-orange-400' },
  { value: 'bg-gray-100',   label: '灰色',   dot: 'bg-gray-400' },
];

const HOUR_HEIGHT = 40;

const pxToTimeStr = (px: number): string => {
  const totalMins = Math.round((px / HOUR_HEIGHT) * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
};

const timeStrToPx = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return ((h * 60 + m) / 60) * HOUR_HEIGHT;
};

const heightToDurationStr = (h: number): string => {
  const mins = Math.round((h / HOUR_HEIGHT) * 60);
  if (mins < 60) return `${mins} 分鐘`;
  const hr = Math.floor(mins / 60);
  const rm = mins % 60;
  return rm > 0 ? `${hr} 小時 ${rm} 分鐘` : `${hr} 小時`;
};

const durationStrToHeight = (d: string): number => {
  // d is like "90" (minutes)
  return (parseInt(d) / 60) * HOUR_HEIGHT;
};

interface EditFormState {
  id: string;
  title: string;
  date: string;
  startTime: string;
  durationMins: string;
  color: string;
}

const CalendarAdminView: React.FC<CalendarAdminViewProps> = ({ navigateTo, events, setEvents }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newForm, setNewForm] = useState<EditFormState>({
    id: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    durationMins: '60',
    color: 'bg-blue-200',
  });
  const [filterDate, setFilterDate] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Group & sort
  const filteredEvents = useMemo(() => {
    let list = [...events];
    if (filterDate) list = list.filter(e => e.date === filterDate);
    list.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date) || a.top - b.top;
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [events, filterDate, sortAsc]);

  const grouped = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach(e => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [filteredEvents]);

  const startEdit = (event: CalendarEvent) => {
    setEditingId(event.id);
    setEditForm({
      id: event.id,
      title: event.title,
      date: event.date,
      startTime: pxToTimeStr(event.top),
      durationMins: String(Math.round((event.height / HOUR_HEIGHT) * 60)),
      color: event.color,
    });
  };

  const saveEdit = () => {
    if (!editForm) return;
    setEvents(prev => prev.map(e =>
      e.id === editForm.id ? {
        ...e,
        title: editForm.title,
        date: editForm.date,
        top: timeStrToPx(editForm.startTime),
        height: durationStrToHeight(editForm.durationMins),
        color: editForm.color,
      } : e
    ));
    setEditingId(null);
    setEditForm(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeletingId(null);
  };

  const createEvent = () => {
    const id = `admin-${Date.now()}`;
    const top = timeStrToPx(newForm.startTime);
    const height = durationStrToHeight(newForm.durationMins);
    setEvents(prev => [...prev, {
      id,
      title: newForm.title || '新事件',
      date: newForm.date,
      top,
      height,
      color: newForm.color,
      isDraft: false,
    }]);
    setIsCreating(false);
    setNewForm({
      id: '',
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      durationMins: '60',
      color: 'bg-blue-200',
    });
  };

  const totalCount = events.length;
  const presetCount = events.filter(e => e.isPreset).length;
  const userCount = totalCount - presetCount;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <ViewHeader
        title="行事曆後台管理"
        onBack={() => navigateTo(AppRoute.CALENDAR_DETAIL)}
      />

      {/* Stats */}
      <div className="px-4 pt-4 grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-blue-500">{totalCount}</div>
          <div className="text-[10px] text-gray-400 font-bold mt-0.5">全部事件</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-purple-500">{presetCount}</div>
          <div className="text-[10px] text-gray-400 font-bold mt-0.5">預設範本</div>
        </div>
        <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
          <div className="text-2xl font-black text-green-500">{userCount}</div>
          <div className="text-[10px] text-gray-400 font-bold mt-0.5">自建行程</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 mt-4 flex gap-2 items-center">
        <div className="relative flex-1">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
          />
        </div>
        <button
          onClick={() => setSortAsc(s => !s)}
          className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm text-gray-500 hover:text-blue-500 hover:border-blue-200 transition-all"
          title={sortAsc ? '最舊優先' : '最新優先'}
        >
          {sortAsc ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="bg-white border border-gray-100 rounded-2xl p-2.5 shadow-sm text-gray-400 hover:text-red-500 transition-all"
          >
            <X size={18} />
          </button>
        )}
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-500 text-white rounded-2xl px-4 py-2.5 font-bold text-sm flex items-center gap-1.5 shadow-md hover:bg-blue-600 active:scale-95 transition-all"
        >
          <Plus size={16} />新增
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="mx-4 mt-4 bg-white rounded-3xl p-5 shadow-md border border-blue-100 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-800">新增行程</h3>
            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>
          <EventForm form={newForm} setForm={setNewForm} />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setIsCreating(false)}
              className="flex-1 py-2.5 rounded-2xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={createEvent}
              disabled={!newForm.title.trim()}
              className="flex-1 py-2.5 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={16} />儲存
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="px-4 mt-4 space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">沒有找到行程</p>
            <p className="text-xs mt-1">點擊右上角「新增」建立第一筆行程</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full" />
                <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                  {new Date(date + 'T00:00:00').toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] text-gray-400 font-bold">{dayEvents.length} 筆</span>
              </div>
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <div key={event.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    {editingId === event.id && editForm ? (
                      /* Edit Mode */
                      <div className="p-4">
                        <EventForm form={editForm} setForm={setEditForm as any} />
                        <div className="flex gap-2 mt-3">
                          <button onClick={cancelEdit} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm hover:bg-gray-200 transition-colors">
                            取消
                          </button>
                          <button onClick={saveEdit} className="flex-1 py-2 rounded-xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1">
                            <Check size={14} />儲存
                          </button>
                        </div>
                      </div>
                    ) : deletingId === event.id ? (
                      /* Delete Confirm */
                      <div className="p-4 bg-red-50">
                        <p className="text-sm font-bold text-red-700 mb-1">確定刪除這筆行程？</p>
                        <p className="text-xs text-gray-500 mb-3">「{event.title || '未命名'}」將被永久移除</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeletingId(null)} className="flex-1 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-sm">
                            取消
                          </button>
                          <button onClick={() => deleteEvent(event.id)} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-1">
                            <Trash2 size={14} />刪除
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Read Mode */
                      <div className="flex items-center gap-3 p-3.5">
                        <div className={`w-1.5 self-stretch rounded-full ${event.color?.replace('-200', '-400') ?? 'bg-blue-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-sm font-bold text-gray-800 truncate">{event.title || '未命名'}</span>
                            {event.isPreset && (
                              <span className="text-[9px] bg-purple-100 text-purple-500 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">範本</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {pxToTimeStr(event.top)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Tag size={10} />
                              {heightToDurationStr(event.height)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => startEdit(event)}
                            className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 flex items-center justify-center transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeletingId(event.id)}
                            className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Delete Presets */}
      {presetCount > 0 && (
        <div className="mx-4 mt-6">
          <button
            onClick={() => {
              if (window.confirm(`確定要刪除全部 ${presetCount} 筆預設範本事件嗎？`)) {
                setEvents(prev => prev.filter(e => !e.isPreset));
              }
            }}
            className="w-full py-3 rounded-2xl bg-white border border-red-100 text-red-400 font-bold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={16} />
            清除全部預設範本事件（{presetCount} 筆）
          </button>
        </div>
      )}
    </div>
  );
};

// ── Shared EventForm sub-component ───────────────────────────────────────────
interface EventFormProps {
  form: EditFormState;
  setForm: React.Dispatch<React.SetStateAction<EditFormState>>;
}

const EventForm: React.FC<EventFormProps> = ({ form, setForm }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">標題</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="輸入行程名稱…"
          className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">日期</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-100"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">開始時間</label>
          <input
            type="time"
            value={form.startTime}
            onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
            className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-100"
          />
        </div>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">時長（分鐘）</label>
        <select
          value={form.durationMins}
          onChange={e => setForm(f => ({ ...f, durationMins: e.target.value }))}
          className="w-full mt-1 bg-gray-50 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 border border-gray-100"
        >
          {[15, 30, 45, 60, 90, 120, 150, 180, 210, 240].map(m => (
            <option key={m} value={m}>{m < 60 ? `${m} 分鐘` : `${Math.floor(m/60)} 小時${m%60>0?' '+m%60+' 分鐘':''}`}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">顏色</label>
        <div className="flex gap-2 mt-2 flex-wrap">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c.value}
              onClick={() => setForm(f => ({ ...f, color: c.value }))}
              title={c.label}
              className={`w-7 h-7 rounded-full ${c.dot} border-2 transition-all ${form.color === c.value ? 'border-gray-700 scale-125 shadow-md' : 'border-transparent hover:scale-110'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalendarAdminView;
