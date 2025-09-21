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
export declare function cleanupRateLimits(): void;
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
export declare function rateLimitRequest(identifier: string, action?: string): RateLimitResult;
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
export declare function rateLimitFormSubmission(clientAddress: string, email?: string | null, formType?: string, options?: FormRateLimitOptions): Promise<RateLimitResult>;
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
export declare function getClientIP(request: Request): string;
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
export declare function createRateLimiter(options?: RateLimiterConfig): (event: SvelteKitEvent) => Promise<RateLimitResult>;
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
export declare function getDefaultRateLimiter(config?: RateLimiterConfig): (event: SvelteKitEvent) => Promise<RateLimitResult>;
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
export declare function getRateLimitStats(identifier: string): {
    shortWindow: number;
    mediumWindow: number;
    longWindow: number;
};
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
export declare function resetRateLimits(identifier: string): void;
/**
 * Type guard to check if a value is a valid RateLimitResult
 *
 * @param {any} obj - Object to check
 * @returns {obj is RateLimitResult} True if object is a valid RateLimitResult
 */
export declare function isRateLimitResult(obj: any): obj is RateLimitResult;
