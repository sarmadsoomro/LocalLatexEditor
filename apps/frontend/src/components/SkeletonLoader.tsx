import { cn } from '../utils/cn';

export interface SkeletonLoaderProps {
  /**
   * Type of skeleton to render
   */
  type: 'text' | 'card' | 'fileItem' | 'editor';
  /**
   * Number of skeleton items to render (for text and fileItem types)
   * @default 1
   */
  count?: number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

interface TextSkeletonProps {
  lines?: number;
  className?: string;
}

function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-gray-200 rounded animate-pulse',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-sm border border-gray-200 p-6',
        className
      )}
    >
      <div className="animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
          <div className="w-5 h-5 bg-gray-200 rounded" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 rounded w-16" />
            <div className="h-4 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-4 bg-gray-200 rounded w-20" />
        </div>
        <div className="mt-3 h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

function FileItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('py-1 px-2', className)}>
      <div className="animate-pulse flex items-center">
        <div className="w-4 h-4 bg-gray-200 rounded mr-1" />
        <div className="w-5 h-5 bg-gray-200 rounded mr-2" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

function EditorSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('h-full flex flex-col', className)}>
      <div className="animate-pulse flex-1 p-4 space-y-3">
        <div className="flex space-x-2">
          <div className="h-4 bg-gray-200 rounded w-8" />
          <div className="h-4 bg-gray-200 rounded w-16" />
          <div className="h-4 bg-gray-200 rounded w-12" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/5" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="mt-4 h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader components for content placeholders.
 * Displays animated placeholder content while data is loading.
 *
 * @example
 * // Text skeleton with multiple lines
 * <SkeletonLoader type="text" count={3} />
 *
 * @example
 * // Card skeleton for project cards
 * <SkeletonLoader type="card" />
 *
 * @example
 * // File item skeleton for file tree
 * <SkeletonLoader type="fileItem" count={5} />
 *
 * @example
 * // Editor skeleton for Monaco editor placeholder
 * <SkeletonLoader type="editor" />
 */
export function SkeletonLoader({
  type,
  count = 1,
  className,
}: SkeletonLoaderProps) {
  if (type === 'text') {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <TextSkeleton key={i} lines={3} className={i > 0 ? 'mt-4' : ''} />
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={cn('grid gap-6', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'fileItem') {
    return (
      <div className={cn('py-2 space-y-1', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <FileItemSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'editor') {
    return <EditorSkeleton className={className} />;
  }

  return null;
}

/**
 * Shimmer effect variant of skeleton loader with a more polished animation.
 * Uses a gradient animation instead of simple pulse.
 *
 * @example
 * // Shimmer text lines
 * <ShimmerSkeleton type="text" count={3} />
 */
export function ShimmerSkeleton({
  type,
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const shimmerBase = 'relative overflow-hidden bg-gray-200';
  const shimmerEffect = 'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent';

  if (type === 'text') {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="space-y-2">
            {Array.from({ length: 3 }).map((_, j) => (
              <div
                key={j}
                className={cn(
                  shimmerBase,
                  shimmerEffect,
                  'h-4 rounded',
                  j === 2 ? 'w-3/4' : 'w-full'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className={cn('grid gap-6', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className={cn(shimmerBase, shimmerEffect, 'h-5 rounded w-3/4 mb-2')} />
                <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-1/2')} />
              </div>
              <div className={cn(shimmerBase, shimmerEffect, 'w-5 h-5 rounded')} />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-16')} />
                <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-12')} />
              </div>
              <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-20')} />
            </div>
            <div className={cn(shimmerBase, shimmerEffect, 'mt-3 h-3 rounded w-1/3')} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'fileItem') {
    return (
      <div className={cn('py-2 space-y-1', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="py-1 px-2 flex items-center">
            <div className={cn(shimmerBase, shimmerEffect, 'w-4 h-4 rounded mr-1')} />
            <div className={cn(shimmerBase, shimmerEffect, 'w-5 h-5 rounded mr-2')} />
            <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-24')} />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'editor') {
    return (
      <div className={cn('h-full flex flex-col p-4 space-y-3', className)}>
        <div className="flex space-x-2">
          <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-8')} />
          <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-16')} />
          <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-12')} />
        </div>
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-full')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-5/6')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-4/5')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-full')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-3/4')} />
        <div className={cn(shimmerBase, shimmerEffect, 'mt-4 h-4 rounded w-1/2')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-full')} />
        <div className={cn(shimmerBase, shimmerEffect, 'h-4 rounded w-2/3')} />
      </div>
    );
  }

  return null;
}