import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Info } from 'lucide-react';
import { TourStep } from '../types';
import { useFeatureTour } from '../hooks/useFeatureTour';

interface FeatureTourProps {
  steps: TourStep[];
  onComplete: () => void;
  isVisible: boolean;
  onNavigate?: (route: string) => void;
}

const FeatureTour: React.FC<FeatureTourProps> = (props) => {
  const { isVisible, steps, onComplete } = props;
  const { 
    currentStep, coords, isReady, showTroubleshoot, step, handleNext, updateCoords 
  } = useFeatureTour(props);

  // 定義真正的可見性：isVisible 是外部開關，isActuallyVisible 是內部座標已鎖定
  const isActuallyVisible = isVisible && isReady;

  return (
    <div className={`fixed inset-0 z-[999] transition-opacity duration-500 ${isActuallyVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop with circular cutout using SVG mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {isActuallyVisible && (
              <motion.rect
                initial={false}
                animate={{
                  x: coords.left - 12,
                  y: coords.top - 12,
                  width: coords.width + 24,
                  height: coords.height + 24,
                }}
                rx={24}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <motion.rect
          initial={false}
          animate={{ opacity: isActuallyVisible ? 1 : 0 }}
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#tour-mask)"
          className="transition-all duration-500"
        />
      </svg>

      {/* 故障排除按鈕：如果尋找超過 2.5 秒則顯示 */}
      {isVisible && !isReady && showTroubleshoot && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-10 z-[350]">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 text-center shadow-2xl">
            <p className="text-white font-bold mb-4">似乎找不到目標按鈕...</p>
            <button 
              onClick={() => updateCoords()}
              className="bg-white text-black px-6 py-3 rounded-2xl font-black text-sm hover:scale-105 transition-transform"
            >
              直接在中心顯示導覽
            </button>
          </div>
        </div>
      )}

      {/* Highlight Circle (Now a Rect) */}
      {isActuallyVisible && (
        <motion.div
          initial={false}
          animate={{
            top: coords.top - 12,
            left: coords.left - 12,
            width: coords.width + 24,
            height: coords.height + 24,
          }}
          className="absolute border-[2.5px] border-white rounded-[2rem] shadow-[0_0_30px_rgba(255,255,255,0.4)] pointer-events-none"
        >
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-2 border-2 border-white/40 rounded-[2.2rem]"
          />
        </motion.div>
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        {isActuallyVisible && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              top: coords.top > (window.innerHeight / 2) 
                ? Math.max(20, coords.top - 240) 
                : Math.min(window.innerHeight - 280, coords.top + coords.height + 20),
              left: Math.max(20, Math.min(window.innerWidth - 300, coords.left + coords.width / 2 - 140))
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute w-[280px] bg-white rounded-3xl p-5 shadow-2xl pointer-events-auto border border-gray-100 z-[310]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <Info size={18} strokeWidth={2.5} />
              </div>
              <button 
                onClick={onComplete}
                className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors"
                title="關閉導覽"
              >
                <X size={18} strokeWidth={3} />
              </button>
            </div>

            <h4 className="text-xl font-black text-gray-900 mb-2">{step.title}</h4>
            <p className="text-[13px] text-gray-500 font-bold leading-relaxed mb-8">
              {step.content}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">
                STEP {currentStep + 1} OF {steps.length}
              </span>
              <button
                onClick={handleNext}
                className="bg-black text-white px-6 py-2.5 rounded-full font-black text-[13px] flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                {currentStep === steps.length - 1 ? '完成導覽' : '下一步'}
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Arrow */}
            <div 
              className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100 ${coords.top > window.innerHeight / 2 ? '-bottom-2 border-l-0 border-t-0 border-r border-b' : '-top-2'}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureTour;
