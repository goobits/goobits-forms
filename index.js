/**
 * @goobits/contactform
 * Configurable contact form component with validation and reCAPTCHA
 */

// Configuration (safe for SSR)
export * from './config/index.js'

// Internationalization (safe for SSR)
export * from './i18n/index.js'

// Validation utilities (safe for SSR)
export * from './validation/index.js'

// Services (safe for SSR)
export * from './services/index.js'

// Route handlers (safe for SSR)
export * from './handlers/index.js'

// Utilities (safe for SSR)
export * from './utils/index.js'

// Logger configuration (safe for SSR)
export { configureLogger, LogLevels } from './utils/logger.js'

// UI Components - must be imported separately to avoid SSR issues
// Use: import { ContactForm } from '@goobits/forms/ui'
// export * from './ui/index.js'