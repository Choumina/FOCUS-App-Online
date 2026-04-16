import { useState, useEffect, useRef, useCallback } from 'react';
import { TourStep } from '../types';

interface UseFeatureTourProps {
  steps: TourStep[];
  isVisible: boolean;
  onComplete: () => void;
  onNavigate?: (route: string) => void;
}

/**
 * useFeatureTour Hook
 * Enhanced with continuous tracking for perfectly aligned spotlights.
 */
export const useFeatureTour = ({ steps, isVisible, onComplete, onNavigate }: UseFeatureTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);
  
  const mounted = useRef(true);
  const troubleshootTimer = useRef<NodeJS.Timeout | null>(null);
  const trackingFrame = useRef<number | null>(null);
  const step = steps[currentStep];

  // Continuous tracking logic
  const trackElement = useCallback(() => {
    if (!step || !isVisible || !mounted.current) return;

    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      
      // Update coordinates if they differ significantly from current state
      // (Using a small threshold to avoid excessive re-renders from sub-pixel fluctuations)
      setCoords(prev => {
        if (
          Math.abs(prev.top - rect.top) < 0.1 &&
          Math.abs(prev.left - rect.left) < 0.1 &&
          Math.abs(prev.width - rect.width) < 0.1 &&
          Math.abs(prev.height - rect.height) < 0.1
        ) {
          return prev;
        }
        return {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        };
      });

      if (!isReady && rect.width > 0 && rect.height > 0) {
        setIsReady(true);
      }
    } else {
      setIsReady(false);
    }

    trackingFrame.current = requestAnimationFrame(trackElement);
  }, [step, isVisible, isReady]);

  // Handle step initial scroll and loop startup
  useEffect(() => {
    if (isVisible && step) {
      // Initial scroll to target
      setTimeout(() => {
        const el = document.getElementById(step.targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);

      // Start tracking loop
      trackingFrame.current = requestAnimationFrame(trackElement);
      
      return () => {
        if (trackingFrame.current) cancelAnimationFrame(trackingFrame.current);
      }
    }
  }, [currentStep, isVisible, step, trackElement]);

  // Sync: Reset state and setup troubleshooting timer on tour start
  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setIsReady(false);
      setShowTroubleshoot(false);

      if (troubleshootTimer.current) clearTimeout(troubleshootTimer.current);
      troubleshootTimer.current = setTimeout(() => {
        if (mounted.current && !isReady) setShowTroubleshoot(true);
      }, 3000);

      return () => {
        if (troubleshootTimer.current) clearTimeout(troubleshootTimer.current);
      };
    }
  }, [isVisible]);

  // Sync: Navigation synchronization
  useEffect(() => {
    if (isVisible && step?.navigateTo && onNavigate) {
      onNavigate(step.navigateTo);
    }
  }, [currentStep, step, isVisible, onNavigate]);

  // Lifecycle: Cleanup
  useEffect(() => {
    mounted.current = true;
    return () => { 
      mounted.current = false;
      if (troubleshootTimer.current) clearTimeout(troubleshootTimer.current);
      if (trackingFrame.current) cancelAnimationFrame(trackingFrame.current);
    };
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      if (window.confirm('導覽已結束，準備好開啟您的專注之旅了嗎？')) {
        onComplete();
      }
    }
  };

  return {
    currentStep,
    coords,
    isReady,
    showTroubleshoot,
    step,
    handleNext,
    updateCoords: () => {
       // Manual fallback to center if needed
       setCoords({
         top: window.innerHeight / 2 - 80,
         left: window.innerWidth / 2 - 140,
         width: 280,
         height: 160
       });
       setIsReady(true);
    }
  };
};
