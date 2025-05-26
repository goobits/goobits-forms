/**
 * ContactForm i18n Hooks
 *
 * Utilities for integrating contactform with your i18n solution
 */

import { getContactFormConfig } from '../config/index.js'

// Get the contact form configuration
const formConfig = getContactFormConfig()

/**
 * Server hook for handling i18n in incoming requests
 * This should be called from your main hooks.server.js handle function
 *
 * @param {Object} event - SvelteKit handle event
 * @param {Function} [handler] - Optional custom i18n handler
 * @returns {Promise<void>}
 *
 * @example
 * // In hooks.server.js
 * import { handleFormI18n } from '@goobits/contactform/i18n'
 *
 * export async function handle({ event, resolve }) {
 *   // Handle form i18n
 *   await handleFormI18n(event)
 *
 *   // Your other handlers...
 *
 *   // Resolve the request
 *   return await resolve(event)
 * }
 */
export async function handleFormI18n(event, handler) {
	// Only run if i18n is enabled and the URL is related to the contact form
	// Using startsWith for path-based check instead of includes for better security
	if (formConfig.i18n?.enabled &&
		event.url.pathname &&
		(event.url.pathname === formConfig.formUri ||
		 event.url.pathname.startsWith(formConfig.formUri + '/'))) {

		// Only call handler if it's actually a function
		if (typeof handler === 'function') {
			try {
				await handler(event)
			} catch (error) {
				// Import logger inline to avoid circular dependencies
				const { createLogger } = await import('../utils/logger.js')
				const logger = createLogger('ContactFormI18n')
				logger.error('Error in contactform i18n handler:', error.message)
				// Don't rethrow to avoid breaking the request flow
			}
		}
	}
}

/**
 * Page server load hook for handling i18n in page server loads
 * @param {Object} event - SvelteKit page server load event
 * @param {Function} [originalLoad] - The original load function if any
 * @returns {Promise<Object>} The load function result with i18n data
 *
 * @example
 * // In +page.server.js
 * import { loadWithFormI18n } from '@goobits/contactform/i18n'
 *
 * export const load = async (event) => {
 *   // Your original load function
 *   const originalLoad = async () => {
 *     return { yourData: 'here' }
 *   }
 *
 *   // Use the i18n-enhanced load function
 *   return await loadWithFormI18n(event, originalLoad)
 * }
 */
export async function loadWithFormI18n(event, originalLoad) {
	// Call the original load function if provided and it's a function
	const originalData = (typeof originalLoad === 'function') ?
		await originalLoad(event) : {}

	// Skip if i18n is not enabled
	if (!formConfig.i18n?.enabled) {
		return originalData
	}

	// Get the language from locals or url
	const lang = event.locals?.lang || formConfig.i18n.defaultLanguage

	// Return the data with i18n information
	return {
		...originalData,
		i18n: {
			lang,
			supportedLanguages: formConfig.i18n.supportedLanguages
		}
	}
}

/**
 * Layout server load hook for adding i18n data to layouts
 * @param {Object} event - SvelteKit layout server load event
 * @param {Function} [originalLoad] - The original load function if any
 * @returns {Promise<Object>} The load function result with i18n data
 */
export async function layoutLoadWithFormI18n(event, originalLoad) {
	// This is similar to loadWithFormI18n but typically used in +layout.server.js
	return await loadWithFormI18n(event, originalLoad)
}

export default {
	handleFormI18n,
	loadWithFormI18n,
	layoutLoadWithFormI18n
}