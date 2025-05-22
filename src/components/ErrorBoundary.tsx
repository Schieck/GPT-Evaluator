import React from 'react';
import { ErrorHandlingService, ErrorSeverity, ErrorCategory } from '../services/ErrorHandlingService';
import type { ErrorDetails } from '../services/ErrorHandlingService';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: ErrorDetails) => void;
}

interface State {
    hasError: boolean;
    error: ErrorDetails | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    private errorService: ErrorHandlingService;

    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
        this.errorService = ErrorHandlingService.getInstance();
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error: {
                message: error.message,
                severity: ErrorSeverity.HIGH,
                category: ErrorCategory.UI,
                context: 'ErrorBoundary',
                timestamp: Date.now(),
                stack: error.stack
            }
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.errorService.handleError(error, 'ErrorBoundary', {
            category: ErrorCategory.UI,
            severity: ErrorSeverity.HIGH,
            metadata: {
                componentStack: errorInfo.componentStack
            }
        });

        if (this.props.onError && this.state.error) {
            this.props.onError(this.state.error);
        }
    }

    private handleRetry = (): void => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="text-red-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-medium text-white">Something went wrong</h3>
                            <p className="mt-2 text-sm text-red-400">{this.state.error?.message}</p>
                        </div>
                        <button
                            onClick={this.handleRetry}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
} 