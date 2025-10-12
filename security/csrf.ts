/**
 * CSRF (Cross-Site Request Forgery) protection utilities
 *
 * @fileoverview Provides comprehensive CSRF protection for SvelteKit applications,
 * including token generation, validation, middleware creation, and management utilities.
 * Uses secure cryptographic functions and in-memory token storage with automatic cleanup.
 *
 * @module security/csrf
 * @author @goobits
 * @version 1.0.0
 * @since 1.0.0
 */

import type { RequestEvent, Handle, Cookies } from '@sveltejs/kit';

/**
 * Configuration options for CSRF protection middleware
 */
interface CsrfProtectionOptions {
	/** Name of the token field in forms and cookies */
	tokenName?: string;
	/** Name of the HTTP header containing the CSRF token */
	headerName?: string;
	/** Paths to exclude from CSRF protection */
	excludePaths?: string[];
	/** HTTP methods to exclude from CSRF protection */
	excludeMethods?: string[];
	/** HTTP status code to return for invalid tokens */
	errorStatus?: number;
	/** Error message to return for invalid tokens */
	errorMessage?: string;
}

/**
 * Configuration options for CSRF token manager
 */
interface CsrfManagerOptions {
	/** Name for CSRF cookie */
	cookieName?: string;
	/** Name for CSRF form field */
	formFieldName?: string;
	/** Name for CSRF HTTP header */
	headerName?: string;
	/** Whether to use secure cookies */
	secure?: boolean;
	/** Cookie path */
	path?: string;
	/** Cookie SameSite attribute */
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * CSRF token manager interface
 */
interface CsrfManager {
	/** Generate a new CSRF token and store it in cookies */
	generateToken(cookies: Cookies): Promise<string>;
	/** Validate a CSRF token from a request */
	validateRequest(request: Request, cookies: Cookies): Promise<boolean>;
}

/**
 * Token storage entry with expiration time
 */
/* interface TokenEntry {
	expires: number;
} */

// Check if we're in a browser or server environment
const isBrowser: boolean = typeof window !== 'undefined';

// Simple in-memory token store (in production, use Redis or database)
const tokenStore: Map<string, number> = new Map();
const TOKEN_EXPIRY_MS: number = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure random token using appropriate crypto API
 *
 * @returns Promise resolving to a secure random token string
 * @throws Error if crypto API is not available
 *
 * @example
 * ```typescript
 * const token = await generateSecureToken();
 * console.log(token); // "abc123def456..." (base64url encoded)
 * ```
 */
async function generateSecureToken(): Promise<string> {
	if (isBrowser) {
		// Browser implementation using Web Crypto API
		if (!window.crypto || !window.crypto.getRandomValues) {
			throw new Error('Web Crypto API not available');
		}

		const array = new Uint8Array(32);
		window.crypto.getRandomValues(array);
		return btoa(String.fromCharCode.apply(null, Array.from(array)))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
	} else {
		// Server implementation using Node.js crypto module
		const crypto = await import('crypto');
		return crypto.randomBytes(32).toString('base64url');
	}
}

/**
 * Generate a CSRF token with automatic expiration and cleanup
 *
 * @returns Promise resolving to a new CSRF token
 * @throws Error if token generation fails
 *
 * @example
 * ```typescript
 * const csrfToken = await generateCsrfToken();
 * // Use token in forms or headers
 * ```
 */
export async function generateCsrfToken(): Promise<string> {
	const token = await generateSecureToken();
	const expires = Date.now() + TOKEN_EXPIRY_MS;

	tokenStore.set(token, expires);

	// Clean up expired tokens periodically using crypto-secure random
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		const randomBytes = new Uint8Array(1);
		crypto.getRandomValues(randomBytes);
		if (randomBytes[0] < 25) {
			// ~10% chance (25/256)
			cleanupExpiredTokens();
		}
	}

	return token;
}

/**
 * Validate a CSRF token against the token store
 *
 * @param token - The token to validate
 * @returns True if token is valid and not expired, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = validateCsrfToken(submittedToken);
 * if (!isValid) {
 *   throw new Error('Invalid CSRF token');
 * }
 * ```
 */
export function validateCsrfToken(token: string | null | undefined): boolean {
	if (!token || typeof token !== 'string') {
		return false;
	}

	const expires = tokenStore.get(token);
	if (!expires) {
		return false;
	}

	if (Date.now() > expires) {
		tokenStore.delete(token);
		return false;
	}

	// Token is valid - remove it to prevent reuse (single-use tokens)
	tokenStore.delete(token);
	return true;
}

/**
 * Clean up expired tokens from memory to prevent memory leaks
 *
 * @internal
 */
function cleanupExpiredTokens(): void {
	const now = Date.now();
	for (const [token, expires] of tokenStore.entries()) {
		if (now > expires) {
			tokenStore.delete(token);
		}
	}
}

/**
 * Create middleware for CSRF protection in SvelteKit applications
 *
 * @param options - Configuration options for CSRF protection
 * @returns SvelteKit handle function with CSRF protection
 *
 * @example
 * ```typescript
 * // In hooks.server.ts
 * import { createCsrfProtection } from '@goobits/forms/security/csrf';
 *
 * const csrfProtection = createCsrfProtection({
 *   excludePaths: ['/api/health', '/api/public'],
 *   excludeMethods: ['GET', 'HEAD', 'OPTIONS'],
 *   errorStatus: 403
 * });
 *
 * export const handle: Handle = async ({ event, resolve }) => {
 *   return await csrfProtection({ event, resolve });
 * };
 * ```
 */
export function createCsrfProtection(options: CsrfProtectionOptions = {}): Handle {
	const {
		tokenName = 'csrf',
		headerName = 'x-csrf-token',
		excludePaths = ['/api/health'],
		excludeMethods = ['GET', 'HEAD', 'OPTIONS'],
		errorStatus = 403,
		errorMessage = 'Invalid CSRF token'
	} = options;

	return async ({
		event,
		resolve
	}: {
		event: RequestEvent;
		resolve: (event: RequestEvent) => Response | Promise<Response>;
	}) => {
		const path = event.url.pathname;
		const method = event.request.method;

		// Skip CSRF check for excluded paths and methods
		if (excludePaths.some((p) => path.startsWith(p)) || excludeMethods.includes(method)) {
			return resolve(event);
		}

		// Check for token in headers, body, or cookies
		const headerToken = event.request.headers.get(headerName);

		// For non-GET requests, validate CSRF token
		let isValid = false;

		// Try header token first
		if (headerToken) {
			isValid = validateCsrfToken(headerToken);
		}

		// If not valid and it's a form submission, try form data
		if (!isValid && event.request.headers.get('content-type')?.includes('form')) {
			try {
				const formData = await event.request.formData();
				const formToken = formData.get(tokenName);
				if (formToken && typeof formToken === 'string') {
					isValid = validateCsrfToken(formToken);
					// Re-create the request since we consumed the body
					event.request = new Request(event.request.url, {
						method: event.request.method,
						headers: event.request.headers,
						body: formData
					});
				}
			} catch {
				// Form parsing failed, continue with other methods
			}
		}

		// If still not valid, check for token in cookies
		if (!isValid) {
			const cookieToken = event.cookies.get(tokenName);
			if (cookieToken) {
				isValid = validateCsrfToken(cookieToken);
			}
		}

		// If no valid token found, return error
		if (!isValid) {
			return new Response(errorMessage, {
				status: errorStatus
			});
		}

		return resolve(event);
	};
}

/**
 * Create CSRF token manager with multiple storage methods
 *
 * @param options - Configuration options for the token manager
 * @returns CSRF token manager with generation and validation methods
 *
 * @example
 * ```typescript
 * // In a SvelteKit load function
 * import { createCsrfManager } from '@goobits/forms/security/csrf';
 *
 * const csrfManager = createCsrfManager({
 *   cookieName: 'app-csrf',
 *   secure: true,
 *   sameSite: 'strict'
 * });
 *
 * export const load = async ({ cookies }) => {
 *   const csrfToken = await csrfManager.generateToken(cookies);
 *   return { csrfToken };
 * };
 * ```
 */
export function createCsrfManager(options: CsrfManagerOptions = {}): CsrfManager {
	const {
		cookieName = 'csrf',
		formFieldName = 'csrf',
		headerName = 'X-CSRF-Token',
		secure = true,
		path = '/',
		sameSite = 'lax'
	} = options;

	return {
		/**
		 * Generate token and store in cookie
		 *
		 * @param cookies - SvelteKit cookies object
		 * @returns Promise resolving to the generated token
		 */
		async generateToken(cookies: Cookies): Promise<string> {
			const token = await generateCsrfToken();
			cookies.set(cookieName, token, {
				path,
				secure,
				sameSite,
				httpOnly: true,
				maxAge: 60 * 60 // 1 hour
			});
			return token;
		},

		/**
		 * Validate token from request using multiple sources
		 *
		 * @param request - HTTP request object
		 * @param cookies - SvelteKit cookies object
		 * @returns Promise resolving to true if token is valid
		 */
		async validateRequest(request: Request, cookies: Cookies): Promise<boolean> {
			// Try header first
			const headerToken = request.headers.get(headerName);
			if (headerToken && validateCsrfToken(headerToken)) {
				return true;
			}

			// Try cookie
			const cookieToken = cookies.get(cookieName);
			if (cookieToken && validateCsrfToken(cookieToken)) {
				return true;
			}

			// Try form data if appropriate content type
			if (request.headers.get('content-type')?.includes('form')) {
				try {
					const formData = await request.formData();
					const formToken = formData.get(formFieldName);
					if (formToken && typeof formToken === 'string' && validateCsrfToken(formToken)) {
						return true;
					}
				} catch {
					// Form parsing failed
				}
			}

			return false;
		}
	};
}
