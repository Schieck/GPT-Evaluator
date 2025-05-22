import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ErrorHandlingService } from './ErrorHandlingService';
import { ValidationError } from '../utils/ValidationError';

describe('ErrorHandlingService', () => {
  let service: ErrorHandlingService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    service = ErrorHandlingService.getInstance();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    service.clearErrorLog();
  });

  describe('getInstance', () => {
    test('returns singleton instance', () => {
      const instance1 = ErrorHandlingService.getInstance();
      const instance2 = ErrorHandlingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('handleError', () => {
    test('logs error to console in development', () => {
      const error = new Error('Test error');
      service.handleError(error, 'TestContext');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[TestContext] Error:', {
        message: error.message,
        category: 'unknown',
        severity: 'medium',
        stack: error.stack,
        metadata: undefined
      });
    });

    test('adds error to error log', () => {
      const error = new Error('Test error');
      service.handleError(error, 'TestContext');
      const log = service.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].context).toBe('TestContext');
      expect(log[0].message).toBe(error.message);
    });
  });

  describe('getUserFriendlyMessage', () => {
    test('returns validation error message', () => {
      const error = new ValidationError('Invalid input');
      expect(service.getUserFriendlyMessage(error)).toBe('Invalid input');
    });

    test('returns generic message for Error instances', () => {
      const error = new Error('Technical error');
      expect(service.getUserFriendlyMessage(error)).toBe('An unexpected error occurred. Please try again.');
    });

    test('returns generic message for unknown errors', () => {
      expect(service.getUserFriendlyMessage('Unknown error')).toBe('An unknown error occurred. Please try again.');
    });
  });

  describe('error log management', () => {
    test('getErrorLog returns copy of error log', () => {
      const error = new Error('Test error');
      service.handleError(error, 'TestContext');
      const log = service.getErrorLog();
      expect(log).toHaveLength(1);
      expect(log[0].context).toBe('TestContext');
      expect(log[0].message).toBe(error.message);
      service.handleError(new Error('Another error'), 'TestContext');
      expect(log).toHaveLength(1); // Original log should not be modified
    });

    test('clearErrorLog removes all errors', () => {
      service.handleError(new Error('Test error'), 'TestContext');
      service.handleError(new Error('Another error'), 'TestContext');
      expect(service.getErrorLog()).toHaveLength(2);
      service.clearErrorLog();
      expect(service.getErrorLog()).toHaveLength(0);
    });

    test('getRecentErrors returns only recent errors', () => {
      const oldError = new Error('Old error');
      const newError = new Error('New error');
      
      // Mock Date.now() to control timestamps
      const now = Date.now();
      vi.spyOn(Date, 'now')
        .mockReturnValueOnce(now - 10 * 60 * 1000) // 10 minutes ago
        .mockReturnValueOnce(now); // now
      
      service.handleError(oldError, 'TestContext');
      service.handleError(newError, 'TestContext');
      
      const recentErrors = service.getRecentErrors(5); // Last 5 minutes
      expect(recentErrors).toHaveLength(1);
      expect(recentErrors[0].message).toBe(newError.message);
    });
  });
}); 