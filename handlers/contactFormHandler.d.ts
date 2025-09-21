/**
 * Contact form handler module
 * Provides reusable handlers for contact form processing
 */
import type { RequestHandler } from '@sveltejs/kit';
/**
 * Rate limiting result interface
 */
export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;
    /** Time to wait before retry (in seconds) */
    retryAfter?: number;
}
/**
 * Custom validation function type
 */
export type CustomValidation = (data: Record<string, any>) => Promise<Record<string, string> | null>;
/**
 * Custom success handler function type
 */
export type CustomSuccessHandler = (data: Record<string, any>, clientAddress: string) => Promise<Record<string, any> | null>;
/**
 * Email service configuration interface
 */
export interface EmailServiceConfig {
    /** Email service provider */
    provider?: string;
    /** Additional configuration options */
    [key: string]: any;
}
/**
 * Contact form submission data interface
 */
export interface ContactFormData {
    /** Sender's name */
    name: string;
    /** Sender's email address */
    email: string;
    /** Message content */
    message: string;
    /** Optional phone number */
    phone?: string;
    /** Optional subject line */
    subject?: string;
    /** Form category */
    category?: string;
    /** reCAPTCHA token */
    recaptchaToken?: string;
}
/**
 * API handler configuration options
 */
export interface ContactApiHandlerOptions {
    /** Admin email address to receive notifications */
    adminEmail?: string;
    /** From email address for notifications */
    fromEmail?: string;
    /** Email service configuration */
    emailServiceConfig?: EmailServiceConfig;
    /** Success message to return */
    successMessage?: string;
    /** Generic error message */
    errorMessage?: string;
    /** Rate limit exceeded message */
    rateLimitMessage?: string;
    /** reCAPTCHA secret key */
    recaptchaSecretKey?: string;
    /** Minimum reCAPTCHA score required */
    recaptchaMinScore?: number;
    /** Maximum requests allowed in rate limit window */
    rateLimitMaxRequests?: number;
    /** Rate limit time window in milliseconds */
    rateLimitWindowMs?: number;
    /** Whether to log form submissions */
    logSubmissions?: boolean;
    /** Custom validation function */
    customValidation?: CustomValidation | null;
    /** Custom success handler */
    customSuccessHandler?: CustomSuccessHandler | null;
}
/**
 * API response interface for successful submissions
 */
export interface ApiSuccessResponse {
    /** Success status */
    success: true;
    /** Success message */
    message: string;
    /** Additional response data */
    [key: string]: any;
}
/**
 * API response interface for failed submissions
 */
export interface ApiErrorResponse {
    /** Success status */
    success: false;
    /** Error message */
    error?: string;
    /** Field-specific errors */
    errors?: Record<string, string>;
    /** Retry after time for rate limits */
    retryAfter?: number;
}
/**
 * API response type union
 */
export type ApiResponse = ApiSuccessResponse | ApiErrorResponse;
/**
 * Create a contact form POST handler for API endpoints
 *
 * @param options - Handler configuration options
 * @returns SvelteKit POST handler function
 *
 * @example
 * ```typescript
 * // In +server.ts
 * export const POST = createContactApiHandler({
 *   adminEmail: 'admin@example.com',
 *   fromEmail: 'noreply@example.com',
 *   rateLimitMaxRequests: 5,
 *   recaptchaMinScore: 0.7
 * });
 * ```
 */
export declare function createContactApiHandler(options?: ContactApiHandlerOptions): RequestHandler;
/**
 * Form handlers configuration options
 */
export interface ContactFormHandlersOptions extends ContactApiHandlerOptions {
}
/**
 * Complete form handlers interface
 */
export interface ContactFormHandlers {
    /** POST request handler */
    POST: RequestHandler;
}
/**
 * Create complete contact form handlers with GET and POST
 *
 * @param options - Handler configuration options
 * @returns Object with POST handler for contact form processing
 *
 * @example
 * ```typescript
 * // In +server.ts
 * const handlers = createContactFormHandlers({
 *   adminEmail: 'contact@company.com',
 *   successMessage: 'Thanks for reaching out!',
 *   rateLimitMaxRequests: 10
 * });
 *
 * export const { POST } = handlers;
 * ```
 */
export declare function createContactFormHandlers(options?: ContactFormHandlersOptions): ContactFormHandlers;
