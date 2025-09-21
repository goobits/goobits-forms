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
export declare const LogLevels: {
    /** Critical errors that require immediate attention */
    readonly ERROR: 0;
    /** Warning messages for potential issues */
    readonly WARN: 1;
    /** General informational messages */
    readonly INFO: 2;
    /** Detailed debugging information */
    readonly DEBUG: 3;
};
/**
 * Type definition for log levels
 */
export type LogLevel = typeof LogLevels[keyof typeof LogLevels];
/**
 * Logger configuration interface
 */
export interface LoggerConfig {
    /** Enable or disable all logging output */
    enabled?: boolean;
    /** Minimum log level to output (uses LogLevels) */
    level?: LogLevel;
    /** Global prefix prepended to all log messages */
    prefix?: string;
}
/**
 * Logger instance interface with typed methods
 */
export interface Logger {
    /** Log error messages (level 0) */
    error: (message: string, ...args: unknown[]) => void;
    /** Log warning messages (level 1) */
    warn: (message: string, ...args: unknown[]) => void;
    /** Log informational messages (level 2) */
    info: (message: string, ...args: unknown[]) => void;
    /** Log debug messages (level 3) */
    debug: (message: string, ...args: unknown[]) => void;
}
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
export declare function configureLogger(config: LoggerConfig): void;
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
export declare function getLoggerConfig(): Required<LoggerConfig>;
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
export declare function createLogger(module: string): Logger;
