/**
 * CSRF Protection for SvelteKit
 *
 * Public API preserved for external consumers. Constant-time validation is
 * delegated to `@goobits/security/csrf`; token generation stays on `nanoid`
 * so the existing sync signatures + 32-char URL-safe token shape are preserved.
 *
 * Note: Better Auth handles CSRF for its own endpoints internally.
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import { nanoid } from 'nanoid';
import { createCsrf } from '@goobits/security/csrf';

interface CsrfProtectionOptions {
	excludePaths?: string[];
	excludeMethods?: string[];
	tokenName?: string;
	headerName?: string;
	errorStatus?: number;
	errorMessage?: string;
}

const CSRF_COOKIE_NAME = 'csrf_token';
const DEFAULT_HEADER_NAME = 'x-csrf-token';

// Shared instance for the common case (default header). Custom header names
// fall through to per-call `createCsrf()` so the package's `validate()` reads
// from the right header.
const defaultCsrf = createCsrf({
	cookieName: CSRF_COOKIE_NAME,
	headerName: DEFAULT_HEADER_NAME
});

/**
 * Constant-time compare of cookie token vs request token. Routes through the
 * package's `validate()` by building a synthetic Request so we don't reach for
 * the package's `_internal` timing-safe primitive directly.
 */
async function constantTimeMatch(
	cookieToken: string,
	requestToken: string,
	headerName: string
): Promise<boolean> {
	const req = new Request('https://localhost/', {
		headers: {
			cookie: `${CSRF_COOKIE_NAME}=${cookieToken}`,
			[headerName]: requestToken
		}
	});
	const csrf = headerName === DEFAULT_HEADER_NAME
		? defaultCsrf
		: createCsrf({ cookieName: CSRF_COOKIE_NAME, headerName });
	return csrf.validate(req);
}

/**
 * Creates a CSRF protection middleware for SvelteKit
 */
export function createCsrfProtection(options: CsrfProtectionOptions = {}): Handle {
	const {
		excludePaths = [],
		excludeMethods = ['GET', 'HEAD', 'OPTIONS'],
		tokenName = 'csrf_token',
		headerName = DEFAULT_HEADER_NAME,
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

		// Validate CSRF token — constant-time compare via @goobits/security
		if (
			!cookieToken ||
			!requestToken ||
			!(await constantTimeMatch(cookieToken, requestToken, headerName))
		) {
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
export async function validateCsrfToken(request: Request, cookieToken?: string): Promise<boolean> {
	if (!cookieToken) {
		return false;
	}

	const headerToken = request.headers.get(DEFAULT_HEADER_NAME);
	if (headerToken) {
		return constantTimeMatch(cookieToken, headerToken, DEFAULT_HEADER_NAME);
	}

	const contentType = request.headers.get('content-type') || '';

	if (contentType.includes('application/x-www-form-urlencoded')) {
		try {
			const formData = await request.clone().formData();
			const token = formData.get('csrf_token')?.toString();
			if (!token) return false;
			return constantTimeMatch(cookieToken, token, DEFAULT_HEADER_NAME);
		} catch {
			return false;
		}
	}

	if (contentType.includes('application/json')) {
		try {
			const body = await request.clone().json();
			const token = body?.csrf_token;
			if (!token) return false;
			return constantTimeMatch(cookieToken, String(token), DEFAULT_HEADER_NAME);
		} catch {
			return false;
		}
	}

	return false;
}
