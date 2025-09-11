import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * Virtual Table Component for handling large datasets efficiently
 * Only renders visible rows to improve performance
 */
const VirtualTable = ({ 
  data, 
  renderRow, 
  rowHeight = 60, 
  containerHeight = 400,
  overscan = 5 // Number of extra rows to render above/below visible area
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / rowHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / rowHeight) + overscan,
      data.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end
    };
  }, [scrollTop, rowHeight, containerHeight, data.length, overscan]);

  // Handle scroll events
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  // Calculate total height and offset
  const totalHeight = data.length * rowHeight;
  const offsetY = visibleRange.start * rowHeight;

  // Get visible items
  const visibleItems = data.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => 
            renderRow(item, visibleRange.start + index)
          )}
        </div>
      </div>
    </div>
  );
};

export default VirtualTable;
