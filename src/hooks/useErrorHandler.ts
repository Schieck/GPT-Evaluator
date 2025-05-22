import { useCallback } from 'react';
import { ErrorHandlingService, ErrorCategory, ErrorSeverity, type ErrorDetails } from '../services/ErrorHandlingService';

interface UseErrorHandlerOptions {
  context: string;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  onError?: (error: ErrorDetails) => void;
}

export function useErrorHandler(options: UseErrorHandlerOptions) {
  const errorService = ErrorHandlingService.getInstance();

  const handleError = useCallback((error: unknown, additionalContext?: string) => {
    const context = additionalContext 
      ? `${options.context}.${additionalContext}`
      : options.context;

    errorService.handleError(error, context, {
      category: options.category,
      severity: options.severity
    });

    if (options.onError) {
      const errorDetails = errorService.getRecentErrors(1)[0];
      if (errorDetails) {
        options.onError(errorDetails);
      }
    }
  }, [options.context, options.category, options.severity, options.onError]);

  const handleAsyncError = useCallback(async <T>(
    promise: Promise<T>,
    additionalContext?: string
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, additionalContext);
      return null;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError
  };
} 