/**
 * Rate limiter service for @goobits/forms
 * Provides configurable rate limiting for form submissions
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('RateLimiter')

// Store rate limiting data for IPs/users in memory
// In a production environment, this should be in a shared store like Redis
const ipLimits = new Map()
const formSubmissionLimits = new Map()

// Default time windows in milliseconds
const DEFAULT_TIME_WINDOWS = {
	SHORT: 1000 * 60, // 1 minute
	MEDIUM: 1000 * 60 * 10, // 10 minutes
	LONG: 1000 * 60 * 60 // 1 hour
}

// Default rate limits (requests per time window)
const DEFAULT_RATE_LIMITS = {
	SHORT: 5, // Max 5 requests per minute
	MEDIUM: 15, // Max 15 requests per 10 minutes
	LONG: 30 // Max 30 requests per hour
}

/**
 * Clean up expired entries from the rate limit maps
 */
export function cleanupRateLimits() {
	const now = Date.now()

	// Clean up IP limits
	for (const [ip, entries] of ipLimits.entries()) {
		// Remove records older than the long window
		const filteredEntries = entries.filter(
			timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
		)

		if (filteredEntries.length === 0) {
			ipLimits.delete(ip)
		} else {
			ipLimits.set(ip, filteredEntries)
		}
	}

	// Clean up form submission limits
	for (const [key, entries] of formSubmissionLimits.entries()) {
		// Remove records older than the long window
		const filteredEntries = entries.filter(
			timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
		)

		if (filteredEntries.length === 0) {
			formSubmissionLimits.delete(key)
		} else {
			formSubmissionLimits.set(key, filteredEntries)
		}
	}
}

// Set up automatic cleanup every hour in browser environments
if (typeof setInterval !== 'undefined') {
	setInterval(cleanupRateLimits, 1000 * 60 * 60) // Run every hour
}

/**
 * Rate limit generic API requests by identifier
 * @param {string} identifier - User identifier (IP address, session ID, etc.)
 * @param {string} [action='default'] - The action being rate limited
 * @returns {Object} Result object with allowed and retryAfter properties
 */
export function rateLimitRequest(identifier, action = 'default') {
	if (!identifier) {
		// If no identifier is provided, don't rate limit
		return { allowed: true }
	}

	const now = Date.now()

	// Get existing timestamps or create a new array
	const timestamps = ipLimits.get(identifier) || []

	// Add current timestamp
	timestamps.push(now)

	// Update the map
	ipLimits.set(identifier, timestamps)

	// Check against various time windows
	const shortWindowCount = timestamps.filter(
		timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.SHORT
	).length

	const mediumWindowCount = timestamps.filter(
		timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.MEDIUM
	).length

	const longWindowCount = timestamps.filter(
		timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.LONG
	).length

	// Check if any rate limits are exceeded
	if (shortWindowCount > DEFAULT_RATE_LIMITS.SHORT) {
		// Calculate when the rate limit will reset
		const oldestInWindow = timestamps
			.filter(timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.SHORT)
			.sort()[0]
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.SHORT - (now - oldestInWindow)) / 1000)

		return {
			allowed: false,
			retryAfter,
			limitType: 'short',
			message: `Rate limit exceeded. Please try again in ${ retryAfter } seconds.`
		}
	}

	if (mediumWindowCount > DEFAULT_RATE_LIMITS.MEDIUM) {
		const oldestInWindow = timestamps
			.filter(timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.MEDIUM)
			.sort()[0]
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.MEDIUM - (now - oldestInWindow)) / 1000)

		return {
			allowed: false,
			retryAfter,
			limitType: 'medium',
			message: `Too many requests. Please try again in ${ Math.ceil(retryAfter / 60) } minutes.`
		}
	}

	if (longWindowCount > DEFAULT_RATE_LIMITS.LONG) {
		const oldestInWindow = timestamps
			.filter(timestamp => now - timestamp < DEFAULT_TIME_WINDOWS.LONG)
			.sort()[0]
		const retryAfter = Math.ceil((DEFAULT_TIME_WINDOWS.LONG - (now - oldestInWindow)) / 1000)

		return {
			allowed: false,
			retryAfter,
			limitType: 'long',
			message: `Daily limit reached. Please try again in ${ Math.ceil(retryAfter / 60 / 60) } hours.`
		}
	}

	return { allowed: true }
}

/**
 * Rate limit form submissions with customizable limits
 * @param {string} clientAddress - User's IP address
 * @param {string} [email] - Optional user's email address for stricter limits
 * @param {string} [formType='contact'] - Type of form being submitted
 * @param {Object} [options] - Optional custom rate limiting parameters
 * @returns {Object} Result with allowed and retryAfter properties
 */
export async function rateLimitFormSubmission(clientAddress, email, formType = 'contact', options = {}) {
	const now = Date.now()

	// Default options
	const {
		maxRequests = 3,
		windowMs = DEFAULT_TIME_WINDOWS.LONG,
		message = 'You\'ve already submitted this form multiple times. Please try again later.'
	} = options

	// First check IP-based rate limiting (unless skipped by options)
	if (!options.skipIpCheck && clientAddress) {
		const ipResult = rateLimitRequest(clientAddress, `form:${ formType }`)
		if (!ipResult.allowed) {
			return ipResult
		}
	}

	// If email is provided, also check email-based rate limiting
	if (email) {
		const emailKey = `email:${ email }:${ formType }`
		const timestamps = formSubmissionLimits.get(emailKey) || []

		// Add current timestamp
		timestamps.push(now)

		// Update the map
		formSubmissionLimits.set(emailKey, timestamps)

		// Filter timestamps within the window
		const windowCount = timestamps.filter(
			timestamp => now - timestamp < windowMs
		).length

		if (windowCount > maxRequests) {
			const oldestInWindow = timestamps
				.filter(timestamp => now - timestamp < windowMs)
				.sort()[0]
			const retryAfter = Math.ceil((windowMs - (now - oldestInWindow)) / 1000)

			// Create user-friendly message with appropriate time units
			let friendlyMessage = message
			if (!options.message) {
				if (retryAfter < 60) {
					friendlyMessage = `Rate limit exceeded. Please try again in ${ retryAfter } seconds.`
				} else if (retryAfter < 3600) {
					friendlyMessage = `Rate limit exceeded. Please try again in ${ Math.ceil(retryAfter / 60) } minutes.`
				} else {
					friendlyMessage = `Rate limit exceeded. Please try again in ${ Math.ceil(retryAfter / 3600) } hours.`
				}
			}

			return {
				allowed: false,
				retryAfter,
				limitType: 'email',
				windowMs,
				maxRequests,
				message: friendlyMessage
			}
		}
	}

	return { allowed: true }
}

/**
 * Extract client IP address from request
 * @param {Request} request - Request object with headers
 * @returns {string} IP address or fallback value
 */
export function getClientIP(request) {
	// Try common headers to get the real client IP
	const headers = request.headers

	// Common headers for proxies
	const ipHeaders = [
		'cf-connecting-ip', // Cloudflare
		'x-real-ip', // Nginx
		'x-forwarded-for', // Standard proxy
		'x-client-ip', // Apache
		'forwarded', // Standard
		'true-client-ip' // Akamai and Cloudflare
	]

	for (const header of ipHeaders) {
		const value = headers.get(header)
		if (value) {
			// x-forwarded-for can have multiple IPs, take the first one
			const ip = value.split(',')[0].trim()
			if (ip) {
				return ip
			}
		}
	}

	// Fallback to a placeholder if we can't determine IP
	return 'unknown-ip'
}

/**
 * Create a rate limiter middleware for SvelteKit
 * @param {Object} options - Rate limiter options
 * @returns {Function} Rate limiter function for SvelteKit hooks
 */
export function createRateLimiter(options = {}) {
	const {
		getIdentifier = ({ request, getClientAddress }) => getClientAddress ? getClientAddress() : getClientIP(request),
		getEmail = () => null,
		formType = 'contact',
		maxRequests,
		windowMs,
		message
	} = options

	return async (event) => {
		const identifier = typeof getIdentifier === 'function' 
			? await getIdentifier(event)
			: getIdentifier

		const email = typeof getEmail === 'function'
			? await getEmail(event)
			: getEmail

		return rateLimitFormSubmission(
			identifier,
			email,
			formType,
			{ maxRequests, windowMs, message }
		)
	}
}

// Singleton instance for common use cases
let defaultRateLimiter = null

/**
 * Get or create the default rate limiter
 * @param {Object} [config] - Optional configuration to override defaults
 * @returns {Function} Rate limiter function
 */
export function getDefaultRateLimiter(config = {}) {
	if (!defaultRateLimiter || config.force) {
		defaultRateLimiter = createRateLimiter(config)
	}
	return defaultRateLimiter
}