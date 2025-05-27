/**
 * Utilities for sanitizing user input to prevent XSS attacks
 */

import { createLogger } from './logger.js'

const logger = createLogger('SanitizeInput')

// Local error handling implementation
function handleError(moduleName, error) {
	logger.error('Error:', error)
	return error
}

function validateType(value, type, name, isOptional = true) {
	if (value === undefined || value === null) {
		if (!isOptional) {
			throw new TypeError(`${ name } is required`)
		}
		return
	}

	const actualType = typeof value
	if (type === 'array') {
		if (!Array.isArray(value)) {
			throw new TypeError(`${ name } must be an array, got ${ actualType }`)
		}
	} else if (actualType !== type) {
		throw new TypeError(`${ name } must be a ${ type }, got ${ actualType }`)
	}
}

// Module name for error context
const MODULE_NAME = 'SanitizeInput'

// Potentially dangerous URL protocols
export const DANGEROUS_PROTOCOLS = [
	'javascript:',
	'data:',
	'vbscript:',
	'file:',
	'about:',
	'jscript:',
	'livescript:',
	'mhtml:'
]

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @param {string} str - String to be escaped
 * @returns {string} Escaped string with HTML entities replacing special characters
 */
export function escapeHTML(str) {
	// Return non-string inputs unchanged
	if (typeof str !== 'string') return str

	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

/**
 * Sanitizes a URL to prevent javascript: protocol and other potential injections
 *
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if potentially malicious
 */
export function sanitizeURL(url) {
	try {
		// Return non-string inputs unchanged
		if (typeof url !== 'string') return url

		// Remove whitespace
		const trimmed = url.trim()
		if (!trimmed) return url

		// Enhanced detection for obfuscated protocols
		const normalized = trimmed.toLowerCase()
			.replace(/\s+/g, '')
			.replace(/[\x00-\x20]/g, '') // Remove control characters
			.replace(/\\+/g, '')         // Handle escaping

		// Check if URL starts with any dangerous protocol
		if (DANGEROUS_PROTOCOLS.some(protocol => normalized.startsWith(protocol))) {
			return null // Return null for potentially malicious URLs
		}

		// Return safe URL
		return trimmed
	} catch (error) {
		handleError(MODULE_NAME, error)
		return null // Return null on error as a safety measure
	}
}

/**
 * Deep sanitizes an object or array, recursively processing all string values
 *
 * @param {*} input - Object, array, or primitive to sanitize
 * @returns {*} Sanitized value with all strings HTML-escaped
 * @throws {Error} If circular references are detected or processing fails
 */
export function sanitize(input) {
	try {
		// Handle primitives
		if (typeof input !== 'object' || input === null) {
			return typeof input === 'string' ? escapeHTML(input) : input
		}

		// Handle arrays
		if (Array.isArray(input)) {
			return input.map(item => sanitize(item))
		}

		// Handle objects
		const result = {}
		for (const [ key, value ] of Object.entries(input)) {
			result[key] = sanitize(value)
		}
		return result
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}

/**
 * Sanitizes form data with field-specific sanitization strategies
 *
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} Sanitized form data with appropriate transformations
 * @throws {TypeError} If formData is not an object
 */
export function sanitizeFormData(formData) {
	try {
		// Validate input is an object
		validateType(formData, 'object', 'formData', false)

		const sanitized = { ...formData }

		// Sanitize each field based on its key and type
		Object.keys(sanitized).forEach(key => {
			const value = sanitized[key]

			// Skip null/undefined values
			if (value === null || value === undefined) return

			// Field name patterns that should be treated as URLs
			const urlFieldPatterns = [ 'url', 'website', 'link', 'href', 'src' ]

			// Check if field name suggests it's a URL (using a more reliable pattern match)
			const isUrlField = urlFieldPatterns.some(pattern =>
				key.toLowerCase().includes(pattern.toLowerCase())
			)

			if (isUrlField && typeof value === 'string') {
				// URL fields get URL sanitization
				sanitized[key] = sanitizeURL(value)
			} else if (typeof value === 'string') {
				// All other strings get HTML escaped (including emails)
				sanitized[key] = escapeHTML(value)
			} else if (typeof value === 'object') {
				// Deep sanitize objects and arrays
				sanitized[key] = sanitize(value)
			}
		})

		return sanitized
	} catch (error) {
		handleError(MODULE_NAME, error)
	}
}