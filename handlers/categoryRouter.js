/**
 * Category-based contact form router
 * 
 * Handles routing and processing for categorized contact forms.
 * Supports category-specific validation, redirection, and form submission.
 */

import { createLogger } from '../utils/logger.js'
import { validateCsrfToken } from '../security/csrf.js'

const logger = createLogger('CategoryRouter')

/**
 * Creates a category router for contact forms
 * @param {Object} config - Configuration object for the router
 * @returns {Object} Functions for handling category-based routing
 */
export function createCategoryRouter(config) {
	const {
		categories = {},
		basePath = '/contact',
		defaultCategory = 'general',
		successPath = '/contact/success',
		errorHandler = null,
		getValidatorForCategory = null,
		formDataParser = null,
		createSubmissionHandler = null
	} = config

	/**
	 * Load handler for SvelteKit routes
	 * Handles category detection, validation, and initial form setup
	 * 
	 * @param {Object} routeParams - SvelteKit route parameters
	 * @returns {Object} Data for the route
	 */
	async function load({ params, url, error, redirect }) {
		const slug = params.slug
		const lang = params.lang || 'en'

		// Handle success page
		if (slug === 'success') {
			return {
				form: {
					data: {},
					errors: {},
					isSubmitted: false
				},
				showThankYou: true,
				categorySlug: url.searchParams.get('category') || defaultCategory
			}
		}

		// Check if the slug corresponds to a valid category
		const category = categories[slug]
		if (!category) {
			// If not a direct match, try to find a matching category by label
			const categoryEntry = Object.entries(categories).find(([ categoryKey, cat ]) =>
				cat.label.toLowerCase().replace(/\s+/g, '-') === slug
			)

			if (!categoryEntry) {
				throw error(404, `Category not found: ${ slug }`)
			}

			// Redirect to the canonical slug
			throw redirect(301, `/${ lang }${ basePath }/${ categoryEntry[0] }`)
		}

		// Initialize the form with validator if provided
		const initialFormData = {}
		let validator = null
		
		if (typeof getValidatorForCategory === 'function') {
			validator = getValidatorForCategory(slug)
		}

		return {
			form: {
				data: initialFormData,
				errors: {},
				isSubmitted: false,
				validator
			},
			categorySlug: slug,
			category
		}
	}

	/**
	 * Form action handler for SvelteKit routes
	 * Processes form submissions with CSRF validation and category-specific logic
	 * 
	 * @param {Object} actionParams - SvelteKit action parameters
	 * @returns {Object} Form submission result
	 */
	async function handleSubmission({ request, url, params, redirect, locals = {} }) {
		try {
			const formData = await request.formData()
			const slug = params.slug
			const lang = params.lang || 'en'

			logger.info('Contact form submission received', {
				category: slug,
				lang,
				origin: url.origin
			})

			// CSRF validation
			const csrfToken = formData.get('csrf')
			if (!validateCsrfToken(csrfToken)) {
				logger.error('CSRF validation failed')
				return {
					form: {
						data: Object.fromEntries(formData),
						errors: { _form: 'Invalid security token. Please try again.' },
						isSubmitted: false
					}
				}
			}

			// Parse and validate form data
			let data = Object.fromEntries(formData)
			let errors = {}

			// Use custom form data parser if provided
			if (typeof formDataParser === 'function') {
				const result = await formDataParser(formData, slug)
				if (result) {
					data = result.data || data
					errors = result.errors || {}
				}
			}

			// Return early if validation errors
			if (Object.keys(errors).length > 0) {
				return {
					form: { data, errors, isSubmitted: false }
				}
			}

			try {
				// Create a submission handler if provided
				let submissionHandler
				if (typeof createSubmissionHandler === 'function') {
					submissionHandler = await createSubmissionHandler(locals)
				}

				// Process the submission
				const fullData = { ...data, category: slug }
				if (submissionHandler) {
					await submissionHandler(fullData, slug)
				}

				logger.info('Form submission processed successfully', { category: slug })

				// Redirect to success page
				throw redirect(303, `/${ lang }${ successPath }?category=${ slug }`)
			} catch (error) {
				logger.error('Form submission error', { error })

				// Check if reCAPTCHA validation failed
				if (error.message && error.message.includes('reCAPTCHA')) {
					return {
						form: {
							data,
							errors: { _form: 'reCAPTCHA validation failed. Please try again.' },
							isSubmitted: false
						}
					}
				}

				// Use custom error handler if provided
				if (typeof errorHandler === 'function') {
					const customError = await errorHandler(error, { data, slug })
					if (customError) {
						return customError
					}
				}

				return {
					form: {
						data,
						errors: { _form: 'An error occurred. Please try again.' },
						isSubmitted: false
					}
				}
			}
		} catch (error) {
			// Don't catch redirects
			if (error.status === 303) {
				throw error
			}

			logger.error('Unexpected form submission error', { error })

			return {
				form: {
					data: {},
					errors: { _form: 'An unexpected error occurred. Please try again.' },
					isSubmitted: false
				}
			}
		}
	}

	return {
		load,
		handleSubmission,
		categories
	}
}

/**
 * Creates SvelteKit route handlers for categorized contact forms
 * 
 * @param {Object} config - Configuration for the category router
 * @returns {Object} SvelteKit route handlers
 */
export function createContactRouteHandlers(config) {
	const router = createCategoryRouter(config)

	return {
		load: (params) => router.load(params),
		actions: {
			default: (params) => router.handleSubmission(params)
		}
	}
}