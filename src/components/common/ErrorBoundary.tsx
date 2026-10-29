import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    try {
      this.setState({ hasError: false, error: null });
      window.location.hash = '';
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    try {
      window.location.hash = '#/home';
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 text-3xl">
              🥭
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {this.props.fallbackTitle || 'Top Fruit & Veg'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">Brixton Market Pitch 18 • London SW9</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs text-slate-600 font-mono overflow-auto max-h-32">
              {this.state.error?.message || 'A temporary display error occurred. Please refresh to restore.'}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Refresh Page
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
              >
                Go to Storefront
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
