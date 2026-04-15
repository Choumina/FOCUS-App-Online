import React, { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, X, Info } from 'lucide-react';

interface TourStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  navigateTo?: string;
}

interface FeatureTourProps {
  steps: TourStep[];
  onComplete: () => void;
  isVisible: boolean;
  onNavigate?: (route: string) => void;
}

const FeatureTour: React.FC<FeatureTourProps> = ({ steps, onComplete, isVisible, onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // 當 currentStep 改變，若有 navigateTo，通知上層切換路由
  useEffect(() => {
    if (isVisible && steps[currentStep]?.navigateTo && onNavigate) {
      onNavigate(steps[currentStep].navigateTo!);
    }
  }, [currentStep, steps, isVisible, onNavigate]);

  const mounted = React.useRef(true);
  useEffect(() => {
    return () => { mounted.current = false; };
  }, []);

  const updateCoords = () => {
    const step = steps[currentStep];
    if (!step || !isVisible || !mounted.current) return;

    setIsReady(false); // Reset readiness when calculating new coords

    const attemptUpdate = (retryLeft: number) => {
      if (!mounted.current || !isVisible) return;
      
      const el = document.getElementById(step.targetId);
      if (el) {
        // Must use 'auto' (instant) so that we don't capture coords mid-scroll
        el.scrollIntoView({ behavior: 'auto', block: 'center' }); 
        
        // Wait for next frame layout to complete
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (!mounted.current || !isVisible) return;
            const rect = el.getBoundingClientRect();
            // 由於外容器為 fixed，這裡的 viewport 座標可以直接拿來用
            setCoords({
              top: rect.top,
              left: rect.left,
              width: rect.width,
              height: rect.height
            });
            setIsReady(true);
          }, 50); // Small delay to guarantee reflow
        });
      } else if (retryLeft > 0) {
        setTimeout(() => attemptUpdate(retryLeft - 1), 100);
      } else {
        console.warn(`FeatureTour: Could not find target ${step.targetId} after all retries.`);
      }
    };
    
    // Increased retries to 30 (3 seconds). Some route transitions or data fetches can take a moment.
    attemptUpdate(30); 
  };

  useEffect(() => {
    if (isVisible) {
      updateCoords();
    }
  }, [currentStep, isVisible]);

  useEffect(() => {
    window.addEventListener('resize', updateCoords);
    return () => window.removeEventListener('resize', updateCoords);
  }, [currentStep]);

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (window.confirm('導覽已結束，準備好開啟您的專注之旅了嗎？')) {
        onComplete();
      }
    }
  };

  // 避免在座標尚未計算出來（全 0）或隱藏狀態下顯示破綻
  const isActuallyVisible = isVisible && 
    isReady && 
    (coords.width > 0 || coords.height > 0);

  return (
    <div className={`fixed inset-0 z-[300] transition-opacity duration-500 ${isActuallyVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      {/* Backdrop with hole */}
      <div className="absolute inset-0 bg-black/60 transition-all duration-500" style={{
        clipPath: `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
      }} />

      {/* Highlight Box */}
      {isActuallyVisible && (
        <motion.div
          initial={false}
          animate={{
            top: coords.top - 8,
            left: coords.left - 8,
            width: coords.width + 16,
            height: coords.height + 16,
          }}
          className="absolute border-2 border-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.5)] pointer-events-none"
        >
          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 border-2 border-white/50 rounded-xl"
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
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                <Info size={18} />
              </div>
            </div>

          <h4 className="text-lg font-black text-gray-800 mb-1">{step.title}</h4>
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">
            {step.content}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
              Step {currentStep + 1} of {steps.length}
            </span>
            <button
              onClick={handleNext}
              className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              {currentStep === steps.length - 1 ? '完成導覽' : '下一步'}
              <ChevronRight size={16} />
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
