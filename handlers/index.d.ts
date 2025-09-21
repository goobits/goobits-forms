/**
 * Route handlers for contact form endpoints
 */
import type { RequestHandler } from '@sveltejs/kit';
export * from './contactFormHandler.js';
/**
 * URL category extractor function type
 */
export type CategoryExtractor = (url: URL) => string;
/**
 * Rate limiter function type
 */
export type RateLimiter = (locals: any) => Promise<{
    allowed: boolean;
    retryAfter?: number;
}>;
/**
 * Data sanitizer function type
 */
export type DataSanitizer = (data: Record<string, any>) => Promise<Record<string, any>> | Record<string, any>;
/**
 * reCAPTCHA verifier function type
 */
export type RecaptchaVerifier = (token: string) => Promise<boolean>;
/**
 * Success handler context interface
 */
export interface SuccessHandlerContext {
    /** Sanitized form data */
    data: Record<string, any>;
    /** Form category */
    category: string;
    /** SvelteKit locals object */
    locals: any;
    /** Original request object */
    request: Request;
}
/**
 * Success handler function type
 */
export type SuccessHandler = (context: SuccessHandlerContext) => Promise<{
    message?: string;
    [key: string]: any;
}>;
/**
 * Error handler function type
 */
export type ErrorHandler = (error: Error) => Promise<{
    status?: number;
    [key: string]: any;
}>;
/**
 * Contact form configuration interface
 */
export interface ContactFormConfig {
    /** Category configurations */
    categories: Record<string, any>;
    /** Validation schemas */
    schemas: {
        categories: Record<string, any>;
    };
    /** reCAPTCHA configuration */
    recaptcha: {
        enabled: boolean;
    };
    /** Error messages */
    errorMessages: {
        recaptchaVerification: string;
    };
}
/**
 * Page handler options interface
 */
export interface ContactPageHandlerOptions {
    /** Function to extract category from URL */
    getCategory?: CategoryExtractor;
    /** Custom form configuration */
    config?: ContactFormConfig | null;
}
/**
 * Page load result interface
 */
export interface ContactPageLoadResult {
    /** Superforms form object */
    form: any;
    /** Selected category */
    category: string;
}
/**
 * GET handler options interface
 */
export interface ContactGetHandlerOptions {
    /** Default category to use */
    defaultCategory?: string;
    /** Custom form configuration */
    config?: ContactFormConfig | null;
}
/**
 * GET handler result interface
 */
export interface ContactGetResult {
    /** Superforms form object */
    form: any;
    /** Selected category */
    category: string;
}
/**
 * POST handler options interface
 */
export interface ContactPostHandlerOptions {
    /** Custom form configuration */
    config?: ContactFormConfig | null;
    /** Rate limiting function */
    rateLimiter?: RateLimiter | null;
    /** Data sanitization function */
    sanitizer?: DataSanitizer | null;
    /** reCAPTCHA verification function */
    recaptchaVerifier?: RecaptchaVerifier | null;
    /** Success handler function */
    successHandler?: SuccessHandler | null;
    /** Error handler function */
    errorHandler?: ErrorHandler | null;
    /** Logger instance */
    logger?: any;
}
/**
 * POST request data interface
 */
export interface ContactPostData {
    /** Form category */
    category?: string;
    /** reCAPTCHA token */
    recaptchaToken?: string;
    /** Additional form fields */
    [key: string]: any;
}
/**
 * Combined handlers interface
 */
export interface ContactHandlers {
    /** GET request handler */
    GET: RequestHandler;
    /** POST request handler */
    POST: RequestHandler;
}
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
export declare function createContactPageHandler(options?: ContactPageHandlerOptions): (event: any) => Promise<ContactPageLoadResult>;
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
export declare function createContactGetHandler(options?: ContactGetHandlerOptions): RequestHandler;
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
export declare function createContactPostHandler(options?: ContactPostHandlerOptions): RequestHandler;
/**
 * Combined handlers options interface
 */
export interface ContactHandlersOptions extends ContactGetHandlerOptions, ContactPostHandlerOptions {
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
export declare function createContactHandlers(options?: ContactHandlersOptions): ContactHandlers;
