/**
 * @goobits/forms
 * Configurable form components with validation, CSRF protection, and category-based routing
 *
 * @fileoverview Main entry point for the @goobits/forms package. This module provides
 * a comprehensive form handling solution with built-in validation, CSRF protection,
 * internationalization, and category-based routing capabilities.
 *
 * @author @goobits
 * @version 1.0.0
 * @since 1.0.0
 */

// Configuration (safe for SSR)
/**
 * Configuration utilities and types for form setup and customization.
 * Includes default configurations, schemas, and type definitions.
 */
export * from "./config/index.ts";

// Internationalization (safe for SSR)
/**
 * Internationalization support for multi-language form interfaces.
 * Provides hooks and utilities for locale-aware form rendering.
 */
export * from "./i18n/index.ts";

// Validation utilities (safe for SSR)
/**
 * Form validation utilities and schemas for client and server-side validation.
 * Built on top of popular validation libraries with custom extensions.
 */
export * from "./validation/index.ts";

// Services (safe for SSR)
/**
 * Backend services for form processing, including email delivery,
 * rate limiting, and third-party integrations.
 */
export * from "./services/index.js";

// Route handlers (safe for SSR)
/**
 * SvelteKit route handlers for form submission processing.
 * Includes category-based routing and form processing logic.
 */
export * from "./handlers/index.js";

// Security utilities (safe for SSR)
/**
 * Security utilities including CSRF token generation and validation.
 * Essential for protecting against cross-site request forgery attacks.
 */
export * from "./security/csrf.ts";

// Utilities (safe for SSR)
/**
 * General utility functions for form handling, including input sanitization,
 * debouncing, and logging capabilities.
 */
export * from "./utils/index.js";

// Logger configuration (safe for SSR)
/**
 * Configurable logging system for debugging and monitoring form operations.
 * Supports multiple log levels and output formats.
 */
export { configureLogger, LogLevels } from "./utils/logger.js";

// Export specific config functions
/**
 * Contact form configuration functions for setting up category-based
 * form handling with custom validation rules and schemas.
 */
export {
  initContactFormConfig,
  getValidatorForCategory,
} from "./config/contactSchemas.js";

// Export category router functions
/**
 * Category-based routing functions for creating dynamic form handlers
 * that can process different types of contact forms based on categories.
 */
export {
  createCategoryRouter,
  createContactRouteHandlers,
} from "./handlers/categoryRouter.js";

// UI Components - must be imported separately to avoid SSR issues
// Use: import { ContactForm, CategoryContactForm, DemoPlayground } from '@goobits/forms/ui'
// export * from './ui/index.js'