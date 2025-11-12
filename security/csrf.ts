/**
 * CSRF Protection for SvelteKit
 *
 * Provides Cross-Site Request Forgery protection for SvelteKit applications.
 * Note: Better Auth handles CSRF for its own endpoints internally.
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import { nanoid } from 'nanoid';

interface CsrfProtectionOptions {
	excludePaths?: string[];
	excludeMethods?: string[];
	tokenName?: string;
	headerName?: string;
	errorStatus?: number;
	errorMessage?: string;
}

const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Creates a CSRF protection middleware for SvelteKit
 */
export function createCsrfProtection(options: CsrfProtectionOptions = {}): Handle {
	const {
		excludePaths = [],
		excludeMethods = ['GET', 'HEAD', 'OPTIONS'],
		tokenName = 'csrf_token',
		headerName = 'x-csrf-token',
		errorStatus = 403,
		errorMessage = 'Invalid or missing CSRF token'
	} = options;

	return async ({ event, resolve }) => {
		const { request, url, cookies } = event;
		const method = request.method;

		// Skip CSRF check for excluded methods (GET, HEAD, OPTIONS by default)
		if (excludeMethods.includes(method)) {
			return resolve(event);
		}

		// Skip CSRF check for excluded paths
		const isExcluded = excludePaths.some(path => {
			if (path.endsWith('*')) {
				return url.pathname.startsWith(path.slice(0, -1));
			}
			return url.pathname === path || url.pathname.startsWith(path + '/');
		});

		if (isExcluded) {
			return resolve(event);
		}

		// Get CSRF token from cookie
		const cookieToken = cookies.get(CSRF_COOKIE_NAME);

		// Get CSRF token from request (header or body)
		const headerToken = request.headers.get(headerName);
		let bodyToken: string | undefined;

		// Try to get token from request body for form submissions
		if (request.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
			try {
				const formData = await request.clone().formData();
				bodyToken = formData.get(tokenName)?.toString();
			} catch {
				// Failed to parse form data, continue with header token
			}
		} else if (request.headers.get('content-type')?.includes('application/json')) {
			try {
				const body = await request.clone().json();
				bodyToken = body[tokenName];
			} catch {
				// Failed to parse JSON, continue with header token
			}
		}

		const requestToken = headerToken || bodyToken;

		// Validate CSRF token
		if (!cookieToken || !requestToken || cookieToken !== requestToken) {
			return new Response(errorMessage, {
				status: errorStatus,
				headers: {
					'Content-Type': 'text/plain'
				}
			});
		}

		return resolve(event);
	};
}

/**
 * Generates a new CSRF token
 */
export function generateCsrfToken(): string {
	return nanoid(32);
}

/**
 * Sets a CSRF token cookie
 */
export function setCsrfCookie(event: RequestEvent): string {
	const token = generateCsrfToken();
	event.cookies.set(CSRF_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 24 // 24 hours
	});
	return token;
}

/**
 * Gets the current CSRF token from cookies or creates a new one
 */
export function getCsrfToken(event: RequestEvent): string {
	const existingToken = event.cookies.get(CSRF_COOKIE_NAME);
	if (existingToken) {
		return existingToken;
	}
	return setCsrfCookie(event);
}

/**
 * Validates a CSRF token from the request
 */
export function validateCsrfToken(request: Request, cookieToken?: string): boolean {
	const headerToken = request.headers.get('x-csrf-token');
	if (!cookieToken || !headerToken) {
		return false;
	}
	return cookieToken === headerToken;
}
