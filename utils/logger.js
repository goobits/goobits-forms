/**
 * Logger utility for @goobits/contactform
 */

// Log levels
export const LogLevels = {
	ERROR: 0,
	WARN: 1,
	INFO: 2,
	DEBUG: 3
}

// Global logger configuration
let globalConfig = {
	enabled: true,
	level: LogLevels.INFO,
	prefix: '@goobits/contactform'
}

/**
 * Configure the global logger
 * @param {Object} config - Logger configuration
 * @param {boolean} config.enabled - Enable/disable logging
 * @param {number} config.level - Log level (use LogLevels)
 * @param {string} config.prefix - Global prefix for all logs
 */
export function configureLogger(config) {
	globalConfig = { ...globalConfig, ...config }
}

/**
 * Create a logger instance for a specific module
 * @param {string} module - Module name
 * @returns {Object} Logger instance
 */
export function createLogger(module) {
	const prefix = `[${ globalConfig.prefix }:${ module }]`

	const shouldLog = (level) => {
		return globalConfig.enabled && level <= globalConfig.level
	}

	const log = (level, method, message, ...args) => {
		if (!shouldLog(level)) return

		const timestamp = new Date().toISOString()
		const logMethod = console[method] || console.log
		logMethod(`${ timestamp } ${ prefix } ${ message }`, ...args)
	}

	return {
		error: (message, ...args) => log(LogLevels.ERROR, 'error', message, ...args),
		warn: (message, ...args) => log(LogLevels.WARN, 'warn', message, ...args),
		info: (message, ...args) => log(LogLevels.INFO, 'info', message, ...args),
		debug: (message, ...args) => log(LogLevels.DEBUG, 'debug', message, ...args)
	}
}