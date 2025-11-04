/**
 * @fileoverview Thin TypeScript wrapper around @goobits/security/recaptcha
 * Re-exports security package functions with TypeScript types for forms package
 */

import {
	verifyRecaptchaToken as verifyRecaptchaTokenCore,
	verifyRecaptchaTokenWithDetails as verifyRecaptchaTokenWithDetailsCore
} from '@goobits/security/recaptcha';

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
 * reCAPTCHA API detailed response interface
 * Automatically derived from @goobits/security/recaptcha to prevent drift
 */
export type RecaptchaApiResponse = Awaited<ReturnType<typeof verifyRecaptchaTokenWithDetailsCore>>

/**
 * Verify a reCAPTCHA token with Google's API
 * Delegates to @goobits/security/recaptcha with TypeScript types
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
 * ```
 */
export async function verifyRecaptchaToken(
	token: string,
	options: RecaptchaVerificationOptions = {}
): Promise<boolean> {
	// Delegate to @goobits/security/recaptcha
	return verifyRecaptchaTokenCore(token, options);
}

/**
 * Verify a reCAPTCHA token and get detailed response
 * Delegates to @goobits/security/recaptcha with TypeScript types
 *
 * @param {string} token - The reCAPTCHA token to verify
 * @param {RecaptchaVerificationOptions} [options] - Verification configuration options
 * @returns {Promise<RecaptchaApiResponse>} Detailed response object (never null)
 *
 * @example
 * ```typescript
 * const details = await verifyRecaptchaTokenWithDetails('token_here', {
 *   secretKey: 'your_secret_key'
 * });
 *
 * if (details.success) {
 *   console.log(`Score: ${details.score}, Action: ${details.action}`);
 * } else {
 *   console.error(`Error: ${details.error}`);
 * }
 * ```
 */
export async function verifyRecaptchaTokenWithDetails(
	token: string,
	options: RecaptchaVerificationOptions = {}
): Promise<RecaptchaApiResponse> {
	// Delegate to @goobits/security/recaptcha
	return verifyRecaptchaTokenWithDetailsCore(token, options) as Promise<RecaptchaApiResponse>;
}

/**
 * Type guard to check if an object is a valid RecaptchaApiResponse
 */
export function isRecaptchaApiResponse(obj: any): obj is RecaptchaApiResponse {
	return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
}
