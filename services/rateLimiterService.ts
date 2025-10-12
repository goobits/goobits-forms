/**
 * @fileoverview Rate limiter service for @goobits/forms
 * Provides configurable rate limiting for form submissions with multiple time windows
 */


/**
 * Rate limiting result interface
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
	/** Force recalculation (don't use existing rate limiter) */
	force?: boolean;
}

/**
 * Rate limiter configuration interface
 */
export interface RateLimiterConfig {
	/** Function to extract identifier from event */
	getIdentifier?: (event: any) => string | Promise<string>;
	/** Function to extract email from event */
	getEmail?: (event: any) => string | null | Promise<string | null>;
	/** Type of form being rate limited */
	formType?: string;
	/** Maximum requests in time window */
	maxRequests?: number;
	/** Time window in milliseconds */
	windowMs?: number;
	/** Custom rate limit message */
	message?: string;
}

/**
 * SvelteKit event interface (minimal definition)
 */
export interface SvelteKitEvent {
	/** Request object */
	request: Request;
	/** Function to get client address */
	getClientAddress?: () => string;
}

/**
 * Time window definitions in milliseconds
 */
const DEFAULT_TIME_WINDOWS = {
	SHORT: 1000 * 60, // 1 minute
	MEDIUM: 1000 * 60 * 10, // 10 minutes
	LONG: 1000 * 60 * 60 // 1 hour
} as const;

/**
 * Default rate limits (requests per time window)
 */
const DEFAULT_RATE_LIMITS = {
	SHORT: 5, // Max 5 requests per minute
	MEDIUM: 15, // Max 15 requests per 10 minutes
	LONG: 30 // Max 30 requests per hour
} as const;

// Store rate limiting data for IPs/users in memory
// In a production environment, this should be in a shared store like Redis
const ipLimits = new Map<string, number[]>();
const formSubmissionLimits = new Map<string, number[]>();

/**
 * Clean up expired entries from the rate limit maps
 * Removes timestamps older than the longest time window to prevent memory leaks
 *
 * @example
 * ```typescript
 * // Clean up expired rate limit entries
 * cleanupRateLimits();
 * console.log('Expired rate limit entries removed');
 * ```
 */
export function cleanupRateLimits(): void {
	const now = Date.now();

	// Clean up IP limits
	for (const [ip, entries] of ipLimits.entries()) {
		// Remove records older than the long window
		const filteredEntries = entries.filter(
			(timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
		);

		if (filteredEntries.length === 0) {
			ipLimits.delete(ip);
		} else {
			ipLimits.set(ip, filteredEntries);
		}
	}

	// Clean up form submission limits
	for (const [key, entries] of formSubmissionLimits.entries()) {
		// Remove records older than the long window
		const filteredEntries = entries.filter(
			(timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
		);

		if (filteredEntries.length === 0) {
			formSubmissionLimits.delete(key);
		} else {
			formSubmissionLimits.set(key, filteredEntries);
		}
	}
}

// Set up automatic cleanup every hour in environments that support setInterval
if (typeof setInterval !== 'undefined') {
	setInterval(cleanupRateLimits, 1000 * 60 * 60); // Run every hour
}

/**
 * Rate limit generic API requests by identifier with multiple time windows
 * Checks against short, medium, and long-term rate limits
 *
 * @param {string} identifier - User identifier (IP address, session ID, etc.)
 * @param {string} [action='default'] - The action being rate limited
 * @returns {RateLimitResult} Result object with allowed status and retry information
 *
 * @example
 * ```typescript
 * const result = rateLimitRequest('192.168.1.1', 'form:contact');
 * if (!result.allowed) {
 *   console.log(`Rate limited: ${result.message}`);
 *   console.log(`Retry after: ${result.retryAfter} seconds`);
 * }
 * ```
 */
export function rateLimitRequest(identifier: string): RateLimitResult {
	if (!identifier) {
		// If no identifier is provided, don't rate limit
		return { allowed: true };
	}

	const now = Date.now();

	// Get existing timestamps or create a new array
	const timestamps = ipLimits.get(identifier) || [];

	// Add current timestamp
	timestamps.push(now);

	// Update the map
	ipLimits.set(identifier, timestamps);

	// Check against various time windows
	const shortWindowCount = timestamps.filter(
		(timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.SHORT
	).length;

	const mediumWindowCount = timestamps.filter(
		(timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.MEDIUM
	).length;

	const longWindowCount = timestamps.filter(
		(timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
	).length;

	// Check if any rate limits are exceeded (short term first)
	if (shortWindowCount > DEFAULT_RATE_LIMITS.SHORT) {
		// Calculate when the rate limit will reset
		const oldestInWindow = timestamps
			.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.SHORT)
			.sort()[0];
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.SHORT - (now - oldestInWindow)) / 1000);

		return {
			allowed: false,
			retryAfter,
			limitType: 'short',
			message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
		};
	}

	if (mediumWindowCount > DEFAULT_RATE_LIMITS.MEDIUM) {
		const oldestInWindow = timestamps
			.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.MEDIUM)
			.sort()[0];
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.MEDIUM - (now - oldestInWindow)) / 1000);

		return {
			allowed: false,
			retryAfter,
			limitType: 'medium',
			message: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`
		};
	}

	if (longWindowCount > DEFAULT_RATE_LIMITS.LONG) {
		const oldestInWindow = timestamps
			.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.LONG)
			.sort()[0];
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.LONG - (now - oldestInWindow)) / 1000);

		return {
			allowed: false,
			retryAfter,
			limitType: 'long',
			message: `Daily limit reached. Please try again in ${Math.ceil(retryAfter / 60 / 60)} hours.`
		};
	}

	return { allowed: true };
}

/**
 * Rate limit form submissions with customizable limits and email-based tracking
 * Combines IP-based and email-based rate limiting for comprehensive protection
 *
 * @param {string} clientAddress - User's IP address
 * @param {string | null} [email] - Optional user's email address for stricter limits
 * @param {string} [formType='contact'] - Type of form being submitted
 * @param {FormRateLimitOptions} [options] - Optional custom rate limiting parameters
 * @returns {Promise<RateLimitResult>} Result with allowed status and retry information
 *
 * @example
 * ```typescript
 * const result = await rateLimitFormSubmission(
 *   '192.168.1.1',
 *   'user@example.com',
 *   'contact',
 *   { maxRequests: 3, windowMs: 3600000 } // 3 requests per hour
 * );
 *
 * if (!result.allowed) {
 *   throw new Error(`Rate limited: ${result.message}`);
 * }
 * ```
 */
export async function rateLimitFormSubmission(
	clientAddress: string,
	email?: string | null,
	formType: string = 'contact',
	options: FormRateLimitOptions = {}
): Promise<RateLimitResult> {
	const now = Date.now();

	// Default options
	const {
		maxRequests = 3,
		windowMs = DEFAULT_TIME_WINDOWS.LONG,
		message = "You've already submitted this form multiple times. Please try again later."
	} = options;

	// First check IP-based rate limiting (unless skipped by options)
	if (!options.skipIpCheck && clientAddress) {
		const ipResult = rateLimitRequest(clientAddress);
		if (!ipResult.allowed) {
			return ipResult;
		}
	}

	// If email is provided, also check email-based rate limiting
	if (email) {
		const emailKey = `email:${email}:${formType}`;
		const timestamps = formSubmissionLimits.get(emailKey) || [];

		// Add current timestamp
		timestamps.push(now);

		// Update the map
		formSubmissionLimits.set(emailKey, timestamps);

		// Filter timestamps within the window
		const windowCount = timestamps.filter((timestamp) => now - timestamp < windowMs).length;

		if (windowCount > maxRequests) {
			const oldestInWindow = timestamps.filter((timestamp) => now - timestamp < windowMs).sort()[0];
			const retryAfter = Math.ceil((windowMs - (now - oldestInWindow)) / 1000);

			// Create user-friendly message with appropriate time units
			let friendlyMessage = message;
			if (!options.message) {
				if (retryAfter < 60) {
					friendlyMessage = `Rate limit exceeded. Please try again in ${retryAfter} seconds.`;
				} else if (retryAfter < 3600) {
					friendlyMessage = `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`;
				} else {
					friendlyMessage = `Rate limit exceeded. Please try again in ${Math.ceil(retryAfter / 3600)} hours.`;
				}
			}

			return {
				allowed: false,
				retryAfter,
				limitType: 'email',
				windowMs,
				maxRequests,
				message: friendlyMessage
			};
		}
	}

	return { allowed: true };
}

/**
 * Extract client IP address from request headers
 * Checks common proxy headers to get the real client IP
 *
 * @param {Request} request - Request object with headers
 * @returns {string} IP address or fallback value
 *
 * @example
 * ```typescript
 * const ip = getClientIP(request);
 * console.log(`Client IP: ${ip}`);
 *
 * // Use in rate limiting
 * const rateLimitResult = rateLimitRequest(ip, 'api:submit');
 * ```
 */
export function getClientIP(request: Request): string {
	// Try common headers to get the real client IP
	const headers = request.headers;

	// Common headers for proxies (in order of preference)
	const ipHeaders = [
		'cf-connecting-ip', // Cloudflare
		'x-real-ip', // Nginx
		'x-forwarded-for', // Standard proxy
		'x-client-ip', // Apache
		'forwarded', // Standard
		'true-client-ip' // Akamai and Cloudflare
	];

	for (const header of ipHeaders) {
		const value = headers.get(header);
		if (value) {
			// x-forwarded-for can have multiple IPs, take the first one
			const ip = value.split(',')[0].trim();
			if (ip) {
				return ip;
			}
		}
	}

	// Fallback to a placeholder if we can't determine IP
	return 'unknown-ip';
}

/**
 * Create a rate limiter middleware function for SvelteKit
 * Returns a function that can be used in SvelteKit hooks or endpoints
 *
 * @param {RateLimiterConfig} [options] - Rate limiter configuration options
 * @returns {(event: SvelteKitEvent) => Promise<RateLimitResult>} Rate limiter function for SvelteKit hooks
 *
 * @example
 * ```typescript
 * // In your SvelteKit hooks.server.ts
 * const rateLimiter = createRateLimiter({
 *   formType: 'contact',
 *   maxRequests: 5,
 *   windowMs: 3600000, // 1 hour
 *   getEmail: async (event) => {
 *     const formData = await event.request.formData();
 *     return formData.get('email') as string;
 *   }
 * });
 *
 * export const handle = async ({ event, resolve }) => {
 *   if (event.url.pathname === '/submit-form') {
 *     const result = await rateLimiter(event);
 *     if (!result.allowed) {
 *       return new Response('Rate limited', { status: 429 });
 *     }
 *   }
 *   return resolve(event);
 * };
 * ```
 */
export function createRateLimiter(options: RateLimiterConfig = {}) {
	const {
		getIdentifier = ({ request, getClientAddress }: SvelteKitEvent) =>
			getClientAddress ? getClientAddress() : getClientIP(request),
		getEmail = () => null,
		formType = 'contact',
		maxRequests,
		windowMs,
		message
	} = options;

	return async (event: SvelteKitEvent): Promise<RateLimitResult> => {
		const identifier =
			typeof getIdentifier === 'function' ? await getIdentifier(event) : getIdentifier;

		const email = typeof getEmail === 'function' ? await getEmail(event) : getEmail;

		return rateLimitFormSubmission(identifier, email, formType, {
			maxRequests,
			windowMs,
			message
		});
	};
}

// Singleton instance for common use cases
let defaultRateLimiter: ((event: SvelteKitEvent) => Promise<RateLimitResult>) | null = null;

/**
 * Get or create the default rate limiter instance
 * Provides a singleton rate limiter for common use cases
 *
 * @param {RateLimiterConfig} [config] - Optional configuration to override defaults
 * @returns {(event: SvelteKitEvent) => Promise<RateLimitResult>} Rate limiter function
 *
 * @example
 * ```typescript
 * // Get the default rate limiter
 * const rateLimiter = getDefaultRateLimiter();
 *
 * // Or configure it on first use
 * const rateLimiter = getDefaultRateLimiter({
 *   formType: 'newsletter',
 *   maxRequests: 1,
 *   windowMs: 86400000 // 24 hours
 * });
 *
 * const result = await rateLimiter(event);
 * ```
 */
export function getDefaultRateLimiter(config: RateLimiterConfig = {}) {
	if (!defaultRateLimiter || config.force) {
		defaultRateLimiter = createRateLimiter(config);
	}
	return defaultRateLimiter;
}

/**
 * Get current rate limit statistics for an identifier
 * Useful for debugging or showing users their current usage
 *
 * @param {string} identifier - The identifier to check
 * @returns {object} Statistics about current rate limit usage
 *
 * @example
 * ```typescript
 * const stats = getRateLimitStats('192.168.1.1');
 * console.log(`Requests in last hour: ${stats.longWindow}`);
 * console.log(`Requests in last minute: ${stats.shortWindow}`);
 * ```
 */
export function getRateLimitStats(identifier: string) {
	if (!identifier) {
		return { shortWindow: 0, mediumWindow: 0, longWindow: 0 };
	}

	const now = Date.now();
	const timestamps = ipLimits.get(identifier) || [];

	return {
		shortWindow: timestamps.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.SHORT)
			.length,
		mediumWindow: timestamps.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.MEDIUM)
			.length,
		longWindow: timestamps.filter((timestamp) => now - timestamp < DEFAULT_TIME_WINDOWS.LONG).length
	};
}

/**
 * Reset rate limits for a specific identifier
 * Useful for testing or administrative overrides
 *
 * @param {string} identifier - The identifier to reset
 *
 * @example
 * ```typescript
 * // Reset rate limits for an IP address
 * resetRateLimits('192.168.1.1');
 * console.log('Rate limits reset for IP');
 * ```
 */
export function resetRateLimits(identifier: string): void {
	if (identifier) {
		ipLimits.delete(identifier);

		// Also clear email-based limits for this identifier if it's an email
		if (identifier.includes('@')) {
			const keysToDelete: string[] = [];
			for (const key of formSubmissionLimits.keys()) {
				if (key.includes(identifier)) {
					keysToDelete.push(key);
				}
			}
			keysToDelete.forEach((key) => formSubmissionLimits.delete(key));
		}
	}
}

/**
 * Type guard to check if a value is a valid RateLimitResult
 *
 * @param {any} obj - Object to check
 * @returns {obj is RateLimitResult} True if object is a valid RateLimitResult
 */
export function isRateLimitResult(obj: any): obj is RateLimitResult {
	return (
		obj &&
		typeof obj === 'object' &&
		typeof obj.allowed === 'boolean' &&
		(obj.retryAfter === undefined || typeof obj.retryAfter === 'number') &&
		(obj.message === undefined || typeof obj.message === 'string')
	);
}
