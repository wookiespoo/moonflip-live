'use client';

import { useEffect } from 'react';
import { initSentry } from '@/lib/monitoring';

export function SentryInit() {
  useEffect(() => {
    initSentry();
  }, []);

  return null;
}