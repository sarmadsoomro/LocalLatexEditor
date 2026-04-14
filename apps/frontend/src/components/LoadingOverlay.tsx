import { cn } from '../utils/cn';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingOverlayProps {
  /**
   * Whether the overlay is visible
   */
  isLoading: boolean;
  /**
   * Optional loading message to display
   */
  message?: string;
  /**
   * Content to render behind the overlay
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for the overlay
   */
  className?: string;
  /**
   * Size of the spinner
   * @default 'md'
   */
  spinnerSize?: 'sm' | 'md' | 'lg';
  /**
   * Whether to use a transparent backdrop
   * @default false
   */
  transparent?: boolean;
}

/**
 * A full-screen or container overlay that displays a loading spinner
 * and prevents interaction with content underneath.
 *
 * @example
 * // Basic usage
 * <LoadingOverlay isLoading={isSaving}>
 *   <form>...</form>
 * </LoadingOverlay>
 *
 * @example
 * // With custom message
 * <LoadingOverlay isLoading={isCompiling} message="Compiling LaTeX...">
 *   <Editor />
 * </LoadingOverlay>
 *
 * @example
 * // Transparent backdrop for subtle effect
 * <LoadingOverlay isLoading={isLoading} transparent>
 *   <Content />
 * </LoadingOverlay>
 */
export function LoadingOverlay({
  isLoading,
  message,
  children,
  className,
  spinnerSize = 'md',
  transparent = false,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 z-50 flex flex-col items-center justify-center',
            transparent
              ? 'bg-white/60'
              : 'bg-white/80 backdrop-blur-sm',
            className
          )}
          role="alert"
          aria-busy="true"
          aria-live="polite"
        >
          <LoadingSpinner size={spinnerSize} color="primary" />
          {message && (
            <p className="mt-3 text-sm font-medium text-gray-700">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A full-page loading overlay that covers the entire viewport.
 * Use this for app-level loading states like initial data fetching.
 *
 * @example
 * // Full page loading
 * <FullPageLoader isLoading={isInitializing} message="Loading application..." />
 */
export function FullPageLoader({
  isLoading,
  message,
  className,
}: Omit<LoadingOverlayProps, 'children' | 'spinnerSize' | 'transparent'>) {
  if (!isLoading) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center',
        'bg-white/90 backdrop-blur-sm',
        className
      )}
      role="alert"
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" color="primary" />
      {message && (
        <p className="mt-4 text-base font-medium text-gray-700">
          {message}
        </p>
      )}
    </div>
  );
}