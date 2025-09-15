/**
 * Screen Reader Announcement Service
 *
 * Provides enhanced screen reader support for dynamic content and form interactions
 */

import { IS_BROWSER } from "../utils/constants.js";
import { createLogger } from "../utils/logger.js";
import { createMessageGetter } from "../utils/messages.js";
import { defaultMessages } from "../config/defaultMessages.js";

const logger = createLogger("ScreenReader");

// Constants
const ANNOUNCEMENT_DURATION = 5000; // Time announcements remain in the DOM (ms)
const REGIONS = {
  STATUS: "status-region", // For general status updates (aria-live="polite")
  ALERT: "alert-region", // For important alerts (aria-live="assertive")
  FORM_STATUS: "form-status-region", // For form-specific status updates
  VALIDATION: "validation-region", // For form validation feedback
};

// Track active announcements for cleanup
const activeAnnouncements = new Map();

/**
 * Initialize screen reader regions in the DOM
 * This ensures all required ARIA live regions exist
 */
export function initializeScreenReaderRegions() {
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
 * Announce a message to screen readers
 *
 * @param {string} message - The message to announce
 * @param {Object} options - Configuration options
 * @param {string} options.type - Announcement type: 'status', 'alert', 'form', 'validation'
 * @param {number} options.duration - How long to keep in the DOM (ms)
 * @param {boolean} options.clearPrevious - Whether to clear previous announcements
 * @param {string} options.regionId - Override the default region ID
 * @returns {Function} Cleanup function
 */
export function announce(
  message,
  {
    type = "status",
    duration = ANNOUNCEMENT_DURATION,
    clearPrevious = true,
    regionId = null,
  } = {},
) {
  if (!IS_BROWSER || !message) return () => {};

  try {
    // Determine which region to use
    let targetRegionId;
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
      const previousIds = [];
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
    const cleanup = () => {
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
 * Form-specific screen reader announcements
 */

/**
 * Announce form validation errors
 *
 * @param {Object} errors - Form validation errors object
 * @param {Object} options - Additional options
 * @param {Object} options.messages - Custom message strings
 * @returns {Function} Cleanup function
 */
export function announceFormErrors(errors, { messages = {} } = {}) {
  if (!IS_BROWSER || !errors || Object.keys(errors).length === 0)
    return () => {};

  const getMessage = createMessageGetter({ ...defaultMessages, ...messages });
  const errorCount = Object.keys(errors).length;

  let message;
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
 * Announce form submission status
 *
 * @param {string} status - The status: 'submitting', 'success', 'error'
 * @param {Object} options - Additional options
 * @param {string} options.errorMessage - Custom error message (for error status)
 * @param {Object} options.messages - Custom message strings
 * @returns {Function} Cleanup function
 */
export function announceFormStatus(
  status,
  { errorMessage = "", messages = {} } = {},
) {
  if (!IS_BROWSER) return () => {};

  const getMessage = createMessageGetter({ ...defaultMessages, ...messages });

  let message;
  let type = "form";

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
 *
 * @param {string} fieldName - The name of the field
 * @param {string} validationMessage - The validation message
 * @param {boolean} isValid - Whether the field is valid
 * @returns {Function} Cleanup function
 */
export function announceFieldValidation(
  fieldName,
  validationMessage,
  isValid = false,
) {
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
 * Clean up all screen reader announcements
 */
export function cleanupAllAnnouncements() {
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
 * Clean up screen reader regions when unmounting
 */
export function cleanupScreenReaderRegions() {
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
