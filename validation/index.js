/**
 * Validation utilities for contact forms
 */

import { zod } from 'sveltekit-superforms/adapters'
import { debounce } from '../utils/debounce.js'

/**
 * Creates a validation schema for a specific contact category
 * @param {Object} config - Configuration object
 * @param {string} category - The contact category
 * @returns {import('zod').ZodObject} A Zod validation schema for the category
 */
export function createValidationSchemaForCategory(config, category) {
	const { categories, schemas, categoryToFieldMap } = config

	if (!categories[category]) {
		throw new Error(`Invalid category: ${ category }`)
	}

	// Use the pre-built category schema
	if (schemas && schemas.categories && schemas.categories[category]) {
		return schemas.categories[category]
	}

	// Fallback to creating from field map if schema not available
	if (categoryToFieldMap[category] && schemas.complete) {
		return schemas.complete.pick(
			Object.fromEntries(
				categoryToFieldMap[category].map(field => [ field, true ])
			)
		)
	}

	throw new Error(`No schema found for category: ${ category }`)
}

/**
 * Gets the superForm validator for a specific category
 * @param {Object} config - Configuration object
 * @param {string} category - The contact category
 * @returns {Function} A superForm validator for the category
 */
export function getValidatorForCategory(config, category) {
	return zod(createValidationSchemaForCategory(config, category))
}

/**
 * Get validation state CSS classes for a field
 * @param {boolean} hasError - Whether the field has a validation error
 * @param {boolean} isTouched - Whether the field has been touched
 * @param {*} value - The field value (optional, for additional validation states)
 * @returns {string} Space-separated CSS class names
 */
export function getValidationClasses(hasError, isTouched, value) {
	if (!isTouched) return ''
	// Only show valid state if there's an actual value
	return hasError ? 'is-invalid has-error' : (value ? 'is-valid' : '')
}

/**
 * Debounced validation helper
 * @param {Function} validateFn - Validation function to debounce
 * @param {number} delay - Debounce delay in milliseconds
 * @returns {Function} Debounced validation function
 */
export function createDebouncedValidator(validateFn, delay = 300) {
	return debounce(validateFn, delay)
}

/**
 * Export the debounce function for backward compatibility
 */
export { debounce }

/**
 * Check if a form has any validation errors
 * @param {Object} errors - Error object from superforms
 * @returns {boolean} True if there are any errors
 */
export function hasValidationErrors(errors) {
	return Object.values(errors).some(value => value && value.length > 0)
}

/**
 * Clear specific field error
 * @param {Object} errors - Current errors object
 * @param {string} field - Field name to clear
 * @returns {Object} Updated errors object
 */
export function clearFieldError(errors, field) {
	const updatedErrors = { ...errors }
	delete updatedErrors[field]
	return updatedErrors
}