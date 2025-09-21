/**
 * Default messages for @goobits/contactform
 *
 * This module provides comprehensive default message configurations for contact forms,
 * including UI labels, status messages, error messages, and validation text.
 * These are used as fallbacks when no custom messages are provided.
 */

import type { MessageObject } from "./types";

/**
 * Message function type for dynamic messages with parameters
 */
type MessageFunction = (value: number | string) => string;

/**
 * Complete default message configuration interface
 */
export interface DefaultMessageConfig extends MessageObject {
  // Form labels and UI
  howCanWeHelp: string;
  sendMessage: string;
  sending: string;

  // Status messages
  uploadingFiles: string;
  submittingForm: string;
  formSubmitted: string;
  fileUploadError: string;

  // Error messages
  validationError: string;
  formError: string;
  networkError: string;
  rateLimit: MessageFunction;

  // Form validation
  required: MessageFunction;
  invalid: MessageFunction;
  select: MessageFunction;
  maxLength: MessageFunction;

  // File validation
  fileSize: string;
  fileType: string;
  maxFiles: string;

  // Privacy
  privacyText: string;
  privacyLink: string;

  // Thank you page
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouSubMessage: string;
  returnToHome: string;

  // Field labels (common)
  name: string;
  email: string;
  message: string;
  phone: string;
  company: string;

  // Form categories
  generalInquiry: string;
  supportRequest: string;
  feedback: string;
  booking: string;
  businessInquiry: string;
}

/**
 * Default messages configuration object
 *
 * This comprehensive message configuration provides all the text content
 * needed for a complete contact form implementation, including dynamic
 * messages that accept parameters.
 *
 * @example
 * ```typescript
 * // Static messages
 * const submitText = defaultMessages.sendMessage; // "Send Message"
 * const thankYou = defaultMessages.thankYouTitle; // "Thank You!"
 *
 * // Dynamic messages
 * const requiredMsg = defaultMessages.required("email"); // "Please provide your email"
 * const rateLimitMsg = defaultMessages.rateLimit(5); // "Too many requests. Please try again in 5 minutes."
 *
 * // Use in form validation
 * const validateField = (field: string, value: string) => {
 *   if (!value.trim()) {
 *     return defaultMessages.required(field);
 *   }
 *   return null;
 * };
 * ```
 */
export const defaultMessages: DefaultMessageConfig = {
  // Form labels and UI
  howCanWeHelp: "How can we help?",
  sendMessage: "Send Message",
  sending: "Sending...",

  // Status messages
  uploadingFiles: "Uploading files...",
  submittingForm: "Submitting your form...",
  formSubmitted: "Your form has been submitted successfully!",
  fileUploadError: "Could not upload files, continuing without attachments",

  // Error messages
  validationError: "Please fix the validation errors before submitting.",
  formError: "Form error:",
  networkError: "An error occurred. Please try again later.",
  rateLimit: (minutes: number): string =>
    `Too many requests. Please try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`,

  // Form validation
  required: (field: string): string => `Please provide your ${field}`,
  invalid: (field: string): string => `Please provide a valid ${field}`,
  select: (field: string): string => `Please select ${field}`,
  maxLength: (max: number): string => `Maximum ${max} characters`,

  // File validation
  fileSize: "File size must be less than 5MB",
  fileType: "Only .jpg, .jpeg, .png, .webp and .gif files are accepted",
  maxFiles: "Maximum 3 images allowed",

  // Privacy
  privacyText: "By submitting this form, you agree to our",
  privacyLink: "Privacy Policy",

  // Thank you page
  thankYouTitle: "Thank You!",
  thankYouMessage: "Thank you for your message!",
  thankYouSubMessage: "We'll get back to you as soon as possible 🌈",
  returnToHome: "Return to Home",

  // Field labels (common)
  name: "Name",
  email: "Email",
  message: "Message",
  phone: "Phone",
  company: "Company",

  // Form categories
  generalInquiry: "General Inquiry",
  supportRequest: "Support Request",
  feedback: "Feedback",
  booking: "Book an Appointment",
  businessInquiry: "Business Inquiry",
};

/**
 * Helper function to get a localized message with fallback
 *
 * @param key - The message key to retrieve
 * @param customMessages - Optional custom message overrides
 * @param params - Parameters for dynamic messages
 * @returns The localized message string
 *
 * @example
 * ```typescript
 * const msg = getMessage("required", { required: (field) => `${field} is mandatory` }, "email");
 * // Returns: "email is mandatory"
 *
 * const defaultMsg = getMessage("thankYouTitle");
 * // Returns: "Thank You!"
 * ```
 */
export function getMessage(
  key: keyof DefaultMessageConfig,
  customMessages?: Partial<DefaultMessageConfig>,
  ...params: any[]
): string {
  const messageSource = customMessages || defaultMessages;
  const message = messageSource[key] || defaultMessages[key];

  if (typeof message === "function") {
    return message(...params);
  }

  return message as string;
}