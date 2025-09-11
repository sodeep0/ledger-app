import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Pull-to-refresh hook for mobile devices
 * Provides smooth pull-to-refresh functionality with visual feedback
 */
export const usePullToRefresh = (onRefresh, options = {}) => {
  const {
    threshold = 80, // Distance to pull before triggering refresh
    resistance = 0.5, // Resistance factor for pull distance
    maxPullDistance = 120, // Maximum pull distance
    refreshTimeout = 2000, // Timeout for refresh operation
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const elementRef = useRef(null);
  const refreshTimeoutRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    // Only trigger if at the top of the scrollable area
    if (elementRef.current && elementRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    if (deltaY > 0) {
      // Prevent default scrolling behavior
      e.preventDefault();
      
      // Calculate pull distance with resistance
      const distance = Math.min(deltaY * resistance, maxPullDistance);
      setPullDistance(distance);
    }
  }, [isPulling, resistance, maxPullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh failed:', error);
      } finally {
        // Reset after timeout
        refreshTimeoutRef.current = setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, refreshTimeout);
      }
    } else {
      // Snap back if not enough distance
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, onRefresh, refreshTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  // Attach touch event listeners
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate refresh state
  const refreshState = {
    isRefreshing,
    isPulling,
    pullDistance,
    shouldRefresh: pullDistance >= threshold,
    progress: Math.min(pullDistance / threshold, 1),
  };

  return {
    elementRef,
    refreshState,
    // Manual refresh trigger
    triggerRefresh: useCallback(async () => {
      if (isRefreshing) return;
      
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Manual refresh failed:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, refreshTimeout);
      }
    }, [isRefreshing, onRefresh, refreshTimeout]),
  };
};

export default usePullToRefresh;
