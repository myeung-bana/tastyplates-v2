'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadProgressBarProps {
  isVisible: boolean;
  progress: number; // 0-100
  message?: string;
  onComplete?: () => void;
}

export default function UploadProgressBar({ 
  isVisible, 
  progress, 
  message = 'Uploading review...',
  onComplete 
}: UploadProgressBarProps) {
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    // Smooth progress animation
    if (progress > localProgress) {
      const timer = setTimeout(() => {
        setLocalProgress(prev => Math.min(prev + 1, progress));
      }, 10);
      return () => clearTimeout(timer);
    } else if (progress < localProgress) {
      // Allow progress to decrease (e.g., when resetting)
      setLocalProgress(progress);
    }
  }, [progress, localProgress]);

  useEffect(() => {
    if (localProgress === 100 && onComplete) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [localProgress, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed top-14 md:top-[60px] left-0 right-0 z-[9999] font-neusans"
        >
          <div className="bg-white border-b border-gray-200 shadow-md">
            {/* Progress Info */}
            <div className="max-w-4xl mx-auto px-3 md:px-4 py-2 md:py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Spinner or Checkmark */}
                {localProgress < 100 ? (
                  <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 md:w-5 md:h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                
                {/* Message */}
                <span className="text-xs md:text-sm font-medium text-gray-700">
                  {localProgress === 100 ? 'Review published!' : message}
                </span>
              </div>
              
              {/* Progress Percentage */}
              <span className="text-[10px] md:text-xs font-medium text-gray-500">
                {localProgress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-0.5 md:h-1 bg-gray-100 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                initial={{ width: '0%' }}
                animate={{ width: `${localProgress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
