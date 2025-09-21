/**
 * @fileoverview Server-side reCAPTCHA verification service for @goobits/forms
 * Handles verification of reCAPTCHA tokens with Google's API including score validation
 */
/**
 * reCAPTCHA verification options interface
 */
export interface RecaptchaVerificationOptions {
    /** reCAPTCHA secret key from Google */
    secretKey?: string;
    /** Expected action name (for v3 only) */
    action?: string | null;
    /** Minimum score required for v3 (0.0 to 1.0) */
    minScore?: number;
    /** Allow requests in development without reCAPTCHA */
    allowInDevelopment?: boolean;
}
/**
 * reCAPTCHA API response interface
 */
export interface RecaptchaApiResponse {
    /** Whether the verification was successful */
    success: boolean;
    /** Timestamp of the challenge load */
    challenge_ts?: string;
    /** Hostname of the site where the reCAPTCHA was solved */
    hostname?: string;
    /** Score for v3 (0.0 to 1.0, where 1.0 is very likely a human) */
    score?: number;
    /** Action name for v3 */
    action?: string;
    /** Error codes if verification failed */
    'error-codes'?: string[];
}
/**
 * reCAPTCHA verifier function type
 */
export type RecaptchaVerifier = (token: string, action?: string) => Promise<boolean>;
/**
 * Verify a reCAPTCHA token with Google's API
 * Supports both v2 and v3 reCAPTCHA with score and action validation
 *
 * @param {string} token - The reCAPTCHA token to verify
 * @param {RecaptchaVerificationOptions} [options] - Verification configuration options
 * @returns {Promise<boolean>} Whether the token is valid and meets all criteria
 *
 * @example
 * ```typescript
 * const isValid = await verifyRecaptchaToken('reCAPTCHA_token_here', {
 *   secretKey: 'your_secret_key',
 *   action: 'submit_form',
 *   minScore: 0.7
 * });
 *
 * if (isValid) {
 *   console.log('reCAPTCHA verification passed');
 * } else {
 *   console.log('reCAPTCHA verification failed');
 * }
 * ```
 */
export declare function verifyRecaptchaToken(token: string, options?: RecaptchaVerificationOptions): Promise<boolean>;
/**
 * Create a reusable reCAPTCHA verifier function with preset configuration
 * Useful for creating configured verifiers that can be reused throughout the application
 *
 * @param {RecaptchaVerificationOptions} [config] - Default configuration for the verifier
 * @returns {RecaptchaVerifier} Configured verifier function
 *
 * @example
 * ```typescript
 * const verifier = createRecaptchaVerifier({
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY,
 *   minScore: 0.7,
 *   allowInDevelopment: false
 * });
 *
 * // Use the verifier
 * const isValid = await verifier('token_here', 'submit_form');
 * ```
 */
export declare function createRecaptchaVerifier(config?: RecaptchaVerificationOptions): RecaptchaVerifier;
/**
 * Get or create the default reCAPTCHA verifier instance
 * Uses environment variables for configuration and provides a singleton verifier
 *
 * @param {RecaptchaVerificationOptions} [options] - Optional configuration to override defaults
 * @returns {RecaptchaVerifier} Configured verifier function
 *
 * @example
 * ```typescript
 * // Use with environment variables
 * const verifier = getDefaultRecaptchaVerifier();
 * const isValid = await verifier('token_here', 'submit');
 *
 * // Override default configuration
 * const strictVerifier = getDefaultRecaptchaVerifier({
 *   minScore: 0.8,
 *   allowInDevelopment: false
 * });
 * ```
 */
export declare function getDefaultRecaptchaVerifier(options?: RecaptchaVerificationOptions): RecaptchaVerifier;
/**
 * Validate reCAPTCHA configuration options
 * Ensures that the provided options are valid and complete
 *
 * @param {RecaptchaVerificationOptions} options - Options to validate
 * @throws {Error} When options are invalid
 *
 * @example
 * ```typescript
 * try {
 *   validateRecaptchaOptions({
 *     secretKey: 'your_secret_key',
 *     minScore: 0.5,
 *     action: 'submit_form'
 *   });
 *   console.log('Options are valid');
 * } catch (error) {
 *   console.error('Invalid options:', error.message);
 * }
 * ```
 */
export declare function validateRecaptchaOptions(options: RecaptchaVerificationOptions): void;
/**
 * Extract detailed information from a reCAPTCHA verification response
 * Useful for debugging and logging verification details
 *
 * @param {string} token - The reCAPTCHA token to verify
 * @param {RecaptchaVerificationOptions} [options] - Verification options
 * @returns {Promise<RecaptchaApiResponse | null>} Detailed response or null on error
 *
 * @example
 * ```typescript
 * const details = await getRecaptchaDetails('token_here', {
 *   secretKey: 'your_secret_key'
 * });
 *
 * if (details?.success) {
 *   console.log(`Score: ${details.score}, Action: ${details.action}`);
 * }
 * ```
 */
export declare function getRecaptchaDetails(token: string, options?: RecaptchaVerificationOptions): Promise<RecaptchaApiResponse | null>;
/**
 * Type guard to check if an object is a valid RecaptchaApiResponse
 *
 * @param {any} obj - Object to check
 * @returns {obj is RecaptchaApiResponse} True if object is a valid API response
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/recaptcha');
 * const data = await response.json();
 *
 * if (isRecaptchaApiResponse(data)) {
 *   console.log(`Verification ${data.success ? 'passed' : 'failed'}`);
 * }
 * ```
 */
export declare function isRecaptchaApiResponse(obj: any): obj is RecaptchaApiResponse;
/**
 * Create a middleware function for SvelteKit that verifies reCAPTCHA tokens
 * Returns a function that can be used in SvelteKit hooks or endpoints
 *
 * @param {RecaptchaVerificationOptions} [options] - Verification configuration
 * @returns {(token: string, action?: string) => Promise<boolean>} Middleware function
 *
 * @example
 * ```typescript
 * // In your SvelteKit endpoint
 * const verifyRecaptcha = createRecaptchaMiddleware({
 *   secretKey: process.env.RECAPTCHA_SECRET_KEY,
 *   minScore: 0.7
 * });
 *
 * export async function POST({ request }) {
 *   const { token } = await request.json();
 *   const isValid = await verifyRecaptcha(token, 'submit_form');
 *
 *   if (!isValid) {
 *     return new Response('reCAPTCHA verification failed', { status: 400 });
 *   }
 *
 *   // Process the request
 * }
 * ```
 */
export declare function createRecaptchaMiddleware(options?: RecaptchaVerificationOptions): (token: string, action?: string) => Promise<boolean>;
