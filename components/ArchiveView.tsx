import React from 'react';
import { AppRoute } from '../types';
import ViewHeader from './ViewHeader';
import { ListChecks, ChevronLeft } from 'lucide-react';

interface ArchiveViewProps {
  navigateTo: (route: AppRoute) => void;
}

const ArchiveView: React.FC<ArchiveViewProps> = ({ navigateTo }) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ViewHeader title="封存" onBack={() => navigateTo(AppRoute.PROFILE)} />

      <div className="p-6">
        <div className="space-y-3">
          <div 
            onClick={() => navigateTo(AppRoute.PROFILE_ARCHIVED_REMINDERS)}
            className="bg-white rounded-3xl p-4 shadow-sm flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                <ListChecks size={20} />
              </div>
              <span className="font-bold text-gray-700">Reminders</span>
            </div>
            <ChevronLeft className="rotate-180 text-gray-300" size={20} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveView;
