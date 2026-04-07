import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Target, Trophy, Ghost, CheckCircle2 } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

const steps = [
  {
    title: "歡迎來到 FOCUS AI",
    desc: "這是一個結合 AI 助手與遊戲化體驗的專注力工具，幫助你高效完成任務。",
    icon: <Sparkles size={64} className="text-indigo-500" />,
    color: "from-indigo-500 to-purple-500"
  },
  {
    title: "AI 智能拆解",
    desc: "遇到繁雜的任務？讓 AI 幫你拆解成可執行的小步驟，並自動安排進日曆。",
    icon: <Target size={64} className="text-blue-500" />,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "專注賺取獎勵",
    desc: "使用專注計時器完成工作，賺取金幣來擴建你的專案區域並領養可愛寵物。",
    icon: <Ghost size={64} className="text-pink-500" />,
    color: "from-pink-500 to-rose-500"
  },
  {
    title: "競爭與成長",
    desc: "在排行榜上與好友競爭，提升等級，解鎖更多功能與裝飾。",
    icon: <Trophy size={64} className="text-yellow-500" />,
    color: "from-yellow-500 to-orange-500"
  }
];

const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="flex-1 flex flex-col items-center justify-center p-8 text-center"
        >
          <motion.div 
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${steps[currentStep].color} flex items-center justify-center mb-12 shadow-2xl shadow-indigo-200`}
          >
            <div className="text-white">
              {steps[currentStep].icon}
            </div>
          </motion.div>

          <h2 className="text-3xl font-black text-gray-800 mb-6 tracking-tight">
            {steps[currentStep].title}
          </h2>
          
          <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-[280px]">
            {steps[currentStep].desc}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="p-10 flex flex-col items-center gap-8">
        {/* Progress Dots */}
        <div className="flex gap-3">
          {steps.map((_, i) => (
            <div 
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={next}
          className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black text-lg flex items-center justify-center gap-3 shadow-xl"
        >
          {currentStep === steps.length - 1 ? (
            <>
              開始體驗 <CheckCircle2 size={24} />
            </>
          ) : (
            <>
              下一步 <ChevronRight size={24} />
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default OnboardingView;
