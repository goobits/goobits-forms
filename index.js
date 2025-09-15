/**
 * @goobits/forms
 * Configurable form components with validation, CSRF protection, and category-based routing
 */

// Configuration (safe for SSR)
export * from "./config/index.js";

// Internationalization (safe for SSR)
export * from "./i18n/index.js";

// Validation utilities (safe for SSR)
export * from "./validation/index.js";

// Services (safe for SSR)
export * from "./services/index.js";

// Route handlers (safe for SSR)
export * from "./handlers/index.js";

// Security utilities (safe for SSR)
export * from "./security/csrf.js";

// Utilities (safe for SSR)
export * from "./utils/index.js";

// Logger configuration (safe for SSR)
export { configureLogger, LogLevels } from "./utils/logger.js";

// Export specific config functions
export {
  initContactFormConfig,
  getValidatorForCategory,
} from "./config/contactSchemas.js";

// Export category router functions
export {
  createCategoryRouter,
  createContactRouteHandlers,
} from "./handlers/categoryRouter.js";

// UI Components - must be imported separately to avoid SSR issues
// Use: import { ContactForm, CategoryContactForm } from '@goobits/forms/ui'
// export * from './ui/index.js'
