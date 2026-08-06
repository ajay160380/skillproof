import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useIntegrityMonitor(isActive: boolean = true) {
  const [tabSwitches, setTabSwitches] = useState(0);
  const [devtoolsDetected, setDevtoolsDetected] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const next = prev + 1;
          toast.error(`⚠️ PROCTOR ALERT: Tab switch detected. This event has been logged for AI review.`, {
            duration: 4000,
            style: { border: '1px solid #ef4444', color: '#dc2626' }
          });
          return next;
        });
      }
    };

    const detectDevTools = () => {
      // Basic detection using window dimensions (soft signal)
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > threshold || heightDiff > threshold) {
        setDevtoolsDetected(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', detectDevTools);
    
    // Initial check
    detectDevTools();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [isActive]);

  const incrementTabSwitches = useCallback(() => setTabSwitches(p => p + 1), []);
  const manuallyTriggerDevtools = useCallback(() => setDevtoolsDetected(true), []);

  return {
    tabSwitches,
    devtoolsDetected,
    incrementTabSwitches,
    manuallyTriggerDevtools,
  };
}
