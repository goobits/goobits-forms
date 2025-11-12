/**
 * @goobits/forms
 *
 * @description Configurable form components with validation, CSRF protection, and category-based routing.
 * @author @goobits
 * @version 1.0.0
 */

/**
 * @module config
 * @description Configuration utilities and types for form setup and customization.
 */
export * from './config/index.ts';

/**
 * @module i18n
 * @description Internationalization support for multi-language form interfaces.
 */
export * from './i18n/index.ts';

/**
 * @module validation
 * @description Form validation utilities and schemas for client and server-side validation.
 */
export * from './validation/index.ts';

/**
 * @module services
 * @description Backend services for form processing, including email delivery and rate limiting.
 */
export * from './services/index.js';

/**
 * @module handlers
 * @description SvelteKit route handlers for form submission processing.
 */
export * from './handlers/index.js';

/**
 * @module security
 * @description Security utilities including CSRF token generation and validation.
 */
export {
	generateCsrfToken,
	validateCsrfToken,
	setCsrfCookie,
	getCsrfToken,
	createCsrfProtection
} from './security/csrf.js';

/**
 * @module utils
 * @description General utility functions for form handling and logging.
 */
export * from './utils/index.js';

/**
 * @function configureLogger
 * @description Configurable logging system for debugging and monitoring.
 * @param {object} options - Logging configuration.
 */
export { configureLogger, LogLevels } from './utils/logger.js';

/**
 * @function initContactFormConfig
 * @description Initializes contact form configuration with custom categories and validation.
 * @param {object} config - The contact form configuration.
 */
export { initContactFormConfig, getValidatorForCategory } from './config/contactSchemas.js';

/**
 * @function createCategoryRouter
 * @description Creates category-based routing functions for dynamic form handlers.
 * @param {object} config - The router configuration.
 */
export { createCategoryRouter, createContactRouteHandlers } from './handlers/categoryRouter.js';

// UI Components are exported separately to avoid SSR issues.
// Example: import { ContactForm } from '@goobits/forms/ui';
