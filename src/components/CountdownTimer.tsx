'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endTime: number;
  onComplete?: () => void;
}

export default function CountdownTimer({ endTime, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now());
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0 && !isCompleted) {
      setIsCompleted(true);
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = endTime - Date.now();
      setTimeLeft(newTimeLeft);

      if (newTimeLeft <= 0 && !isCompleted) {
        setIsCompleted(true);
        onComplete?.();
        clearInterval(timer);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [endTime, timeLeft, isCompleted, onComplete]);

  const formatTime = (ms: number) => {
    const seconds = Math.max(0, Math.ceil(ms / 1000));
    return `${seconds}s`;
  };

  const getProgress = () => {
    const total = 60000; // 60 seconds
    const elapsed = total - Math.max(0, timeLeft);
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const progress = getProgress();
  const displayTime = formatTime(timeLeft);

  return (
    <div className="bg-gray-800 rounded-xl p-6">
      <div className="text-center">
        <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
        
        <div className="text-4xl font-bold text-white mb-4">
          {displayTime}
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
          <div
            className={`
              h-3 rounded-full transition-all duration-100
              ${timeLeft > 30000 ? 'bg-green-500' : timeLeft > 10000 ? 'bg-yellow-500' : 'bg-red-500'}
            `}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="text-xs text-gray-500">
          {timeLeft > 0 ? 'Flip in progress...' : 'Time\'s up!'}
        </div>
      </div>
    </div>
  );
}