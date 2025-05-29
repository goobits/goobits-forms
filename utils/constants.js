/**
 * Constants for @goobits/contactform
 */

/**
 * Indicates if code is running in a browser environment
 * @type {boolean}
 */
export const IS_BROWSER = typeof window !== 'undefined'

/**
 * Indicates if code is running in a server environment
 * @type {boolean}
 */
export const IS_SERVER = !IS_BROWSER

/**
 * Indicates if application is running in development mode
 * Should be set by the consumer application
 * @type {boolean}
 */
export const IS_DEV = false

/**
 * Default duration in milliseconds for status messages to display
 * @type {number}
 */
export const STATUS_MESSAGE_DURATION = 5000

/**
 * Default delay in milliseconds for debouncing input handlers
 * @type {number}
 */
export const DEBOUNCE_DELAY = 300

/**
 * Default delay in milliseconds for debouncing save operations
 * @type {number}
 */
export const SAVE_DEBOUNCE_DELAY = 500

/**
 * Local storage key for saving form data
 * @type {string}
 */
export const STORAGE_KEY = 'goo_contact_form_data'

/**
 * Local storage key for saving form data expiration time
 * @type {string}
 */
export const STORAGE_EXPIRY_KEY = 'goo_contact_form_expiry'

/**
 * Default number of hours before form data in storage expires
 * @type {number}
 */
export const DEFAULT_EXPIRY_HOURS = 24