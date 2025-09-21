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
    howCanWeHelp: string;
    sendMessage: string;
    sending: string;
    uploadingFiles: string;
    submittingForm: string;
    formSubmitted: string;
    fileUploadError: string;
    validationError: string;
    formError: string;
    networkError: string;
    rateLimit: MessageFunction;
    required: MessageFunction;
    invalid: MessageFunction;
    select: MessageFunction;
    maxLength: MessageFunction;
    fileSize: string;
    fileType: string;
    maxFiles: string;
    privacyText: string;
    privacyLink: string;
    thankYouTitle: string;
    thankYouMessage: string;
    thankYouSubMessage: string;
    returnToHome: string;
    name: string;
    email: string;
    message: string;
    phone: string;
    company: string;
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
export declare const defaultMessages: DefaultMessageConfig;
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
export declare function getMessage(key: keyof DefaultMessageConfig, customMessages?: Partial<DefaultMessageConfig>, ...params: any[]): string;
export {};
