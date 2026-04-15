import React from 'react';
import { AppRoute, Task } from '../types';
import ViewHeader from './ViewHeader';
import { CheckCircle2, Calendar } from 'lucide-react';

interface ArchivedRemindersViewProps {
  navigateTo: (route: AppRoute) => void;
  archivedTasks: Task[];
}

const ArchivedRemindersView: React.FC<ArchivedRemindersViewProps> = ({ navigateTo, archivedTasks }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ViewHeader title="Reminders 封存區" onBack={() => navigateTo(AppRoute.PROFILE_ARCHIVE)} />

      <div className="p-6">
        {archivedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CheckCircle2 size={48} className="mb-4 opacity-20" />
            <p className="font-bold">目前沒有封存的任務</p>
          </div>
        ) : (
          <div className="space-y-4">
            {archivedTasks.map(task => (
              <div key={task.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle2 size={24} className="text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                    <div className="flex items-center gap-2 mt-2 text-gray-400">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">完成日期: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            )).reverse()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivedRemindersView;
