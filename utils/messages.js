/**
 * Message utility for i18n support in @goobits/contactform
 * Provides a flexible way to handle messages from any i18n library
 */

import { defaultMessages } from "../config/defaultMessages.js";

// Use console for logging within the package
const logger = console;

/**
 * Creates a message getter function that handles both string and function messages
 *
 * @param {Object} messages - Object containing message strings or functions
 * @param {Object} [messages.validation] - Nested message object for validation messages
 * @returns {Function} A function that retrieves messages with fallback support
 * @throws {TypeError} If messages is not an object
 */
export function createMessageGetter(messages = {}) {
  if (messages !== null && typeof messages === "object") {
    return (key, fallback, ...args) => {
      // Validate key to prevent prototype pollution
      if (
        typeof key !== "string" ||
        key === "__proto__" ||
        key === "constructor"
      ) {
        logger.warn("[ContactFormMessages] Invalid message key:", key);
        return fallback || "INVALID_KEY";
      }

      // First check user messages
      if (messages[key]) {
        const msg = messages[key];
        if (typeof msg === "function") {
          try {
            return msg(...args);
          } catch (_error) {
            // Log minimal error info to avoid leaking sensitive data
            logger.warn(
              `[ContactFormMessages] Error calling message function for key: ${key}`,
            );
            return fallback || key;
          }
        }
        return msg;
      }

      // Then check default messages
      if (defaultMessages[key]) {
        const defaultMsg = defaultMessages[key];
        if (typeof defaultMsg === "function") {
          try {
            return defaultMsg(...args);
          } catch (_error) {
            // Log minimal error info to avoid leaking sensitive data
            logger.warn(
              `[ContactFormMessages] Error calling default message function for key: ${key}`,
            );
            return fallback || key;
          }
        }
        // For nested objects like validation messages
        if (typeof defaultMsg === "object" && !Array.isArray(defaultMsg)) {
          const nestedKey = args[0];
          // Validate nested key to prevent prototype pollution
          if (
            typeof nestedKey === "string" &&
            nestedKey !== "__proto__" &&
            nestedKey !== "constructor" &&
            defaultMsg[nestedKey]
          ) {
            return defaultMsg[nestedKey];
          }
        }
        return defaultMsg;
      }

      // Finally use fallback or key
      return fallback || key;
    };
  }

  throw new TypeError("Messages must be an object");
}

/**
 * Merges user-provided messages with default messages
 *
 * @param {Object} [userMessages={}] - User-provided messages to override defaults
 * @returns {Object} Complete messages object with defaults and user overrides
 * @throws {TypeError} If userMessages is not an object
 */
export function getMergedMessages(userMessages = {}) {
  if (userMessages !== null && typeof userMessages === "object") {
    return {
      ...defaultMessages,
      ...userMessages,
    };
  }

  throw new TypeError("User messages must be an object");
}
