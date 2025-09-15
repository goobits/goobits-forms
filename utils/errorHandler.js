/**
 * Standardized error handling utilities
 */

import { createLogger } from "./logger.js";

const logger = createLogger("ErrorHandler");

/**
 * Error types for better error categorization
 */
export const ErrorTypes = {
  VALIDATION: "VALIDATION",
  NETWORK: "NETWORK",
  RATE_LIMIT: "RATE_LIMIT",
  RECAPTCHA: "RECAPTCHA",
  SERVER: "SERVER",
  UNKNOWN: "UNKNOWN",
};

/**
 * Standardized error class
 */
export class ContactFormError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, details = {}) {
    super(message);
    this.name = "ContactFormError";
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Create standardized error response
 * @param {Error|string} error - The error to handle
 * @param {string} type - Error type from ErrorTypes
 * @param {Object} details - Additional error details
 * @returns {Object} Standardized error object
 */
export function createErrorResponse(
  error,
  type = ErrorTypes.UNKNOWN,
  details = {},
) {
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
 * @param {Error|string} error - The error to handle
 * @param {string} context - Context where error occurred
 * @param {Object} metadata - Additional metadata
 * @returns {ContactFormError} Standardized error instance
 */
export function handleError(error, context, metadata = {}) {
  // Determine error type based on error content
  let errorType = ErrorTypes.UNKNOWN;
  const message = error instanceof Error ? error.message : String(error);

  // Categorize error
  if (message.includes("validation") || message.includes("invalid")) {
    errorType = ErrorTypes.VALIDATION;
  } else if (message.includes("network") || message.includes("fetch")) {
    errorType = ErrorTypes.NETWORK;
  } else if (message.includes("rate") || message.includes("429")) {
    errorType = ErrorTypes.RATE_LIMIT;
  } else if (message.includes("recaptcha") || message.includes("captcha")) {
    errorType = ErrorTypes.RECAPTCHA;
  } else if (message.includes("server") || message.includes("500")) {
    errorType = ErrorTypes.SERVER;
  }

  // Log error with context
  logger.error(`[${context}] ${message}`, { errorType, metadata });

  // Return standardized error
  return new ContactFormError(message, errorType, metadata);
}

/**
 * Extract user-friendly error message
 * @param {Error|Object} error - The error object
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(error) {
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

  // Fallback for non-standardized errors
  if (error?.message?.includes("rate")) {
    return "Too many requests. Please wait a moment and try again.";
  }

  return error?.message || "An unexpected error occurred.";
}
