/**
 * Default configuration for @goobits/contactform
 *
 * This module provides comprehensive default configurations for contact forms,
 * including field definitions, categories, validation rules, and UI settings.
 */
import type { MessageObject, FieldConfig, CategoryConfig, ContactFormConfig, FileSettings } from "./types";
/**
 * Message function type for dynamic messages with parameters
 */
type MessageFunction = (...args: any[]) => string;
/**
 * Error message configuration with both static and dynamic messages
 */
export interface ErrorMessageConfig extends MessageObject {
    required: MessageFunction;
    invalid: MessageFunction;
    select: MessageFunction;
    fileSize: string;
    fileType: string;
    maxFiles: string;
    name: string;
    email: string;
    message: string;
    coppa: string;
    phone: string;
    preferredDate: string;
    preferredTime: string;
    browser: string;
    browserVersion: string;
    operatingSystem: string;
    company: string;
    businessRole: string;
    institution: string;
    educationRole: string;
    featureArea: string;
    recaptchaInit: string;
    recaptchaVerification: string;
    recaptchaMissing: string;
}
/**
 * File settings configuration
 */
export interface FileSettingsConfig {
    /** Maximum file size in bytes */
    maxFileSize: number;
    /** Array of accepted MIME types */
    acceptedImageTypes: string[];
}
/**
 * reCAPTCHA configuration
 */
export interface RecaptchaConfig {
    /** Whether reCAPTCHA is enabled */
    enabled: boolean;
    /** reCAPTCHA provider type */
    provider: "google-v3" | "google-v2" | "hcaptcha";
    /** Public site key */
    siteKey: string;
    /** Secret key (server-side only) */
    secretKey: string;
    /** Minimum score for v3 (0.0 to 1.0) */
    minScore: number;
    /** Cache timeout in milliseconds */
    cacheTimeout: number;
}
/**
 * API configuration
 */
export interface ApiConfig {
    /** API endpoint URL */
    endpoint: string;
    /** Request timeout in milliseconds */
    timeout: number;
    /** Number of retry attempts */
    retries: number;
}
/**
 * UI configuration
 */
export interface UiConfig {
    /** Show success message after submission */
    showSuccessMessage: boolean;
    /** Duration to show success message in milliseconds */
    successMessageDuration: number;
    /** Show field-level error messages */
    showFieldErrors: boolean;
    /** Focus first field with error */
    focusFirstError: boolean;
    /** Scroll to first error field */
    scrollToError: boolean;
    /** Submit button text */
    submitButtonText: string;
    /** Submit button text while submitting */
    submittingButtonText: string;
    /** Reset form after successful submission */
    resetAfterSubmit: boolean;
}
/**
 * Internationalization (i18n) configuration
 */
export interface I18nConfig {
    /** Whether i18n is enabled */
    enabled: boolean;
    /** Array of supported language codes */
    supportedLanguages: string[];
    /** Default language code */
    defaultLanguage: string;
    /** Include language code in URL */
    includeLanguageInURL: boolean;
    /** Auto-detect user language */
    autoDetectLanguage: boolean;
    /** Order for language detection */
    languageDetectionOrder: ("url" | "sessionStorage" | "browser")[];
    /** Storage key for persisted language */
    persistLanguageKey: string;
}
/**
 * Default error messages for form validation
 *
 * @example
 * ```typescript
 * const errorMsg = defaultErrorMessages.required("email");
 * // Returns: "Please provide your email"
 * ```
 */
export declare const defaultErrorMessages: ErrorMessageConfig;
/**
 * Default file upload settings
 *
 * @example
 * ```typescript
 * const maxSize = defaultFileSettings.maxFileSize; // 5MB in bytes
 * const isValidType = defaultFileSettings.acceptedImageTypes.includes("image/jpeg");
 * ```
 */
export declare const defaultFileSettings: FileSettings;
/**
 * Default form categories with field configurations
 *
 * @example
 * ```typescript
 * const generalFields = defaultCategories.general.fields;
 * // Returns: ["name", "email", "message", "attachments", "coppa"]
 * ```
 */
export declare const defaultCategories: Record<string, CategoryConfig>;
/**
 * Default field configurations for form inputs
 *
 * @example
 * ```typescript
 * const nameConfig = defaultFieldConfigs.name;
 * // Returns: { type: "text", label: "Name", placeholder: "Your name", ... }
 * ```
 */
export declare const defaultFieldConfigs: Record<string, FieldConfig>;
/**
 * Default reCAPTCHA configuration
 *
 * @example
 * ```typescript
 * const config = { ...defaultRecaptchaConfig, enabled: true, siteKey: "your-key" };
 * ```
 */
export declare const defaultRecaptchaConfig: RecaptchaConfig;
/**
 * Default API configuration
 *
 * @example
 * ```typescript
 * const apiUrl = defaultApiConfig.endpoint; // "/api/contact"
 * const timeout = defaultApiConfig.timeout; // 30000ms
 * ```
 */
export declare const defaultApiConfig: ApiConfig;
/**
 * Default UI configuration
 *
 * @example
 * ```typescript
 * const submitText = defaultUiConfig.submitButtonText; // "Send Message"
 * const showSuccess = defaultUiConfig.showSuccessMessage; // true
 * ```
 */
export declare const defaultUiConfig: UiConfig;
/**
 * Default internationalization configuration
 *
 * @example
 * ```typescript
 * const isI18nEnabled = defaultI18nConfig.enabled; // false
 * const defaultLang = defaultI18nConfig.defaultLanguage; // "en"
 * ```
 */
export declare const defaultI18nConfig: I18nConfig;
/**
 * Complete default configuration object
 *
 * This is the master configuration that combines all default settings
 * and can be used as a base for creating custom contact form configurations.
 *
 * @example
 * ```typescript
 * import { defaultConfig } from "./defaults";
 * import { secureDeepMerge } from "./secureDeepMerge";
 *
 * const customConfig = secureDeepMerge(defaultConfig, {
 *   appName: "My App",
 *   ui: { submitButtonText: "Submit Now" }
 * });
 * ```
 */
export declare const defaultConfig: Partial<ContactFormConfig>;
export {};
