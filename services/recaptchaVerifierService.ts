/**
 * @fileoverview reCAPTCHA token verification service
 * Inline implementation for standalone package publishing
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
	/** Whether verification was successful */
	success: boolean;
	/** Error codes if verification failed */
	'error-codes'?: string[];
	/** Hostname of the site where the reCAPTCHA was solved */
	hostname?: string;
	/** Timestamp of the challenge load (ISO format) */
	challenge_ts?: string;
	/** Score for v3 (0.0 to 1.0, where 1.0 is very likely a good interaction) */
	score?: number;
	/** Action name from the verify call (v3 only) */
	action?: string;
	/** Error message (only present when success is false) */
	error?: string;
}

/**
 * Verify a reCAPTCHA token with Google's API
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
	const details = await verifyRecaptchaTokenWithDetails(token, options);
	return details.success;
}

/**
 * Verify a reCAPTCHA token and get detailed response
 *
 * @param {string} token - The reCAPTCHA token to verify
 * @param {RecaptchaVerificationOptions} [options] - Verification configuration options
 * @returns {Promise<RecaptchaApiResponse>} Detailed response object
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
	const {
		secretKey = process.env.RECAPTCHA_SECRET_KEY,
		action = null,
		minScore = 0.5,
		allowInDevelopment = false
	} = options;

	// Allow bypass in development mode if configured
	if (allowInDevelopment && process.env.NODE_ENV === 'development') {
		return {
			success: true,
			score: 1.0,
			action: action || 'development_bypass',
			hostname: 'localhost'
		};
	}

	// Validate required parameters
	if (!token) {
		return {
			success: false,
			error: 'Missing reCAPTCHA token'
		};
	}

	if (!secretKey) {
		return {
			success: false,
			error: 'Missing reCAPTCHA secret key'
		};
	}

	try {
		// Prepare request body
		const params = new URLSearchParams({
			secret: secretKey,
			response: token
		});

		// Call Google's reCAPTCHA API
		const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: params.toString()
		});

		if (!response.ok) {
			return {
				success: false,
				error: `reCAPTCHA API returned status ${response.status}`
			};
		}

		const data = (await response.json()) as RecaptchaApiResponse;

		// Basic validation
		if (!data.success) {
			return {
				...data,
				error: data['error-codes']?.join(', ') || 'Verification failed'
			};
		}

		// v3 score validation
		if (typeof data.score === 'number' && data.score < minScore) {
			return {
				...data,
				success: false,
				error: `Score ${data.score} is below minimum threshold ${minScore}`
			};
		}

		// v3 action validation
		if (action && data.action !== action) {
			return {
				...data,
				success: false,
				error: `Action mismatch: expected '${action}', got '${data.action}'`
			};
		}

		return data;
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown verification error'
		};
	}
}

/**
 * Type guard to check if an object is a valid RecaptchaApiResponse
 */
export function isRecaptchaApiResponse(obj: any): obj is RecaptchaApiResponse {
	return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
}
