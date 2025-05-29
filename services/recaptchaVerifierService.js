/**
 * Server-side reCAPTCHA verification service for @goobits/forms
 */

import { createLogger } from '../utils/logger.js'

const logger = createLogger('RecaptchaVerifier')

/**
 * Verify a reCAPTCHA token with Google's API
 * @param {string} token - The reCAPTCHA token to verify
 * @param {Object} options - Verification options
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export async function verifyRecaptchaToken(token, options = {}) {
	const {
		secretKey,
		action = null,
		minScore = 0.5,
		allowInDevelopment = true
	} = options

	if (!token) {
		logger.warn('No reCAPTCHA token provided')
		return false
	}

	if (!secretKey) {
		logger.warn('No reCAPTCHA secret key provided')
		// In production, fail closed (return false)
		// In development, optionally allow the request to proceed
		return process.env.NODE_ENV !== 'production' && allowInDevelopment
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
		})

		if (!response.ok) {
			logger.error('reCAPTCHA verification API failed:', {
				status: response.status,
				statusText: response.statusText
			})
			return false
		}

		const data = await response.json()

		// Check if the verification was successful
		if (!data.success) {
			logger.warn('reCAPTCHA verification failed:', {
				errorCodes: data['error-codes'] || [],
				token: token.substring(0, 10) + '...' // Log just the beginning of the token
			})
			return false
		}

		// Check the score if available (v3 only)
		if (typeof data.score === 'number') {
			if (data.score < minScore) {
				logger.warn('reCAPTCHA score too low:', {
					score: data.score,
					minimum: minScore,
					action: data.action
				})
				return false
			}

			// Verify the action if provided
			if (action && data.action !== action) {
				logger.warn('reCAPTCHA action mismatch:', {
					expected: action,
					actual: data.action,
					score: data.score
				})
				return false
			}
		}

		return true
	} catch (error) {
		logger.error('Error verifying reCAPTCHA token:', error)
		return false
	}
}

/**
 * Create a reusable reCAPTCHA verifier function
 * @param {Object} config - Verifier configuration
 * @returns {Function} - Verifier function
 */
export function createRecaptchaVerifier(config = {}) {
	return (token, action) => verifyRecaptchaToken(token, {
		...config,
		action
	})
}

// Default verifier that checks environment variables
let defaultVerifier = null

/**
 * Get or create the default recaptcha verifier
 * @param {Object} [options] - Optional configuration
 * @returns {Function} - Verifier function
 */
export function getDefaultRecaptchaVerifier(options = {}) {
	if (!defaultVerifier || options.force) {
		// First try environment variable
		const secretKey = options.secretKey || process.env.RECAPTCHA_SECRET_KEY
		
		defaultVerifier = createRecaptchaVerifier({
			secretKey,
			minScore: options.minScore || 0.5,
			allowInDevelopment: options.allowInDevelopment !== false
		})
	}
	
	return defaultVerifier
}