/**
 * @fileoverview Screen Reader Announcement Service
 *
 * Provides enhanced screen reader support for dynamic content and form interactions
 * using ARIA live regions and polite/assertive announcements.
 */

import { IS_BROWSER } from "../utils/constants.ts";
import { createLogger } from "../utils/logger.ts";
import { createMessageGetter } from "../utils/messages.ts";
import { defaultMessages } from "../config/defaultMessages";

const logger = createLogger("ScreenReader");

/**
 * Announcement options interface
 */
export interface AnnouncementOptions {
  /** Announcement type determining the live region used */
  type?: 'status' | 'alert' | 'form' | 'validation';
  /** How long to keep the announcement in the DOM (milliseconds) */
  duration?: number;
  /** Whether to clear previous announcements in the same region */
  clearPrevious?: boolean;
  /** Override the default region ID */
  regionId?: string | null;
}

/**
 * Form errors object interface
 */
export interface FormErrors {
  /** Field name as key, error message as value */
  [fieldName: string]: string;
}

/**
 * Form status options interface
 */
export interface FormStatusOptions {
  /** Custom error message for 'error' status */
  errorMessage?: string;
  /** Custom message strings to override defaults */
  messages?: Record<string, string>;
}

/**
 * Form errors announcement options interface
 */
export interface FormErrorsOptions {
  /** Custom message strings to override defaults */
  messages?: Record<string, string>;
}

/**
 * Cleanup function type returned by announcement functions
 */
export type CleanupFunction = () => void;

/**
 * Active announcement tracking interface
 */
interface AnnouncementInfo {
  /** Region ID where the announcement is located */
  regionId: string;
  /** Cleanup function to remove the announcement */
  cleanup: CleanupFunction;
}

/**
 * Constants for configuration
 */
const ANNOUNCEMENT_DURATION = 5000; // Time announcements remain in the DOM (ms)

/**
 * ARIA live region identifiers
 */
const REGIONS = {
  STATUS: "status-region",        // For general status updates (aria-live="polite")
  ALERT: "alert-region",          // For important alerts (aria-live="assertive")
  FORM_STATUS: "form-status-region", // For form-specific status updates
  VALIDATION: "validation-region",   // For form validation feedback
} as const;

/**
 * Track active announcements for cleanup
 */
const activeAnnouncements = new Map<string, AnnouncementInfo>();

/**
 * Initialize screen reader regions in the DOM
 * This ensures all required ARIA live regions exist for announcements
 *
 * @example
 * ```typescript
 * // Call once during app initialization
 * initializeScreenReaderRegions();
 * console.log('Screen reader regions are ready');
 * ```
 */
export function initializeScreenReaderRegions(): void {
  if (!IS_BROWSER) return;

  try {
    // Create regions that don't already exist
    Object.values(REGIONS).forEach((regionId) => {
      if (!document.getElementById(regionId)) {
        const region = document.createElement("div");
        region.id = regionId;
        region.className = "sr-only screen-reader-region";
        region.setAttribute("aria-atomic", "true");

        // Set appropriate live region properties based on type
        if (regionId === REGIONS.ALERT) {
          region.setAttribute("aria-live", "assertive");
          region.setAttribute("role", "alert");
        } else if (regionId === REGIONS.VALIDATION) {
          region.setAttribute("aria-live", "assertive");
          region.setAttribute("role", "alert");
        } else {
          region.setAttribute("aria-live", "polite");
          region.setAttribute("role", "status");
        }

        document.body.appendChild(region);
      }
    });

    // Add global CSS for screen reader regions if not already present
    const styleId = "screen-reader-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (error) {
    logger.error("Failed to initialize screen reader regions:", error);
  }
}

/**
 * Announce a message to screen readers using ARIA live regions
 * Automatically manages cleanup and provides different announcement types
 *
 * @param {string} message - The message to announce
 * @param {AnnouncementOptions} [options] - Configuration options for the announcement
 * @returns {CleanupFunction} Function to manually clean up the announcement
 *
 * @example
 * ```typescript
 * // Basic status announcement
 * const cleanup = announce('Form saved successfully');
 *
 * // Alert announcement with custom duration
 * announce('Error: Please fix the required fields', {
 *   type: 'alert',
 *   duration: 8000
 * });
 *
 * // Manual cleanup if needed
 * cleanup();
 * ```
 */
export function announce(
  message: string,
  {
    type = "status",
    duration = ANNOUNCEMENT_DURATION,
    clearPrevious = true,
    regionId = null,
  }: AnnouncementOptions = {},
): CleanupFunction {
  if (!IS_BROWSER || !message) return () => {};

  try {
    // Determine which region to use
    let targetRegionId: string;
    switch (type) {
      case "alert":
        targetRegionId = REGIONS.ALERT;
        break;
      case "form":
        targetRegionId = REGIONS.FORM_STATUS;
        break;
      case "validation":
        targetRegionId = REGIONS.VALIDATION;
        break;
      case "status":
      default:
        targetRegionId = REGIONS.STATUS;
    }

    // Allow override of region ID
    if (regionId) {
      targetRegionId = regionId;
    }

    // Get or initialize the region
    initializeScreenReaderRegions();
    const region = document.getElementById(targetRegionId);

    if (!region) {
      logger.error(`Screen reader region "${targetRegionId}" not found`);
      return () => {};
    }

    // Create a unique ID for this announcement
    const announcementId = `announcement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Clear previous announcements in this region if requested
    if (clearPrevious) {
      const previousIds: string[] = [];
      activeAnnouncements.forEach((info, id) => {
        if (info.regionId === targetRegionId) {
          previousIds.push(id);
        }
      });

      previousIds.forEach((id) => {
        const cleanup = activeAnnouncements.get(id)?.cleanup;
        if (typeof cleanup === "function") {
          cleanup();
        }
        activeAnnouncements.delete(id);
      });
    }

    // Create announcement element
    const announcement = document.createElement("div");
    announcement.id = announcementId;
    announcement.textContent = message;

    // Add to the DOM
    region.appendChild(announcement);

    // Set timeout to remove the announcement
    const timeoutId = setTimeout(() => {
      if (document.getElementById(announcementId)) {
        announcement.remove();
      }
      activeAnnouncements.delete(announcementId);
    }, duration);

    // Store cleanup function
    const cleanup: CleanupFunction = () => {
      clearTimeout(timeoutId);
      if (document.getElementById(announcementId)) {
        announcement.remove();
      }
      activeAnnouncements.delete(announcementId);
    };

    // Track this announcement
    activeAnnouncements.set(announcementId, {
      regionId: targetRegionId,
      cleanup,
    });

    return cleanup;
  } catch (error) {
    logger.error("Failed to announce message:", error);
    return () => {};
  }
}

/**
 * Announce form validation errors to screen readers
 * Provides different messages for single vs multiple errors
 *
 * @param {FormErrors} errors - Form validation errors object
 * @param {FormErrorsOptions} [options] - Additional options for error announcement
 * @returns {CleanupFunction} Function to clean up the announcement
 *
 * @example
 * ```typescript
 * const errors = {
 *   email: 'Invalid email format',
 *   password: 'Password too short'
 * };
 *
 * const cleanup = announceFormErrors(errors, {
 *   messages: {
 *     formMultipleErrors: 'Custom multiple errors message'
 *   }
 * });
 * ```
 */
export function announceFormErrors(errors: FormErrors, { messages = {} }: FormErrorsOptions = {}): CleanupFunction {
  if (!IS_BROWSER || !errors || Object.keys(errors).length === 0)
    return () => {};

  const getMessage = createMessageGetter({ ...defaultMessages, ...messages });
  const errorCount = Object.keys(errors).length;

  let message: string;
  if (errorCount === 1) {
    const fieldName = Object.keys(errors)[0];
    const errorMessage = errors[fieldName];
    message = getMessage(
      "formSingleError",
      `Form has 1 error: ${fieldName} - ${errorMessage}`,
    );
  } else {
    message = getMessage(
      "formMultipleErrors",
      `Form has ${errorCount} errors. Please review and correct the highlighted fields.`,
    );
  }

  return announce(message, { type: "validation" });
}

/**
 * Announce form submission status to screen readers
 * Handles different status types with appropriate messaging and urgency
 *
 * @param {string} status - The status: 'submitting', 'success', 'error'
 * @param {FormStatusOptions} [options] - Additional options for status announcement
 * @returns {CleanupFunction} Function to clean up the announcement
 *
 * @example
 * ```typescript
 * // Announce form submission start
 * announceFormStatus('submitting');
 *
 * // Announce success
 * announceFormStatus('success');
 *
 * // Announce error with custom message
 * announceFormStatus('error', {
 *   errorMessage: 'Network connection failed. Please try again.'
 * });
 * ```
 */
export function announceFormStatus(
  status: string,
  { errorMessage = "", messages = {} }: FormStatusOptions = {},
): CleanupFunction {
  if (!IS_BROWSER) return () => {};

  const getMessage = createMessageGetter({ ...defaultMessages, ...messages });

  let message: string;
  let type: AnnouncementOptions['type'] = "form";

  switch (status) {
    case "submitting":
      message = getMessage(
        "formSubmitting",
        "Submitting your form. Please wait...",
      );
      break;
    case "success":
      message = getMessage("formSuccess", "Form submitted successfully!");
      break;
    case "error":
      message =
        errorMessage ||
        getMessage("formError", "Error submitting form. Please try again.");
      type = "alert";
      break;
    default:
      message = status; // Use the status as the message if not recognized
  }

  return announce(message, { type });
}

/**
 * Announce a field-specific validation message
 * Provides immediate feedback for individual field validation
 *
 * @param {string} fieldName - The name of the field being validated
 * @param {string} validationMessage - The validation message to announce
 * @param {boolean} [isValid=false] - Whether the field is valid or invalid
 * @returns {CleanupFunction} Function to clean up the announcement
 *
 * @example
 * ```typescript
 * // Announce field error
 * announceFieldValidation(
 *   'email',
 *   'Please enter a valid email address',
 *   false
 * );
 *
 * // Announce field success
 * announceFieldValidation('email', '', true);
 * ```
 */
export function announceFieldValidation(
  fieldName: string,
  validationMessage: string,
  isValid: boolean = false,
): CleanupFunction {
  if (!IS_BROWSER || !fieldName) return () => {};

  const message = isValid
    ? `${fieldName}: Valid input`
    : `${fieldName}: ${validationMessage}`;

  return announce(message, {
    type: "validation",
    duration: 3000,
    clearPrevious: true,
  });
}

/**
 * Clean up all active screen reader announcements
 * Useful for component unmounting or app cleanup
 *
 * @example
 * ```typescript
 * // Clean up all announcements when component unmounts
 * cleanupAllAnnouncements();
 * console.log('All screen reader announcements cleared');
 * ```
 */
export function cleanupAllAnnouncements(): void {
  if (!IS_BROWSER) return;

  // Clear all active announcements
  activeAnnouncements.forEach(({ cleanup }) => {
    if (typeof cleanup === "function") {
      cleanup();
    }
  });

  activeAnnouncements.clear();
}

/**
 * Clean up screen reader regions when unmounting application
 * Removes all ARIA live regions and clears announcements
 *
 * @example
 * ```typescript
 * // Clean up when app is destroyed
 * cleanupScreenReaderRegions();
 * console.log('Screen reader regions removed');
 * ```
 */
export function cleanupScreenReaderRegions(): void {
  if (!IS_BROWSER) return;

  // Clear all announcements first
  cleanupAllAnnouncements();

  // Remove regions
  Object.values(REGIONS).forEach((regionId) => {
    const region = document.getElementById(regionId);
    if (region) {
      region.remove();
    }
  });
}

/**
 * Check if screen reader regions are properly initialized
 * Useful for debugging or conditional initialization
 *
 * @returns {boolean} True if all required regions exist in the DOM
 *
 * @example
 * ```typescript
 * if (!areScreenReaderRegionsInitialized()) {
 *   console.log('Initializing screen reader regions...');
 *   initializeScreenReaderRegions();
 * }
 * ```
 */
export function areScreenReaderRegionsInitialized(): boolean {
  if (!IS_BROWSER) return false;

  return Object.values(REGIONS).every(regionId =>
    document.getElementById(regionId) !== null
  );
}

/**
 * Get the current number of active announcements
 * Useful for debugging or monitoring announcement usage
 *
 * @returns {number} Number of currently active announcements
 *
 * @example
 * ```typescript
 * const count = getActiveAnnouncementCount();
 * console.log(`Currently ${count} active announcements`);
 * ```
 */
export function getActiveAnnouncementCount(): number {
  return activeAnnouncements.size;
}

/**
 * Type guard to check if an object is a valid FormErrors object
 *
 * @param {any} obj - Object to check
 * @returns {obj is FormErrors} True if object is valid FormErrors
 *
 * @example
 * ```typescript
 * const errors = getFormErrors();
 * if (isFormErrors(errors)) {
 *   announceFormErrors(errors);
 * }
 * ```
 */
export function isFormErrors(obj: any): obj is FormErrors {
  return (
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.values(obj).every(value => typeof value === 'string')
  );
}

/**
 * Create a reusable announcer function with preset options
 * Useful for creating specialized announcers for different parts of the app
 *
 * @param {Partial<AnnouncementOptions>} defaultOptions - Default options for all announcements
 * @returns {(message: string, options?: Partial<AnnouncementOptions>) => CleanupFunction} Configured announcer function
 *
 * @example
 * ```typescript
 * const alertAnnouncer = createAnnouncer({
 *   type: 'alert',
 *   duration: 10000,
 *   clearPrevious: true
 * });
 *
 * // Use the specialized announcer
 * alertAnnouncer('Critical error occurred!');
 * ```
 */
export function createAnnouncer(defaultOptions: Partial<AnnouncementOptions>) {
  return (message: string, options: Partial<AnnouncementOptions> = {}): CleanupFunction => {
    return announce(message, { ...defaultOptions, ...options });
  };
}