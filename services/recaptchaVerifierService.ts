/**
 * @fileoverview Server-side reCAPTCHA verification service for @goobits/forms
 * Handles verification of reCAPTCHA tokens with Google's API including score validation
 */

import { createLogger } from '../utils/logger.ts';

const logger = createLogger('RecaptchaVerifier');

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
export async function verifyRecaptchaToken(
	token: string,
	options: RecaptchaVerificationOptions = {}
): Promise<boolean> {
	const { secretKey, action = null, minScore = 0.5, allowInDevelopment = true } = options;

	if (!token) {
		logger.warn('No reCAPTCHA token provided');
		return false;
	}

	if (!secretKey) {
		logger.warn('No reCAPTCHA secret key provided');
		// In production, fail closed (return false)
		// In development, optionally allow the request to proceed
		return process.env.NODE_ENV !== 'production' && allowInDevelopment;
	}

	try {
		// Prepare the verification request
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				secret: secretKey,
				response: token
			})
		});

		if (!response.ok) {
			logger.error('reCAPTCHA verification API failed:', {
				status: response.status,
				statusText: response.statusText
			});
			return false;
		}

		const data: RecaptchaApiResponse = await response.json();

		// Check if the verification was successful
		if (!data.success) {
			logger.warn('reCAPTCHA verification failed:', {
				errorCodes: data['error-codes'] || [],
				token: token.substring(0, 10) + '...' // Log just the beginning of the token
			});
			return false;
		}

		// Check the score if available (v3 only)
		if (typeof data.score === 'number') {
			if (data.score < minScore) {
				logger.warn('reCAPTCHA score too low:', {
					score: data.score,
					minimum: minScore,
					action: data.action
				});
				return false;
			}

			// Verify the action if provided
			if (action && data.action !== action) {
				logger.warn('reCAPTCHA action mismatch:', {
					expected: action,
					actual: data.action,
					score: data.score
				});
				return false;
			}
		}

		return true;
	} catch (error) {
		logger.error('Error verifying reCAPTCHA token:', error);
		return false;
	}
}

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
export function createRecaptchaVerifier(
	config: RecaptchaVerificationOptions = {}
): RecaptchaVerifier {
	return (token: string, action?: string) =>
		verifyRecaptchaToken(token, {
			...config,
			action
		});
}

// Default verifier that checks environment variables
let defaultVerifier: RecaptchaVerifier | null = null;

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
export function getDefaultRecaptchaVerifier(
	options: RecaptchaVerificationOptions = {}
): RecaptchaVerifier {
	if (!defaultVerifier || options.force) {
		// First try environment variable
		const secretKey = options.secretKey || process.env.RECAPTCHA_SECRET_KEY;

		defaultVerifier = createRecaptchaVerifier({
			secretKey,
			minScore: options.minScore || 0.5,
			allowInDevelopment: options.allowInDevelopment !== false
		});
	}

	return defaultVerifier;
}

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
export function validateRecaptchaOptions(options: RecaptchaVerificationOptions): void {
	if (options.minScore !== undefined) {
		if (typeof options.minScore !== 'number' || options.minScore < 0 || options.minScore > 1) {
			throw new Error('minScore must be a number between 0 and 1');
		}
	}

	if (options.action !== undefined && options.action !== null) {
		if (typeof options.action !== 'string' || options.action.trim().length === 0) {
			throw new Error('action must be a non-empty string');
		}
	}

	if (options.secretKey !== undefined) {
		if (typeof options.secretKey !== 'string' || options.secretKey.trim().length === 0) {
			throw new Error('secretKey must be a non-empty string');
		}
	}
}

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
export async function getRecaptchaDetails(
	token: string,
	options: RecaptchaVerificationOptions = {}
): Promise<RecaptchaApiResponse | null> {
	const { secretKey } = options;

	if (!token || !secretKey) {
		return null;
	}

	try {
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				secret: secretKey,
				response: token
			})
		});

		if (!response.ok) {
			return null;
		}

		return await response.json();
	} catch (error) {
		logger.error('Error getting reCAPTCHA details:', error);
		return null;
	}
}

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
export function isRecaptchaApiResponse(obj: any): obj is RecaptchaApiResponse {
	return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
}

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
export function createRecaptchaMiddleware(options: RecaptchaVerificationOptions = {}) {
	const verifier = createRecaptchaVerifier(options);

	return async (token: string, action?: string): Promise<boolean> => {
		try {
			return await verifier(token, action);
		} catch (error) {
			logger.error('reCAPTCHA middleware error:', error);
			return false;
		}
	};
}
