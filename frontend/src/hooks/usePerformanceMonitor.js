import { useEffect, useRef, useCallback } from 'react';

/**
 * Performance monitoring hook
 * Tracks component render times and performance metrics
 */
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef();
  const renderCount = useRef(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      if (renderStartTime.current) {
        const renderTime = performance.now() - renderStartTime.current;
        
        // Log performance metrics in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${componentName}:`, {
            renderTime: `${renderTime.toFixed(2)}ms`,
            renderCount: renderCount.current,
            timestamp: new Date().toISOString()
          });
        }

      }
    };
  });

  // Return performance metrics for debugging
  return {
    renderCount: renderCount.current,
    getRenderTime: () => {
      if (renderStartTime.current) {
        return performance.now() - renderStartTime.current;
      }
      return 0;
    }
  };
};

/**
 * Hook to measure async operation performance
 */
export const useAsyncPerformance = () => {
  const measureAsync = useCallback(async (operation, operationName) => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Async Performance] ${operationName}: ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Async Performance] ${operationName} (ERROR): ${duration.toFixed(2)}ms`);
      }
      
      throw error;
    }
  }, []);

  return { measureAsync };
};

export default usePerformanceMonitor;
