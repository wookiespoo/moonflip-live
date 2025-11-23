'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { jupiterService } from '@/lib/jupiter';
import { CONFIG } from '@/lib/config';

export function OracleBanner() {
  const [isOracleDown, setIsOracleDown] = useState(false);
  const [downtime, setDowntime] = useState(0);
  const [isMockData, setIsMockData] = useState(false);

  useEffect(() => {
    const checkOracleStatus = () => {
      const downStatus = jupiterService.isOracleDownStatus();
      setIsOracleDown(downStatus);
      
      if (downStatus) {
        setDowntime(jupiterService.getOracleDowntime());
      }
      
      // Show mock data indicator in development
      if (process.env.NODE_ENV === 'development' && CONFIG.USE_MOCK_DATA_IN_DEV) {
        setIsMockData(true);
      }
    };

    // Check immediately
    checkOracleStatus();
    
    // Check every 5 seconds
    const interval = setInterval(checkOracleStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Show mock data indicator in development
  if (process.env.NODE_ENV === 'development' && isMockData && !isOracleDown) {
    return (
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-center gap-2">
        <Info className="h-5 w-5" />
        <span className="font-semibold">Development Mode</span>
        <span className="text-blue-200">• Using mock price data</span>
      </div>
    );
  }

  if (!isOracleDown) return null;

  const minutes = Math.floor(downtime / 60);
  const seconds = downtime % 60;
  const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-2 animate-pulse">
      <AlertTriangle className="h-5 w-5" />
      <span className="font-semibold">Oracle down – bets paused</span>
      <span className="text-red-200">• Down for {timeString}</span>
    </div>
  );
}