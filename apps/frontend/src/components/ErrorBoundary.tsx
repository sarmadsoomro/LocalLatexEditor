import { Component, useState, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorDetailsProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  isExpanded: boolean;
  onToggle: () => void;
}

function ErrorDetails({ error, errorInfo, isExpanded, onToggle }: ErrorDetailsProps) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="mt-6">
      <button
        onClick={onToggle}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className={`w-4 h-4 mr-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {isExpanded ? 'Hide' : 'Show'} error details
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200 overflow-auto max-h-64">
          <div className="text-sm font-mono">
            <p className="text-red-600 font-semibold mb-2">{error.name}: {error.message}</p>
            {errorInfo?.componentStack && (
              <div className="text-gray-600">
                <p className="font-medium text-gray-700 mb-1">Component Stack:</p>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {errorInfo.componentStack}
                </pre>
              </div>
            )}
            {error.stack && (
              <div className="text-gray-600 mt-3">
                <p className="font-medium text-gray-700 mb-1">Stack Trace:</p>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    const { onReset } = this.props;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    onReset?.();
  };

  render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}

function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-lg w-full">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-500 text-center mb-6">
          An unexpected error occurred. Please try again or refresh the page.
        </p>

        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 text-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {error.name}
            </span>
          </div>
        )}

        <div className="flex justify-center space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
        </div>

        <ErrorDetails
          error={error}
          errorInfo={errorInfo}
          isExpanded={showDetails}
          onToggle={() => setShowDetails(!showDetails)}
        />
      </div>
    </div>
  );
}

export default ErrorBoundary;