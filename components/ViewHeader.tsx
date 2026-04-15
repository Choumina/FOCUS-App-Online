import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ViewHeaderProps {
  title: string;
  onBack: () => void;
  rightElement?: React.ReactNode;
  className?: string;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({ title, onBack, rightElement, className = "" }) => {
  return (
    <div className={`bg-white/80 backdrop-blur-md p-6 flex items-center justify-between shadow-sm sticky top-0 z-50 ${className}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-all active:scale-90"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-black text-gray-800 tracking-tight">{title}</h1>
      </div>
      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default ViewHeader;
