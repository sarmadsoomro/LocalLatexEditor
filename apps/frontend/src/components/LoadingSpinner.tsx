import { cn } from '../utils/cn';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Color variant of the spinner
   * @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'white';
  /**
   * Optional text label displayed below the spinner
   */
  text?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
};

const colorClasses = {
  primary: 'border-blue-200 border-t-blue-600',
  secondary: 'border-gray-200 border-t-gray-600',
  white: 'border-white/30 border-t-white',
};

const textSizeClasses = {
  sm: 'text-xs mt-1',
  md: 'text-sm mt-2',
  lg: 'text-base mt-3',
};

const textColorClasses = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
};

/**
 * A simple spinning loader component with configurable size and color.
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // With text label
 * <LoadingSpinner text="Loading projects..." />
 *
 * @example
 * // Small white spinner for dark backgrounds
 * <LoadingSpinner size="sm" color="white" />
 */
export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  text,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center', className)}
      role="status"
      aria-label={text || 'Loading'}
    >
      <div
        className={cn(
          'animate-spin rounded-full',
          sizeClasses[size],
          colorClasses[color]
        )}
        aria-hidden="true"
      />
      {text && (
        <span
          className={cn(
            'font-medium',
            textSizeClasses[size],
            textColorClasses[color]
          )}
        >
          {text}
        </span>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
}

/**
 * Inline spinner for use within text or buttons.
 * Renders a small spinner without the wrapper div.
 */
export function InlineSpinner({
  size = 'sm',
  color = 'primary',
  className,
}: Omit<LoadingSpinnerProps, 'text'>) {
  return (
    <span
      className={cn(
        'inline-flex items-center',
        'animate-spin rounded-full',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}