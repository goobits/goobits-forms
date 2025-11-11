/**
 * @fileoverview In-memory rate limiting service for form submissions
 * Inline implementation for standalone package publishing
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
}

/**
 * Request tracking entry
 */
interface RequestEntry {
	/** Number of requests in the current window */
	count: number;
	/** Timestamp when the current window started */
	windowStart: number;
}

// In-memory storage for rate limiting
const ipRequests = new Map<string, RequestEntry>();
const emailRequests = new Map<string, RequestEntry>();

// Cleanup interval (run every 5 minutes to prevent memory leaks)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: NodeJS.Timeout | null = null;

/**
 * Start periodic cleanup of expired entries
 */
function startCleanup() {
	if (cleanupTimer) return;

	cleanupTimer = setInterval(() => {
		const now = Date.now();
		const maxAge = 60 * 60 * 1000; // 1 hour

		// Clean up IP requests
		for (const [key, entry] of ipRequests.entries()) {
			if (now - entry.windowStart > maxAge) {
				ipRequests.delete(key);
			}
		}

		// Clean up email requests
		for (const [key, entry] of emailRequests.entries()) {
			if (now - entry.windowStart > maxAge) {
				emailRequests.delete(key);
			}
		}
	}, CLEANUP_INTERVAL);

	// Don't prevent Node from exiting
	if (cleanupTimer.unref) {
		cleanupTimer.unref();
	}
}

/**
 * Restart the cleanup timer (useful for testing with fake timers)
 */
export function restartCleanup(): void {
	if (cleanupTimer) {
		clearInterval(cleanupTimer);
		cleanupTimer = null;
	}
	startCleanup();
}

// Start cleanup timer
startCleanup();

/**
 * Check rate limit for a given key
 */
function checkRateLimit(
	store: Map<string, RequestEntry>,
	key: string,
	maxRequests: number,
	windowMs: number
): { allowed: boolean; retryAfter?: number } {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry) {
		// First request in this window
		store.set(key, { count: 1, windowStart: now });
		return { allowed: true };
	}

	const windowElapsed = now - entry.windowStart;

	if (windowElapsed > windowMs) {
		// Window has expired, reset
		store.set(key, { count: 1, windowStart: now });
		return { allowed: true };
	}

	if (entry.count < maxRequests) {
		// Within limit, increment count
		entry.count++;
		store.set(key, entry);
		return { allowed: true };
	}

	// Rate limit exceeded
	const windowRemaining = windowMs - windowElapsed;
	const retryAfter = Math.ceil(windowRemaining / 1000);

	return { allowed: false, retryAfter };
}

/**
 * Rate limit a form submission by IP and/or email
 *
 * Multi-tier rate limiting:
 * - Short-term: 10 requests per minute (IP-based)
 * - Medium-term: 30 requests per 5 minutes (IP-based)
 * - Long-term: 100 requests per hour (IP-based)
 * - Email-based: 5 requests per hour per email address
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
	const {
		maxRequests: _maxRequests = 10,
		windowMs: _windowMs = 60 * 1000, // 1 minute default
		message: customMessage,
		skipIpCheck = false
	} = options;

	// IP-based rate limiting (multi-tier)
	if (!skipIpCheck && ipAddress) {
		const ipKey = `${formType}:${ipAddress}`;

		// Short-term: 10 requests per minute
		const shortTerm = checkRateLimit(ipRequests, `${ipKey}:short`, 10, 60 * 1000);
		if (!shortTerm.allowed) {
			return {
				allowed: false,
				retryAfter: shortTerm.retryAfter,
				limitType: 'short',
				message:
					customMessage ||
					`Too many requests. Please wait ${shortTerm.retryAfter} seconds before trying again.`,
				windowMs: 60 * 1000,
				maxRequests: 10
			};
		}

		// Medium-term: 30 requests per 5 minutes
		const mediumTerm = checkRateLimit(ipRequests, `${ipKey}:medium`, 30, 5 * 60 * 1000);
		if (!mediumTerm.allowed) {
			return {
				allowed: false,
				retryAfter: mediumTerm.retryAfter,
				limitType: 'medium',
				message:
					customMessage ||
					`Too many requests. Please wait ${mediumTerm.retryAfter} seconds before trying again.`,
				windowMs: 5 * 60 * 1000,
				maxRequests: 30
			};
		}

		// Long-term: 100 requests per hour
		const longTerm = checkRateLimit(ipRequests, `${ipKey}:long`, 100, 60 * 60 * 1000);
		if (!longTerm.allowed) {
			return {
				allowed: false,
				retryAfter: longTerm.retryAfter,
				limitType: 'long',
				message:
					customMessage ||
					`Too many requests. Please wait ${longTerm.retryAfter} seconds before trying again.`,
				windowMs: 60 * 60 * 1000,
				maxRequests: 100
			};
		}
	}

	// Email-based rate limiting: 5 requests per hour
	if (email) {
		const emailKey = `${formType}:${email.toLowerCase()}`;
		const emailLimit = checkRateLimit(emailRequests, emailKey, 5, 60 * 60 * 1000);

		if (!emailLimit.allowed) {
			return {
				allowed: false,
				retryAfter: emailLimit.retryAfter,
				limitType: 'email',
				message:
					customMessage ||
					`Too many submissions from this email address. Please wait ${emailLimit.retryAfter} seconds before trying again.`,
				windowMs: 60 * 60 * 1000,
				maxRequests: 5
			};
		}
	}

	// All checks passed
	return { allowed: true };
}

/**
 * Reset rate limits for a specific IP address (useful for testing)
 */
export function resetIpRateLimit(ipAddress: string, formType: string = 'contact'): void {
	const ipKey = `${formType}:${ipAddress}`;
	ipRequests.delete(`${ipKey}:short`);
	ipRequests.delete(`${ipKey}:medium`);
	ipRequests.delete(`${ipKey}:long`);
}

/**
 * Reset rate limits for a specific email address (useful for testing)
 */
export function resetEmailRateLimit(email: string, formType: string = 'contact'): void {
	const emailKey = `${formType}:${email.toLowerCase()}`;
	emailRequests.delete(emailKey);
}

/**
 * Clear all rate limiting data (useful for testing)
 */
export function clearAllRateLimits(): void {
	ipRequests.clear();
	emailRequests.clear();
}

/**
 * Get current rate limit statistics
 */
export function getRateLimitStats(): {
	ipEntries: number;
	emailEntries: number;
} {
	return {
		ipEntries: ipRequests.size,
		emailEntries: emailRequests.size
	};
}
