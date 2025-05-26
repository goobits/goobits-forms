/**
 * Utilities for @goobits/contactform
 */

export * from './sanitizeInput.js'
export * from './constants.js'
export * from './debounce.js'
export * from './errorHandler.js'
export * from './messages.js'

/**
 * Get field configuration for a specific field
 * @param {Object} config - Configuration object
 * @param {string} fieldName - Field name
 * @returns {Object} Field configuration
 */
export function getFieldConfig(config, fieldName) {
	return config.fieldConfigs[fieldName] || {}
}

/**
 * Get category configuration
 * @param {Object} config - Configuration object
 * @param {string} category - Category name
 * @returns {Object} Category configuration
 */
export function getCategoryConfig(config, category) {
	return config.categories[category] || config.categories.general
}

/**
 * Check if a field is required in a category
 * @param {Object} config - Configuration object
 * @param {string} category - Category name
 * @param {string} fieldName - Field name
 * @returns {boolean} Whether field is required
 */
export function isFieldRequired(config, category, fieldName) {
	const categoryConfig = getCategoryConfig(config, category)
	const fieldConfig = getFieldConfig(config, fieldName)

	return categoryConfig.fields.includes(fieldName) && fieldConfig.required
}