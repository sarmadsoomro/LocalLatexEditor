import { useState, useRef, useEffect, useCallback } from 'react';
import type React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

export interface ResizableSplitPaneProps {
  /** Content for the left panel (typically editor) */
  leftPane: React.ReactNode;
  /** Content for the right panel (typically preview) */
  rightPane: React.ReactNode;
  /** Default left panel width percentage (0-100), defaults to 60 */
  defaultSplit?: number;
  /** Minimum left panel width in pixels, defaults to 200 */
  minLeftWidth?: number;
  /** Minimum right panel width in pixels, defaults to 200 */
  minRightWidth?: number;
  /** localStorage key for persisting position, defaults to 'latex-editor-split-position' */
  storageKey?: string;
  /** Additional className for the container */
  className?: string;
}

export function ResizableSplitPane({
  leftPane,
  rightPane,
  defaultSplit = 60,
  minLeftWidth = 200,
  minRightWidth = 200,
  storageKey = 'latex-editor-split-position',
  className = '',
}: ResizableSplitPaneProps) {
  const getInitialSplit = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0 && parsed < 100) {
          return parsed;
        }
      }
    } catch {
      // localStorage unavailable in private browsing
    }
    return defaultSplit;
  }, [defaultSplit, storageKey]);

  const [splitPosition, setSplitPosition] = useState(getInitialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const [maximizedPane, setMaximizedPane] = useState<'none' | 'editor' | 'pdf'>('none');
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, splitPosition.toString());
    } catch {
      // localStorage unavailable in private browsing
    }
  }, [splitPosition, storageKey]);

  const calculateConstraints = useCallback(() => {
    if (!containerRef.current) return null;
    const containerWidth = containerRef.current.offsetWidth;
    const minLeftPercent = (minLeftWidth / containerWidth) * 100;
    const minRightPercent = (minRightWidth / containerWidth) * 100;
    return {
      minPercent: minLeftPercent,
      maxPercent: 100 - minRightPercent,
    };
  }, [minLeftWidth, minRightWidth]);

  const clampSplit = useCallback(
    (value: number) => {
      const constraints = calculateConstraints();
      if (!constraints) return value;
      return Math.max(constraints.minPercent, Math.min(constraints.maxPercent, value));
    },
    [calculateConstraints]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Exit maximized mode when user starts dragging manually
    setMaximizedPane('none');
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newSplit = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const clampedSplit = clampSplit(newSplit);
      setSplitPosition(clampedSplit);
    },
    [isDragging, clampSplit]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleResize = () => {
      setSplitPosition((prev) => clampSplit(prev));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampSplit]);

  const handleDoubleClick = useCallback(() => {
    setMaximizedPane('none');
    setSplitPosition(clampSplit(defaultSplit));
  }, [defaultSplit, clampSplit]);

  return (
    <div
      ref={containerRef}
      className={`flex h-full min-h-0 w-full overflow-hidden ${className}`}
    >
      <div
        className="h-full min-h-0 flex-shrink-0 overflow-hidden relative z-20 group"
        style={{
          width:
            maximizedPane === 'editor'
              ? `calc(100% - ${minRightWidth}px)`
              : maximizedPane === 'pdf'
              ? `${minLeftWidth}px`
              : `${splitPosition}%`,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setMaximizedPane((prev) => (prev === 'editor' ? 'none' : 'editor'))
          }
          aria-pressed={maximizedPane === 'editor'}
          aria-label={
            maximizedPane === 'editor' ? 'Restore split layout' : 'Maximize editor pane'
          }
          title={
            maximizedPane === 'editor' ? 'Restore split layout' : 'Maximize editor pane'
          }
          className="absolute top-2 right-2 z-50 inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white/80 text-gray-500 shadow-sm transition-opacity hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          {maximizedPane === 'editor' ? (
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
        {leftPane}
      </div>

      <div
        ref={dividerRef}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        className={`
          flex-shrink-0 w-1 bg-border hover:bg-cta
          cursor-col-resize select-none
          transition-colors duration-150
          ${isDragging ? 'bg-cta' : ''}
        `}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panels"
        aria-valuenow={Math.round(splitPosition)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            setMaximizedPane('none');
            setSplitPosition((prev) => clampSplit(prev - 2));
          } else if (e.key === 'ArrowRight') {
            setMaximizedPane('none');
            setSplitPosition((prev) => clampSplit(prev + 2));
          } else if (e.key === 'Home') {
            setMaximizedPane('none');
            setSplitPosition(clampSplit(defaultSplit));
          }
        }}
      >
        <div className="h-full flex items-center justify-center">
          <div
            className={`
              w-1 h-8 rounded-full
              transition-colors duration-150
              ${isDragging ? 'bg-primary-dark' : 'bg-text-muted group-hover:bg-primary-light'}
            `}
          />
        </div>
      </div>

      <div
        className={`h-full min-h-0 overflow-hidden relative z-20 group ${
          maximizedPane === 'none' ? 'flex-1' : 'flex-shrink-0'
        }`}
        style={{
          minWidth: `${minRightWidth}px`,
          ...(maximizedPane === 'editor'
            ? { width: `${minRightWidth}px` }
            : maximizedPane === 'pdf'
            ? { width: `calc(100% - ${minLeftWidth}px)` }
            : {}),
        }}
      >
        <button
          type="button"
          onClick={() => setMaximizedPane((prev) => (prev === 'pdf' ? 'none' : 'pdf'))}
          aria-pressed={maximizedPane === 'pdf'}
          aria-label={
            maximizedPane === 'pdf' ? 'Restore split layout' : 'Maximize preview pane'
          }
          title={
            maximizedPane === 'pdf' ? 'Restore split layout' : 'Maximize preview pane'
          }
          className="absolute top-2 left-2 z-50 inline-flex h-7 w-7 items-center justify-center rounded border border-gray-200 bg-white/80 text-gray-500 shadow-sm transition-opacity hover:bg-white hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
        >
          {maximizedPane === 'pdf' ? (
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
        {rightPane}
      </div>

      {isDragging && (
        <div className="fixed inset-0 z-50 cursor-col-resize" />
      )}
    </div>
  );
}

export default ResizableSplitPane;
