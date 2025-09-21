/**
 * Constants for @goobits/forms
 *
 * This module provides environment detection and configuration constants
 * used throughout the forms library for timing, storage, and behavior control.
 *
 * @module constants
 * @example
 * ```typescript
 * import { IS_BROWSER, DEBOUNCE_DELAY, STORAGE_KEY } from './constants';
 *
 * if (IS_BROWSER) {
 *   localStorage.setItem(STORAGE_KEY, formData);
 * }
 * ```
 */

/**
 * Indicates if code is running in a browser environment
 *
 * @description Detects browser environment by checking for window object availability.
 * Useful for conditional execution of client-side only code.
 *
 * @example
 * ```typescript
 * if (IS_BROWSER) {
 *   // Safe to use window, document, localStorage etc.
 *   window.addEventListener('resize', handler);
 * }
 * ```
 */
export const IS_BROWSER: boolean = typeof window !== "undefined";

/**
 * Indicates if code is running in a server environment
 *
 * @description Opposite of IS_BROWSER, useful for server-side rendering logic.
 *
 * @example
 * ```typescript
 * if (IS_SERVER) {
 *   // Safe to use Node.js APIs
 *   import fs from 'fs';
 * }
 * ```
 */
export const IS_SERVER: boolean = !IS_BROWSER;

/**
 * Indicates if application is running in development mode
 *
 * @description Should be set by the consumer application.
 * Can be overridden at runtime for debugging purposes.
 *
 * @default false
 * @example
 * ```typescript
 * if (IS_DEV) {
 *   console.log('Debug information:', formState);
 * }
 * ```
 */
export const IS_DEV: boolean = false;

/**
 * Default duration in milliseconds for status messages to display
 *
 * @description Used by toast notifications and temporary status indicators.
 * Provides consistent timing across the application.
 *
 * @default 5000
 * @example
 * ```typescript
 * showToast('Form saved!', STATUS_MESSAGE_DURATION);
 * ```
 */
export const STATUS_MESSAGE_DURATION: number = 5000;

/**
 * Default delay in milliseconds for debouncing input handlers
 *
 * @description Prevents excessive function calls during rapid user input.
 * Optimizes performance for search, validation, and API calls.
 *
 * @default 300
 * @example
 * ```typescript
 * const debouncedValidation = debounce(validateInput, DEBOUNCE_DELAY);
 * ```
 */
export const DEBOUNCE_DELAY: number = 300;

/**
 * Default delay in milliseconds for debouncing save operations
 *
 * @description Longer delay for save operations to prevent excessive
 * API calls while user is actively editing.
 *
 * @default 500
 * @example
 * ```typescript
 * const debouncedSave = debounce(saveFormData, SAVE_DEBOUNCE_DELAY);
 * ```
 */
export const SAVE_DEBOUNCE_DELAY: number = 500;

/**
 * Local storage key for saving form data
 *
 * @description Used to persist form data across browser sessions.
 * Prefixed with 'goo_' to avoid conflicts with other applications.
 *
 * @default "goo_contact_form_data"
 * @example
 * ```typescript
 * localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
 * const savedData = localStorage.getItem(STORAGE_KEY);
 * ```
 */
export const STORAGE_KEY: string = "goo_contact_form_data";

/**
 * Local storage key for saving form data expiration time
 *
 * @description Tracks when stored form data should be considered stale.
 * Used in conjunction with STORAGE_KEY for cache invalidation.
 *
 * @default "goo_contact_form_expiry"
 * @example
 * ```typescript
 * const expiryTime = Date.now() + (DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
 * localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());
 * ```
 */
export const STORAGE_EXPIRY_KEY: string = "goo_contact_form_expiry";

/**
 * Default number of hours before form data in storage expires
 *
 * @description Defines how long form data should be preserved in local storage
 * before being considered stale and removed.
 *
 * @default 24
 * @example
 * ```typescript
 * const expiryTimestamp = Date.now() + (DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);
 * ```
 */
export const DEFAULT_EXPIRY_HOURS: number = 24;