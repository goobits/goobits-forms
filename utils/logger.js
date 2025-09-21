/**
 * Logger utility for @goobits/forms
 *
 * This module provides a configurable logging system with multiple log levels,
 * module-specific loggers, and consistent formatting across the forms library.
 * Supports both development debugging and production error tracking.
 *
 * @module logger
 * @example
 * ```typescript
 * import { createLogger, configureLogger, LogLevels } from './logger';
 *
 * // Configure global logging
 * configureLogger({ level: LogLevels.DEBUG, enabled: true });
 *
 * // Create module-specific logger
 * const logger = createLogger('FormValidator');
 * logger.info('Validation started', { fieldCount: 5 });
 * ```
 */
/**
 * Log levels for controlling output verbosity
 *
 * @description Defines hierarchical log levels where lower numbers
 * have higher priority. Setting a level enables all messages at
 * that level and below.
 *
 * @example
 * ```typescript
 * // Setting level to WARN will show ERROR and WARN messages only
 * configureLogger({ level: LogLevels.WARN });
 * ```
 */
export const LogLevels = {
    /** Critical errors that require immediate attention */
    ERROR: 0,
    /** Warning messages for potential issues */
    WARN: 1,
    /** General informational messages */
    INFO: 2,
    /** Detailed debugging information */
    DEBUG: 3,
};
/**
 * Global logger configuration with defaults
 */
let globalConfig = {
    enabled: true,
    level: LogLevels.INFO,
    prefix: "@goobits/forms",
};
/**
 * Configure the global logger settings
 *
 * @description Updates the global logger configuration that affects
 * all logger instances created after this call. Existing loggers
 * will also use the updated configuration.
 *
 * @param config - Partial logger configuration to merge with defaults
 *
 * @example
 * ```typescript
 * // Enable debug logging in development
 * configureLogger({
 *   level: LogLevels.DEBUG,
 *   enabled: process.env.NODE_ENV === 'development'
 * });
 *
 * // Disable all logging in production
 * configureLogger({ enabled: false });
 *
 * // Change global prefix
 * configureLogger({ prefix: 'MyApp:Forms' });
 * ```
 */
export function configureLogger(config) {
    globalConfig = { ...globalConfig, ...config };
}
/**
 * Get current logger configuration
 *
 * @description Returns a copy of the current global logger configuration.
 * Useful for debugging or conditional logging behavior.
 *
 * @returns Current logger configuration object
 *
 * @example
 * ```typescript
 * const currentConfig = getLoggerConfig();
 * if (currentConfig.level >= LogLevels.DEBUG) {
 *   // Perform expensive debug operations
 * }
 * ```
 */
export function getLoggerConfig() {
    return { ...globalConfig };
}
/**
 * Create a logger instance for a specific module
 *
 * @description Creates a module-specific logger with consistent formatting
 * and the current global configuration. Each logger instance includes
 * the module name in its output for easy identification.
 *
 * @param module - Name of the module or component creating the logger
 * @returns Logger instance with error, warn, info, and debug methods
 *
 * @example
 * ```typescript
 * const logger = createLogger('FormValidator');
 *
 * logger.info('Starting validation', { fields: ['email', 'name'] });
 * logger.warn('Field validation failed', { field: 'email', error: 'Invalid format' });
 * logger.error('Critical validation error', error);
 * logger.debug('Validation details', { step: 'email-regex', pattern: /\S+@\S+/ });
 * ```
 */
export function createLogger(module) {
    const prefix = `[${globalConfig.prefix}:${module}]`;
    /**
     * Check if a log level should be output based on current configuration
     */
    const shouldLog = (level) => {
        return globalConfig.enabled && level <= globalConfig.level;
    };
    /**
     * Internal log function with level checking and formatting
     */
    const log = (level, method, message, ...args) => {
        if (!shouldLog(level))
            return;
        const timestamp = new Date().toISOString();
        const logMethod = console[method] || console.log;
        logMethod(`${timestamp} ${prefix} ${message}`, ...args);
    };
    return {
        /**
         * Log error messages (highest priority)
         *
         * @param message - Primary error message
         * @param args - Additional context, error objects, or data
         */
        error: (message, ...args) => log(LogLevels.ERROR, "error", message, ...args),
        /**
         * Log warning messages
         *
         * @param message - Warning message
         * @param args - Additional context or data
         */
        warn: (message, ...args) => log(LogLevels.WARN, "warn", message, ...args),
        /**
         * Log informational messages
         *
         * @param message - Information message
         * @param args - Additional context or data
         */
        info: (message, ...args) => log(LogLevels.INFO, "info", message, ...args),
        /**
         * Log debug messages (lowest priority)
         *
         * @param message - Debug message
         * @param args - Additional debugging context or data
         */
        debug: (message, ...args) => log(LogLevels.DEBUG, "debug", message, ...args),
    };
}
