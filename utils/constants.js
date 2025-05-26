/**
 * Constants for @goobits/contactform
 */

// Environment detection
export const IS_BROWSER = typeof window !== 'undefined'
export const IS_SERVER = !IS_BROWSER

// Development detection - removed hardcoded localhost check
export const IS_DEV = false // Should be set by the consumer application

// Default timeout durations
export const STATUS_MESSAGE_DURATION = 5000
export const DEBOUNCE_DELAY = 300
export const SAVE_DEBOUNCE_DELAY = 500

// Storage keys
export const STORAGE_KEY = 'goo_contact_form_data'
export const STORAGE_EXPIRY_KEY = 'goo_contact_form_expiry'
export const DEFAULT_EXPIRY_HOURS = 24