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
 * reCAPTCHA API detailed response interface (matches @goobits/security/recaptcha)
 */
export interface RecaptchaApiResponse {
	/** Whether the verification was successful */
	success: boolean;
	/** Error message if verification failed */
	error?: string;
	/** HTTP status code from reCAPTCHA API */
	statusCode?: number;
	/** Development mode bypass flag */
	devBypass?: boolean;
	/** Timestamp of the challenge load */
	challenge_ts?: string;
	/** Hostname of the site where the reCAPTCHA was solved */
	hostname?: string;
	/** Score for v3 (0.0 to 1.0, where 1.0 is very likely a human) */
	score?: number;
	/** Whether the score passed the minimum threshold */
	scorePassed?: boolean;
	/** Action name for v3 */
	action?: string;
	/** Whether the action passed validation (matches expected action) */
	actionPassed?: boolean;
	/** Expected action name for v3 verification */
	expectedAction?: string | null;
	/** Error codes from Google's API if verification failed */
	'error-codes'?: string[];
	/** Error codes in camelCase format */
	errorCodes?: string[];
	/** Full response data from Google's reCAPTCHA API */
	data?: any;
	/** Error stack trace (only in development) */
	stack?: string;
}

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
