/**
 * ContactForm i18n Hooks
 *
 * @fileoverview Utilities for integrating contact forms with i18n solutions in SvelteKit.
 * Provides hooks and load functions for handling internationalization in form processing.
 *
 * @module i18n/hooks
 * @author @goobits
 * @version 1.0.0
 * @since 1.0.0
 */

import type { RequestEvent, Handle } from '@sveltejs/kit';
import { getContactFormConfig } from "../config/index.ts";

/**
 * Type definition for i18n handler function
 */
type I18nHandler = (event: RequestEvent) => Promise<void> | void;

/**
 * Type definition for SvelteKit load function
 */
type LoadFunction<T = Record<string, any>> = (event: RequestEvent) => Promise<T> | T;

/**
 * Type definition for i18n data returned by load functions
 */
interface I18nLoadData {
  lang: string;
  supportedLanguages: string[];
}

/**
 * Type definition for load function result with i18n data
 */
interface LoadResultWithI18n {
  i18n?: I18nLoadData;
  [key: string]: any;
}

// Get the contact form configuration
const formConfig = getContactFormConfig();

/**
 * Server hook for handling i18n in incoming requests
 * This should be called from your main hooks.server.js handle function
 *
 * @param event - SvelteKit handle event containing request information
 * @param handler - Optional custom i18n handler function for processing locale
 * @returns Promise that resolves when i18n processing is complete
 *
 * @example
 * ```typescript
 * // In hooks.server.ts
 * import { handleFormI18n } from '@goobits/forms/i18n'
 * import type { Handle } from '@sveltejs/kit'
 *
 * export const handle: Handle = async ({ event, resolve }) => {
 *   // Handle form i18n
 *   await handleFormI18n(event, async (event) => {
 *     // Custom i18n logic here
 *     event.locals.lang = detectLanguage(event.request.headers);
 *   })
 *
 *   // Your other handlers...
 *
 *   // Resolve the request
 *   return await resolve(event)
 * }
 * ```
 *
 * @throws Will log errors but not throw to avoid breaking request flow
 */
export async function handleFormI18n(
  event: RequestEvent,
  handler?: I18nHandler
): Promise<void> {
  // Only run if i18n is enabled and the URL is related to the contact form
  // Using startsWith for path-based check instead of includes for better security
  if (
    formConfig.i18n?.enabled &&
    event.url.pathname &&
    (event.url.pathname === formConfig.formUri ||
      event.url.pathname.startsWith(formConfig.formUri + "/"))
  ) {
    // Only call handler if it's actually a function
    if (typeof handler === "function") {
      try {
        await handler(event);
      } catch (error) {
        // Import logger inline to avoid circular dependencies
        const { createLogger } = await import("../utils/logger.ts");
        const logger = createLogger("ContactFormI18n");

        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error("Error in contactform i18n handler:", errorMessage);
        // Don't rethrow to avoid breaking the request flow
      }
    }
  }
}

/**
 * Page server load hook for handling i18n in page server loads
 *
 * @param event - SvelteKit page server load event
 * @param originalLoad - The original load function if any
 * @returns Promise resolving to the load function result with i18n data
 *
 * @example
 * ```typescript
 * // In +page.server.ts
 * import { loadWithFormI18n } from '@goobits/forms/i18n'
 * import type { PageServerLoad } from './$types'
 *
 * export const load: PageServerLoad = async (event) => {
 *   // Your original load function
 *   const originalLoad = async () => {
 *     return { yourData: 'here' }
 *   }
 *
 *   // Use the i18n-enhanced load function
 *   return await loadWithFormI18n(event, originalLoad)
 * }
 * ```
 */
export async function loadWithFormI18n<T extends Record<string, any> = Record<string, any>>(
  event: RequestEvent,
  originalLoad?: LoadFunction<T>
): Promise<T & LoadResultWithI18n> {
  // Call the original load function if provided and it's a function
  const originalData: T =
    typeof originalLoad === "function" ? await originalLoad(event) : {} as T;

  // Skip if i18n is not enabled
  if (!formConfig.i18n?.enabled) {
    return originalData as T & LoadResultWithI18n;
  }

  // Get the language from locals or use default
  const lang: string = (event.locals as any)?.lang || formConfig.i18n.defaultLanguage;

  // Return the data with i18n information
  return {
    ...originalData,
    i18n: {
      lang,
      supportedLanguages: formConfig.i18n.supportedLanguages,
    },
  } as T & LoadResultWithI18n;
}

/**
 * Layout server load hook for adding i18n data to layouts
 *
 * @param event - SvelteKit layout server load event
 * @param originalLoad - The original load function if any
 * @returns Promise resolving to the load function result with i18n data
 *
 * @example
 * ```typescript
 * // In +layout.server.ts
 * import { layoutLoadWithFormI18n } from '@goobits/forms/i18n'
 * import type { LayoutServerLoad } from './$types'
 *
 * export const load: LayoutServerLoad = async (event) => {
 *   return await layoutLoadWithFormI18n(event, async () => {
 *     return { layoutData: 'example' }
 *   })
 * }
 * ```
 */
export async function layoutLoadWithFormI18n<T extends Record<string, any> = Record<string, any>>(
  event: RequestEvent,
  originalLoad?: LoadFunction<T>
): Promise<T & LoadResultWithI18n> {
  // This is similar to loadWithFormI18n but typically used in +layout.server.js
  return await loadWithFormI18n(event, originalLoad);
}