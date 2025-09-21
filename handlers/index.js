/**
 * Route handlers for contact form endpoints
 */
import { json } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { getContactFormConfig } from '../config/index.js';
import { getValidatorForCategory } from '../validation/index.js';
// Export simplified contact form handler
export * from './contactFormHandler.js';
/**
 * Create a page load handler for the contact form
 *
 * @param options - Handler configuration options
 * @returns SvelteKit load function for contact form pages
 *
 * @example
 * ```typescript
 * // In +page.server.ts
 * export const load = createContactPageHandler({
 *   getCategory: (url) => url.searchParams.get('type') || 'general',
 *   config: customFormConfig
 * });
 * ```
 */
export function createContactPageHandler(options = {}) {
    const { getCategory = (url) => url.searchParams.get('type') || 'general', config = null, } = options;
    return async ({ url }) => {
        const finalConfig = config || getContactFormConfig();
        const category = getCategory(url);
        // Validate category exists
        if (!finalConfig.categories[category]) {
            return {
                form: await superValidate({}, zod4(finalConfig.schemas.categories.general)),
                category: 'general',
            };
        }
        // Use category-specific validator
        const validator = getValidatorForCategory(finalConfig, category);
        const form = await superValidate({ category }, validator);
        return {
            form,
            category,
        };
    };
}
/**
 * Create a GET handler for the contact API
 *
 * @param options - Handler configuration options
 * @returns SvelteKit GET handler for contact API endpoints
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const GET = createContactGetHandler({
 *   defaultCategory: 'support',
 *   config: customFormConfig
 * });
 * ```
 */
export function createContactGetHandler(options = {}) {
    const { defaultCategory = 'general', config = null } = options;
    return async () => {
        const finalConfig = config || getContactFormConfig();
        const form = await superValidate({ category: defaultCategory }, zod4(finalConfig.schemas.categories[defaultCategory]));
        const result = {
            form,
            category: defaultCategory,
        };
        return json(result);
    };
}
/**
 * Create a POST handler for the contact API
 *
 * @param options - Handler configuration options
 * @returns SvelteKit POST handler for contact form submissions
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const POST = createContactPostHandler({
 *   rateLimiter: customRateLimiter,
 *   successHandler: async (context) => {
 *     await sendNotificationEmail(context.data);
 *     return { message: 'Email sent successfully!' };
 *   }
 * });
 * ```
 */
export function createContactPostHandler(options = {}) {
    const { config = null, rateLimiter = null, sanitizer = null, recaptchaVerifier = null, successHandler = null, errorHandler = null, logger = console, } = options;
    return async ({ request, locals }) => {
        const finalConfig = config || getContactFormConfig();
        try {
            // Parse request body
            const rawData = await request.json();
            const { category = 'general', recaptchaToken, ...formData } = rawData;
            // Rate limiting
            if (rateLimiter) {
                const rateLimitResult = await rateLimiter(locals);
                if (!rateLimitResult.allowed) {
                    return json({
                        success: false,
                        error: 'Too many requests. Please try again later.',
                    }, { status: 429 });
                }
            }
            // Verify reCAPTCHA if enabled
            if (finalConfig.recaptcha.enabled && recaptchaVerifier) {
                const recaptchaValid = await recaptchaVerifier(recaptchaToken || '');
                if (!recaptchaValid) {
                    return json({
                        success: false,
                        error: finalConfig.errorMessages.recaptchaVerification,
                    }, { status: 403 });
                }
            }
            // Sanitize data
            const sanitizedData = sanitizer ? await sanitizer(formData) : formData;
            // Validate form data
            const validator = getValidatorForCategory(finalConfig, category);
            const result = await superValidate(sanitizedData, validator);
            if (!result.valid) {
                return json({
                    success: false,
                    errors: result.errors,
                    form: result,
                }, { status: 400 });
            }
            // Process successful submission
            if (successHandler) {
                try {
                    const response = await successHandler({
                        data: sanitizedData,
                        category,
                        locals,
                        request,
                    });
                    return json({
                        success: true,
                        message: response.message || 'Message sent successfully!',
                        ...response,
                    });
                }
                catch (error) {
                    logger.error('Success handler error:', error);
                    throw error;
                }
            }
            // Default success response
            return json({
                success: true,
                message: 'Thank you for your message! We\'ll get back to you soon.',
            });
        }
        catch (error) {
            // Handle errors
            if (errorHandler) {
                const errorResponse = await errorHandler(error);
                return json(errorResponse, { status: errorResponse.status || 500 });
            }
            logger.error('Contact form error:', error);
            return json({
                success: false,
                error: 'An error occurred. Please try again later.',
            }, { status: 500 });
        }
    };
}
/**
 * Create combined handlers for a contact route
 *
 * @param options - Handler configuration options
 * @returns Object with GET and POST handlers for contact endpoints
 *
 * @example
 * ```typescript
 * // In +server.ts
 * const { GET, POST } = createContactHandlers({
 *   defaultCategory: 'inquiry',
 *   rateLimiter: myRateLimiter,
 *   successHandler: mySuccessHandler
 * });
 *
 * export { GET, POST };
 * ```
 */
export function createContactHandlers(options = {}) {
    return {
        GET: createContactGetHandler(options),
        POST: createContactPostHandler(options),
    };
}
