/**
 * Form Service - Core functionality for form handling
 *
 * This module provides utilities for form initialization, state management,
 * submission handling, and accessibility.
 */

// External Imports
import { superForm } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'

// Import logger utility
import { createLogger } from '../utils/logger.js'

const logger = createLogger('FormService')

// Internal Imports
// import { createRecaptchaProvider } from './recaptcha/index.js'
import { sanitizeFormData } from '../utils/sanitizeInput.js'
import { debounce } from '../utils/debounce.js'
import { handleError } from '../utils/errorHandler.js'

// Import screen reader service to avoid circular dependencies
import * as screenReaderService from './screenReaderService.js'

/**
 * Initialize a form with standard configuration
 * @param {Object} options - Form initialization options
 * @param {Object} options.initialData - Initial form data
 * @param {Object} options.schema - Zod schema for validation
 * @param {Function} options.onSubmitHandler - Custom submission handler
 * @param {Object} options.extraOptions - Additional superForm options
 * @returns {Object} The initialized form object and related utilities
 */
export function initializeForm({ initialData, schema, onSubmitHandler, extraOptions = {} }) {
	// Validate schema before passing to zod adapter
	if (!schema || typeof schema !== 'object' || !schema._def) {
		const errorMsg = `Invalid schema provided to initializeForm. Schema details: type=${typeof schema}, hasDefProperty=${!!schema?._def}, schema=${JSON.stringify(schema, null, 2)}`;
		logger.error(errorMsg);
		throw new Error(errorMsg);
	}

	logger.debug('Initializing form with schema', { 
		schemaType: typeof schema, 
		hasDefProperty: !!schema._def,
		schemaKeys: schema ? Object.keys(schema) : [],
		initialDataKeys: initialData ? Object.keys(initialData) : []
	});

	try {
		return superForm(initialData, {
			dataType: 'json',
			validators: zod4(schema),
			resetForm: false,
			taintedMessage: false,
			multipleSubmits: 'prevent',
			SPA: true,
			onSubmit: onSubmitHandler,
			onUpdate() {
				// Handle form updates
			},
			...extraOptions
		});
	} catch (error) {
		logger.error('Failed to initialize superForm', { error: error.message, schema, initialData });
		throw error;
	}
}

/**
 * Initialize form state with default values
 * @param {Object} initialState - Initial state values
 * @returns {Object} The initial form state
 */
export function initializeFormState(initialState = {}) {
	return {
		attachments: [],
		selectedCategory: '',
		submissionError: null,
		recaptcha: null,
		touched: {},
		cachedCategory: null,
		...initialState
	}
}

/**
 * Handle field input events
 * @param {Object} touched - Object tracking touched state of fields
 * @param {string} fieldName - The field name
 * @param {Function} validate - Validation function
 */
export function handleFieldInput(touched, fieldName, validate) {
	// Validate if the field has been touched
	if (touched[fieldName]) {
		// Use debounce to prevent too many validation calls
		debounce(() => validate(fieldName), 300)()
	}
}

/**
 * Handle field blur events to mark as touched
 * @param {Object} touched - Object tracking touched state of fields
 * @param {string} fieldName - The field name
 * @returns {Object} Updated touched object
 */
export function handleFieldTouch(touched, fieldName) {
	return {
		...touched,
		[fieldName]: true
	}
}

/**
 * Creates a standardized form submission handler with common functionality
 * @param {Object} options - Handler options
 * @returns {Function} Submission handler function
 */
export function createFormSubmitHandler(options) {
	const {
		validateForm,
		recaptcha,
		prepareFormData,
		submitForm,
		onSuccess,
		onError
	} = options

	return async function(formData) {
		// Validate the form first
		if (!validateForm()) {
			const error = handleError('Please fix the validation errors before submitting.', 'FormSubmission', { step: 'validation' })
			onError(error)
			return { success: false, error }
		}

		try {
			// Get reCAPTCHA token if available
			const recaptchaToken = await getRecaptchaToken(recaptcha)

			// Prepare, sanitize and submit
			const preparedData = await prepareFormData(formData, recaptchaToken)
			const sanitizedData = sanitizeFormData(preparedData)
			const response = await submitForm(sanitizedData)

			// Handle response
			if (response?.success) {
				onSuccess(response)
				return { success: true, data: response }
			}

			// Handle non-success response
			const error = handleError(
				response?.error || 'Form submission failed',
				'FormSubmission',
				{ response }
			)
			throw error
		} catch (error) {
			const standardizedError = error.name === 'ContactFormError'
				? error
				: handleError(error, 'FormSubmission', { formData })
			onError(standardizedError)
			return { success: false, error: standardizedError }
		}
	}
}

/**
 * Get reCAPTCHA token if available
 * @param {Object} recaptcha - reCAPTCHA instance
 * @returns {Promise<string|null>} Token or null
 */
async function getRecaptchaToken(recaptcha) {
	if (!recaptcha) return null

	try {
		return await recaptcha.getToken('submit')
	} catch (error) {
		logger.error('reCAPTCHA execution failed:', error)
		return null
	}
}

/**
 * Reset a form to its initial state
 * @param {Function} setFormData - Function to set form data
 * @param {Object} defaultProps - Default form properties
 * @param {Object} state - State variables to reset
 */
export function resetForm(setFormData, defaultProps, state) {
	// Reset the form data
	setFormData(defaultProps)

	// Reset form state
	if (state.submissionError) {
		state.submissionError = null
	}

	// Clear touched state
	if (state.touched) {
		state.touched = {}
	}
}

// Deprecated createStatusRegion removed - use screenReaderService.announce() instead

// Deprecated cleanupStatusRegions removed - use screenReaderService.cleanupAllAnnouncements() instead