/**
 * Route handlers for contact form endpoints
 */

import { json } from '@sveltejs/kit'
import { superValidate } from 'sveltekit-superforms/server'
import { zod } from 'sveltekit-superforms/adapters'
import { getContactFormConfig } from '../config/index.js'
import { getValidatorForCategory } from '../validation/index.js'

// Export simplified contact form handler
export * from './contactFormHandler.js'

/**
 * Create a page load handler for the contact form
 * @param {Object} options - Handler options
 * @returns {Function} SvelteKit load function
 */
export function createContactPageHandler(options = {}) {
	const {
		getCategory = (url) => url.searchParams.get('type') || 'general',
		config = null
	} = options

	return async ({ url }) => {
		const finalConfig = config || getContactFormConfig()
		const category = getCategory(url)

		// Validate category exists
		if (!finalConfig.categories[category]) {
			return {
				form: await superValidate({}, zod(finalConfig.schemas.categories.general)),
				category: 'general'
			}
		}

		// Use category-specific validator
		const validator = getValidatorForCategory(finalConfig, category)
		const form = await superValidate({ category }, validator)

		return {
			form,
			category
		}
	}
}

/**
 * Create a GET handler for the contact API
 * @param {Object} options - Handler options
 * @returns {Function} SvelteKit GET handler
 */
export function createContactGetHandler(options = {}) {
	const {
		defaultCategory = 'general',
		config = null
	} = options

	return async () => {
		const finalConfig = config || getContactFormConfig()
		const form = await superValidate(
			{ category: defaultCategory },
			zod(finalConfig.schemas.categories[defaultCategory])
		)

		return json({
			form,
			category: defaultCategory
		})
	}
}

/**
 * Create a POST handler for the contact API
 * @param {Object} options - Handler options
 * @returns {Function} SvelteKit POST handler
 */
export function createContactPostHandler(options = {}) {
	const {
		config = null,
		rateLimiter = null,
		sanitizer = null,
		recaptchaVerifier = null,
		successHandler = null,
		errorHandler = null,
		logger = console
	} = options

	return async ({ request, locals }) => {
		const finalConfig = config || getContactFormConfig()

		try {
			// Parse request body
			const rawData = await request.json()
			const { category = 'general', recaptchaToken, ...formData } = rawData

			// Rate limiting
			if (rateLimiter) {
				const rateLimitResult = await rateLimiter(locals)
				if (!rateLimitResult.allowed) {
					return json({
						success: false,
						error: 'Too many requests. Please try again later.'
					}, { status: 429 })
				}
			}

			// Verify reCAPTCHA if enabled
			if (finalConfig.recaptcha.enabled && recaptchaVerifier) {
				const recaptchaValid = await recaptchaVerifier(recaptchaToken)
				if (!recaptchaValid) {
					return json({
						success: false,
						error: finalConfig.errorMessages.recaptchaVerification
					}, { status: 403 })
				}
			}

			// Sanitize data
			const sanitizedData = sanitizer ? await sanitizer(formData) : formData

			// Validate form data
			const validator = getValidatorForCategory(finalConfig, category)
			const result = await superValidate(sanitizedData, validator)

			if (!result.valid) {
				return json({
					success: false,
					errors: result.errors,
					form: result
				}, { status: 400 })
			}

			// Process successful submission
			if (successHandler) {
				try {
					const response = await successHandler({
						data: sanitizedData,
						category,
						locals,
						request
					})

					return json({
						success: true,
						message: response.message || 'Message sent successfully!',
						...response
					})
				} catch (error) {
					logger.error('Success handler error:', error)
					throw error
				}
			}

			// Default success response
			return json({
				success: true,
				message: 'Thank you for your message! We\'ll get back to you soon.'
			})

		} catch (error) {
			// Handle errors
			if (errorHandler) {
				const errorResponse = await errorHandler(error)
				return json(errorResponse, { status: errorResponse.status || 500 })
			}

			logger.error('Contact form error:', error)
			return json({
				success: false,
				error: 'An error occurred. Please try again later.'
			}, { status: 500 })
		}
	}
}

/**
 * Create combined handlers for a contact route
 * @param {Object} options - Handler options
 * @returns {Object} Object with GET and POST handlers
 */
export function createContactHandlers(options = {}) {
	return {
		GET: createContactGetHandler(options),
		POST: createContactPostHandler(options)
	}
}