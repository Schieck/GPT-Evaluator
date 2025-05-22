import { ValidationError } from '../utils/ValidationError';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  API = 'api',
  UI = 'ui',
  STORAGE = 'storage',
  UNKNOWN = 'unknown'
}

export interface ErrorDetails {
  message: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: string;
  timestamp: number;
  stack?: string;
  metadata?: Record<string, unknown>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly severity: ErrorSeverity,
    public readonly category: ErrorCategory,
    public readonly code?: string,
    public readonly metadata?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: ErrorDetails[] = [];
  private readonly isDevelopment = window?.location.hostname === 'localhost' || window?.location.hostname === '127.0.0.1';
  private readonly MAX_ERROR_LOG_SIZE = 1000;
  private errorListeners: ((error: ErrorDetails) => void)[] = [];

  private constructor() {
    window?.addEventListener('error', this.handleGlobalError.bind(this));
    window?.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  private handleGlobalError(event: ErrorEvent): void {
    this.handleError(event.error, 'Global', {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.HIGH
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.handleError(event.reason, 'UnhandledRejection', {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.HIGH
    });
  }

  public handleError(
    error: unknown,
    context: string,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      code?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    const errorDetails = this.createErrorDetails(error, context, options);
    this.logError(errorDetails);
    this.notifyListeners(errorDetails);
  }

  private createErrorDetails(
    error: unknown,
    context: string,
    options: {
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      code?: string;
      metadata?: Record<string, unknown>;
    }
  ): ErrorDetails {
    let message: string;
    let category = options.category || ErrorCategory.UNKNOWN;
    let severity = options.severity || ErrorSeverity.MEDIUM;
    let stack: string | undefined;

    if (error instanceof ValidationError) {
      message = error.message;
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.LOW;
    } else if (error instanceof AppError) {
      message = error.message;
      category = error.category;
      severity = error.severity;
      stack = error.stack;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
    } else {
      message = 'An unknown error occurred';
    }

    return {
      message,
      code: options.code,
      severity,
      category,
      context,
      timestamp: Date.now(),
      stack,
      metadata: options.metadata
    };
  }

  private logError(errorDetails: ErrorDetails): void {
    this.errorLog.unshift(errorDetails);
    
    // Maintain log size limit
    if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
      this.errorLog = this.errorLog.slice(0, this.MAX_ERROR_LOG_SIZE);
    }

    // Log to console in development
    if (this.isDevelopment) {
      console.error(`[${errorDetails.context}] Error:`, {
        message: errorDetails.message,
        category: errorDetails.category,
        severity: errorDetails.severity,
        stack: errorDetails.stack,
        metadata: errorDetails.metadata
      });
    }
  }

  private notifyListeners(errorDetails: ErrorDetails): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorDetails);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  public getUserFriendlyMessage(error: unknown): string {
    if (error instanceof ValidationError) {
      return error.message;
    }
    
    if (error instanceof AppError) {
      return error.message;
    }
    
    if (error instanceof Error) {
      return 'An unexpected error occurred. Please try again.';
    }
    
    return 'An unknown error occurred. Please try again.';
  }

  public addErrorListener(listener: (error: ErrorDetails) => void): () => void {
    this.errorListeners.push(listener);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== listener);
    };
  }

  public getErrorLog(): ErrorDetails[] {
    return [...this.errorLog];
  }

  public getRecentErrors(minutes: number = 5): ErrorDetails[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.errorLog.filter(entry => entry.timestamp >= cutoffTime);
  }

  public getErrorsBySeverity(severity: ErrorSeverity): ErrorDetails[] {
    return this.errorLog.filter(entry => entry.severity === severity);
  }

  public getErrorsByCategory(category: ErrorCategory): ErrorDetails[] {
    return this.errorLog.filter(entry => entry.category === category);
  }

  public clearErrorLog(): void {
    this.errorLog = [];
  }
} 