import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SPINNER_SIZES: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md' }: { size?: SpinnerSize }) {
  return (
    <div className={`loading-spinner flex items-center justify-center`}>
      <div
        className={`spinner ${SPINNER_SIZES[size]} border-2 border-gray-200 border-t-amber-500 rounded-full animate-spin`}
      ></div>
    </div>
  );
}

/**
 * Loading Skeleton Component
 */
export function LoadingSkeleton() {
  return (
    <div className="loading-skeleton p-4 bg-white rounded-xl border border-gray-200">
      <div className="skeleton-header h-4 bg-gray-200 rounded w-1/3 mb-3 animate-pulse"></div>
      <div className="skeleton-body space-y-2">
        <div className="skeleton-line h-3 bg-gray-200 rounded w-full animate-pulse"></div>
        <div className="skeleton-line h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
        <div className="skeleton-line h-3 bg-gray-200 rounded w-4/6 animate-pulse"></div>
      </div>
    </div>
  );
}

/**
 * Error Boundary Component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary p-6 bg-red-50 rounded-xl border border-red-200 text-center">
          <div className="error-icon text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-bold text-red-900 mb-2">오류가 발생했습니다</h2>
          {this.state.error && (
            <p className="text-sm text-red-700 mb-4 font-mono bg-red-100 p-2 rounded">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Tool Loading State Component
 */
export function ToolLoadingState({ toolName }: { toolName: string }) {
  return (
    <div className="tool-loading flex flex-col items-center justify-center p-8 text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-gray-600">{toolName} 도구를 불러오는 중...</p>
    </div>
  );
}

/**
 * Tool Error State Component
 */
export function ToolErrorState({
  toolName,
  error,
  onRetry,
}: {
  toolName: string;
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="tool-error p-6 bg-red-50 rounded-xl border border-red-200 text-center">
      <div className="error-icon text-4xl mb-3">❌</div>
      <h2 className="text-lg font-bold text-red-900 mb-2">{toolName} 도구 오류</h2>
      <p className="text-sm text-red-700 mb-4 bg-red-100 p-2 rounded font-mono">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        다시 시도
      </button>
    </div>
  );
}

/**
 * Empty State Component
 */
export function EmptyState({
  icon = '🔧',
  title = '도구를 선택하세요',
  description = '왼쪽 메뉴에서 사용할 도구를 선택하세요.',
}: {
  icon?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mt-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

/**
 * Inline Loading Dots Component
 */
export function LoadingDots({ size = 'md' }: { size?: SpinnerSize }) {
  const dotClass = size === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  return (
    <div className="inline-flex items-center gap-1">
      <span className={`${dotClass} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
      <span className={`${dotClass} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
      <span className={`${dotClass} bg-gray-400 rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
    </div>
  );
}
