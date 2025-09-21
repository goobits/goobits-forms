/**
 * Standardized error handling utilities
 *
 * This module provides comprehensive error handling capabilities including
 * error categorization, standardized error responses, and user-friendly
 * message extraction for form validation and API interactions.
 *
 * @module errorHandler
 * @example
 * ```typescript
 * import { ContactFormError, ErrorTypes, handleError } from './errorHandler';
 *
 * try {
 *   await submitForm(data);
 * } catch (error) {
 *   const handledError = handleError(error, 'FormSubmission');
 *   showToast(getUserFriendlyMessage(handledError));
 * }
 * ```
 */

import { createLogger } from "./logger.ts";

const logger = createLogger("ErrorHandler");

/**
 * Error types for better error categorization
 *
 * @description Defines standardized error categories to enable
 * consistent error handling and user messaging across the application.
 *
 * @example
 * ```typescript
 * if (error.type === ErrorTypes.VALIDATION) {
 *   // Handle validation errors differently
 *   highlightInvalidFields();
 * }
 * ```
 */
export const ErrorTypes = {
  /** Form validation errors (invalid input, missing required fields) */
  VALIDATION: "VALIDATION",
  /** Network connectivity or request failures */
  NETWORK: "NETWORK",
  /** Rate limiting errors (too many requests) */
  RATE_LIMIT: "RATE_LIMIT",
  /** reCAPTCHA verification failures */
  RECAPTCHA: "RECAPTCHA",
  /** Server-side errors (5xx status codes) */
  SERVER: "SERVER",
  /** Unclassified or unexpected errors */
  UNKNOWN: "UNKNOWN",
} as const;

/**
 * Type definition for error types
 */
export type ErrorType = typeof ErrorTypes[keyof typeof ErrorTypes];

/**
 * Additional error details interface
 */
export interface ErrorDetails {
  /** HTTP status code if applicable */
  statusCode?: number;
  /** Field-specific validation errors */
  fieldErrors?: Record<string, string>;
  /** Request/response metadata */
  metadata?: Record<string, unknown>;
  /** Stack trace or debug information */
  debug?: string;
}

/**
 * Standardized error response interface
 */
export interface ErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Error details object */
  error: {
    /** Human-readable error message */
    message: string;
    /** Categorized error type */
    type: ErrorType;
    /** Additional error context */
    details: ErrorDetails;
    /** ISO timestamp when error occurred */
    timestamp: string;
  };
}

/**
 * Standardized error class
 *
 * @description Custom error class that extends the native Error with
 * additional categorization and context information.
 *
 * @example
 * ```typescript
 * throw new ContactFormError(
 *   'Email is required',
 *   ErrorTypes.VALIDATION,
 *   { fieldErrors: { email: 'This field is required' } }
 * );
 * ```
 */
export class ContactFormError extends Error {
  /** Error category type */
  public readonly type: ErrorType;
  /** Additional error context */
  public readonly details: ErrorDetails;
  /** ISO timestamp when error was created */
  public readonly timestamp: string;

  /**
   * Creates a new ContactFormError instance
   *
   * @param message - Human-readable error message
   * @param type - Error category from ErrorTypes
   * @param details - Additional error context and metadata
   */
  constructor(
    message: string,
    type: ErrorType = ErrorTypes.UNKNOWN,
    details: ErrorDetails = {}
  ) {
    super(message);
    this.name = "ContactFormError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ContactFormError.prototype);
  }
}

/**
 * Create standardized error response
 *
 * @description Converts any error into a consistent response format
 * suitable for API responses or client-side error handling.
 *
 * @param error - The error to handle (Error instance or string)
 * @param type - Error type from ErrorTypes
 * @param details - Additional error details and context
 * @returns Standardized error response object
 *
 * @example
 * ```typescript
 * const response = createErrorResponse(
 *   new Error('Network timeout'),
 *   ErrorTypes.NETWORK,
 *   { statusCode: 408 }
 * );
 * // Returns: { success: false, error: { message, type, details, timestamp } }
 * ```
 */
export function createErrorResponse(
  error: Error | string,
  type: ErrorType = ErrorTypes.UNKNOWN,
  details: ErrorDetails = {}
): ErrorResponse {
  const message = error instanceof Error ? error.message : String(error);

  return {
    success: false,
    error: {
      message,
      type,
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Handle and log errors consistently
 *
 * @description Provides centralized error processing with automatic
 * categorization, logging, and standardized error instance creation.
 *
 * @param error - The error to handle (Error instance or string)
 * @param context - Context where error occurred (function name, component, etc.)
 * @param metadata - Additional metadata to include with error
 * @returns Standardized ContactFormError instance
 *
 * @example
 * ```typescript
 * try {
 *   await apiCall();
 * } catch (error) {
 *   const handled = handleError(error, 'FormSubmission', { userId: 123 });
 *   return createErrorResponse(handled, handled.type, handled.details);
 * }
 * ```
 */
export function handleError(
  error: Error | string,
  context: string,
  metadata: Record<string, unknown> = {}
): ContactFormError {
  // Determine error type based on error content
  let errorType: ErrorType = ErrorTypes.UNKNOWN;
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Categorize error based on message content
  if (lowerMessage.includes("validation") || lowerMessage.includes("invalid")) {
    errorType = ErrorTypes.VALIDATION;
  } else if (lowerMessage.includes("network") || lowerMessage.includes("fetch")) {
    errorType = ErrorTypes.NETWORK;
  } else if (lowerMessage.includes("rate") || lowerMessage.includes("429")) {
    errorType = ErrorTypes.RATE_LIMIT;
  } else if (lowerMessage.includes("recaptcha") || lowerMessage.includes("captcha")) {
    errorType = ErrorTypes.RECAPTCHA;
  } else if (lowerMessage.includes("server") || lowerMessage.includes("500")) {
    errorType = ErrorTypes.SERVER;
  }

  // Extract additional details from Error instance
  const details: ErrorDetails = {
    metadata,
    ...(error instanceof Error && error.stack && { debug: error.stack }),
  };

  // Log error with context
  logger.error(`[${context}] ${message}`, { errorType, metadata });

  // Return standardized error
  return new ContactFormError(message, errorType, details);
}

/**
 * Extract user-friendly error message
 *
 * @description Converts technical error messages into user-friendly
 * messages appropriate for display in UI components.
 *
 * @param error - The error object (ContactFormError, Error, or generic object)
 * @returns User-friendly error message suitable for display
 *
 * @example
 * ```typescript
 * const userMessage = getUserFriendlyMessage(error);
 * showNotification(userMessage, 'error');
 * ```
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ContactFormError) {
    switch (error.type) {
      case ErrorTypes.VALIDATION:
        return "Please check the form for errors and try again.";
      case ErrorTypes.NETWORK:
        return "Network error. Please check your connection and try again.";
      case ErrorTypes.RATE_LIMIT:
        return "Too many requests. Please wait a moment and try again.";
      case ErrorTypes.RECAPTCHA:
        return "Security verification failed. Please try again.";
      case ErrorTypes.SERVER:
        return "Server error. Please try again later.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  // Handle generic Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate") || message.includes("429")) {
      return "Too many requests. Please wait a moment and try again.";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "Network error. Please check your connection and try again.";
    }
  }

  // Fallback for objects with message property
  const errorObj = error as { message?: string };
  if (errorObj?.message?.includes("rate")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return errorObj?.message || "An unexpected error occurred.";
}