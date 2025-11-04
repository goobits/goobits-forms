/**
 * @fileoverview Thin TypeScript adapter around @goobits/security/rateLimiter
 * Translates between forms package interface ({ allowed }) and security package interface ({ isLimited })
 */

import { rateLimitFormSubmission as rateLimitFormSubmissionCore } from '@goobits/security/rateLimiter';

/**
 * Rate limiting result interface (forms package format)
 */
export interface RateLimitResult {
	/** Whether the request is allowed */
	allowed: boolean;
	/** Seconds to wait before retrying (only present when allowed is false) */
	retryAfter?: number;
	/** Type of limit that was exceeded */
	limitType?: 'short' | 'medium' | 'long' | 'email';
	/** Human-readable message describing the limit */
	message?: string;
	/** Window size in milliseconds (for email-based limits) */
	windowMs?: number;
	/** Maximum requests allowed in the window */
	maxRequests?: number;
}

/**
 * Form submission rate limiting options
 */
export interface FormRateLimitOptions {
	/** Maximum number of requests allowed in the time window */
	maxRequests?: number;
	/** Time window in milliseconds */
	windowMs?: number;
	/** Custom message for rate limit exceeded */
	message?: string;
	/** Skip IP-based rate checking */
	skipIpCheck?: boolean;
}

/**
 * Rate limit a form submission by IP and/or email
 * Delegates to @goobits/security/rateLimiter and adapts the return shape
 *
 * @param {string} ipAddress - Client IP address
 * @param {string | null} email - User's email address (optional)
 * @param {string} formType - Type of form being submitted
 * @param {FormRateLimitOptions} [options] - Rate limiting options
 * @returns {RateLimitResult} Rate limit result with allowed flag
 *
 * @example
 * ```typescript
 * const result = rateLimitFormSubmission('127.0.0.1', 'user@example.com', 'contact', {
 *   maxRequests: 5,
 *   windowMs: 60000
 * });
 *
 * if (!result.allowed) {
 *   return json({ error: result.message }, { status: 429 });
 * }
 * ```
 */
export function rateLimitFormSubmission(
	ipAddress: string,
	email: string | null,
	formType: string = 'contact',
	options: FormRateLimitOptions = {}
): RateLimitResult {
	// Delegate to @goobits/security/rateLimiter (synchronous)
	const securityResult = rateLimitFormSubmissionCore(ipAddress, email, formType, options);

	// Adapt { isLimited } to { allowed } interface
	return {
		allowed: !securityResult.isLimited,
		retryAfter: securityResult.retryAfter,
		limitType: securityResult.limitType,
		message: securityResult.message,
		windowMs: securityResult.windowMs,
		maxRequests: securityResult.maxRequests
	};
}
