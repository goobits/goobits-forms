/**
 * ContactForm i18n utilities
 *
 * @fileoverview Internationalization utilities for form components, providing
 * message handling, locale management, and SvelteKit integration hooks for
 * building multi-language form interfaces.
 *
 * @module i18n
 * @author @goobits
 * @version 1.0.0
 * @since 1.0.0
 */

import { createMessageGetter, getMergedMessages } from '../utils/messages.ts';
import { handleFormI18n, loadWithFormI18n, layoutLoadWithFormI18n } from './hooks.ts';

/**
 * Re-exported internationalization utilities and hooks
 *
 * @example
 * ```typescript
 * import { createMessageGetter, handleFormI18n } from '@goobits/ui/i18n';
 *
 * // Create a message getter for a specific locale
 * const t = createMessageGetter('en', messages);
 *
 * // Use in SvelteKit load function
 * export const load = loadWithFormI18n({
 *   defaultLocale: 'en',
 *   supportedLocales: ['en', 'es', 'fr']
 * });
 * ```
 */
export {
	/**
	 * Creates a message getter function for retrieving localized strings
	 * @see {@link ../utils/messages.ts}
	 */
	createMessageGetter,

	/**
	 * Merges multiple message objects with proper locale handling
	 * @see {@link ../utils/messages.ts}
	 */
	getMergedMessages,

	/**
	 * SvelteKit handle hook for processing internationalization requests
	 * @see {@link ./hooks.ts}
	 */
	handleFormI18n,

	/**
	 * SvelteKit load function wrapper with i18n support
	 * @see {@link ./hooks.ts}
	 */
	loadWithFormI18n,

	/**
	 * SvelteKit layout load function wrapper with i18n support
	 * @see {@link ./hooks.ts}
	 */
	layoutLoadWithFormI18n
};
