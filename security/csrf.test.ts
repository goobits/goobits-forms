import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import {
	createCsrfProtection,
	generateCsrfToken,
	setCsrfCookie,
	getCsrfToken,
	validateCsrfToken
} from './csrf';

// Helper to create mock RequestEvent
function createMockEvent(
	options: {
		method?: string;
		pathname?: string;
		headers?: Record<string, string>;
		body?: string | FormData | object;
		cookieToken?: string;
	} = {}
): RequestEvent {
	const {
		method = 'POST',
		pathname = '/test',
		headers = {},
		body,
		cookieToken
	} = options;

	// Create request body
	let requestBody: BodyInit | null = null;
	if (body) {
		if (body instanceof FormData) {
			requestBody = body;
		} else if (typeof body === 'object') {
			requestBody = JSON.stringify(body);
		} else {
			requestBody = body;
		}
	}

	const request = new Request(`https://example.com${pathname}`, {
		method,
		headers: new Headers(headers),
		body: requestBody
	});

	const cookieStore = new Map<string, string>();
	if (cookieToken) {
		cookieStore.set('csrf_token', cookieToken);
	}

	const event = {
		request,
		url: new URL(`https://example.com${pathname}`),
		cookies: {
			get: (name: string) => cookieStore.get(name),
			set: vi.fn((name: string, value: string) => {
				cookieStore.set(name, value);
			}),
			delete: vi.fn(),
			serialize: vi.fn()
		},
		locals: {},
		params: {},
		platform: undefined,
		route: { id: pathname },
		setHeaders: vi.fn(),
		getClientAddress: vi.fn(() => '127.0.0.1'),
		isDataRequest: false,
		isSubRequest: false,
		fetch: vi.fn()
	} as unknown as RequestEvent;

	return event;
}

// Helper to create mock resolve function
function createMockResolve() {
	return vi.fn(async (event: RequestEvent) => {
		return new Response('OK', { status: 200 });
	});
}

describe('createCsrfProtection', () => {
	describe('token validation', () => {
		test('allows request with valid matching tokens', async () => {
			const token = 'valid-token-123';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('allows request with token from form data', async () => {
			const token = 'form-token-456';
			// Create proper form-encoded body string
			const formBody = `csrf_token=${encodeURIComponent(token)}&other=value`;

			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: formBody,
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('allows request with token from JSON body', async () => {
			const token = 'json-token-789';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/json' },
				body: { csrf_token: token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('prefers header token over body token', async () => {
			const headerToken = 'header-token';
			const bodyToken = 'body-token';

			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: {
					'x-csrf-token': headerToken,
					'content-type': 'application/json'
				},
				body: { csrf_token: bodyToken },
				cookieToken: headerToken
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('rejects request with missing cookie token', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': 'request-token' }
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(await response.text()).toBe('Invalid or missing CSRF token');
			expect(resolve).not.toHaveBeenCalled();
		});

		test('rejects request with missing request token', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				cookieToken: 'cookie-token'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(await response.text()).toBe('Invalid or missing CSRF token');
			expect(resolve).not.toHaveBeenCalled();
		});

		test('rejects request with mismatched tokens', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': 'token-1' },
				cookieToken: 'token-2'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(await response.text()).toBe('Invalid or missing CSRF token');
			expect(resolve).not.toHaveBeenCalled();
		});

		test('rejects request with empty tokens', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': '' },
				cookieToken: ''
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('handles malformed form data gracefully', async () => {
			const token = 'valid-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			// Create request with invalid form data
			const event = createMockEvent({
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: 'invalid-form-data-not-parseable',
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			// Should reject since no valid token was extracted from body
			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('handles malformed JSON gracefully', async () => {
			const token = 'valid-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			// Create request with invalid JSON
			const event = createMockEvent({
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{invalid-json',
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			// Should reject since no valid token was extracted from body
			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('uses custom token name for body extraction', async () => {
			const token = 'custom-token';
			const middleware = createCsrfProtection({ tokenName: 'my_token' });
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/json' },
				body: { my_token: token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('uses custom header name for token extraction', async () => {
			const token = 'header-token';
			const middleware = createCsrfProtection({ headerName: 'x-custom-csrf' });
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-custom-csrf': token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('uses custom error status and message', async () => {
			const middleware = createCsrfProtection({
				errorStatus: 401,
				errorMessage: 'Custom error message'
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': 'token-1' },
				cookieToken: 'token-2'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(401);
			expect(await response.text()).toBe('Custom error message');
		});
	});

	describe('path exclusion', () => {
		test('bypasses CSRF check for exact path match', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/api/webhook']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/api/webhook',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('bypasses CSRF check for wildcard path match', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/api/*']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/api/users/123',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('bypasses CSRF check for path starting with excluded path', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/webhooks']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/webhooks/stripe',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('does not bypass CSRF check for non-matching wildcard', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/api/*']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/other/endpoint',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('handles multiple excluded paths', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/api/*', '/webhooks/*', '/public/endpoint']
			});
			const resolve = createMockResolve();

			// Test first pattern
			let event = createMockEvent({
				pathname: '/api/test',
				method: 'POST'
			});
			let response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// Test second pattern
			event = createMockEvent({
				pathname: '/webhooks/github',
				method: 'POST'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// Test exact match
			event = createMockEvent({
				pathname: '/public/endpoint',
				method: 'POST'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// Test non-matching path
			event = createMockEvent({
				pathname: '/protected/endpoint',
				method: 'POST'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(403);
		});

		test('wildcard at root matches all paths', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/*']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/any/path/here',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('empty string wildcard matches root', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['*']
			});
			const resolve = createMockResolve();

			const event = createMockEvent({
				pathname: '/test',
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});
	});

	describe('method exclusion', () => {
		test('bypasses CSRF check for GET requests by default', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'GET'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('bypasses CSRF check for HEAD requests by default', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'HEAD'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('bypasses CSRF check for OPTIONS requests by default', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'OPTIONS'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
			expect(resolve).toHaveBeenCalledWith(event);
		});

		test('enforces CSRF check for POST requests', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('enforces CSRF check for PUT requests', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'PUT'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('enforces CSRF check for DELETE requests', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'DELETE'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('enforces CSRF check for PATCH requests', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'PATCH'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});

		test('allows custom excluded methods', async () => {
			const middleware = createCsrfProtection({
				excludeMethods: ['POST', 'PUT']
			});
			const resolve = createMockResolve();

			// POST should be excluded
			let event = createMockEvent({
				method: 'POST'
			});
			let response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// PUT should be excluded
			event = createMockEvent({
				method: 'PUT'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// DELETE should NOT be excluded
			event = createMockEvent({
				method: 'DELETE'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(403);
		});

		test('empty excludeMethods enforces CSRF on all methods', async () => {
			const middleware = createCsrfProtection({
				excludeMethods: []
			});
			const resolve = createMockResolve();

			// Even GET should require CSRF
			const event = createMockEvent({
				method: 'GET'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
			expect(resolve).not.toHaveBeenCalled();
		});
	});

	describe('token extraction', () => {
		test('extracts token from x-csrf-token header', async () => {
			const token = 'header-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});

		test('extracts token from form data with application/x-www-form-urlencoded', async () => {
			const token = 'form-token';
			// Create proper form-encoded body string
			const formBody = `csrf_token=${encodeURIComponent(token)}&other=value`;

			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: formBody,
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});

		test('extracts token from JSON body with application/json', async () => {
			const token = 'json-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/json' },
				body: { csrf_token: token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});

		test('handles content-type with charset', async () => {
			const token = 'charset-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/json; charset=utf-8' },
				body: { csrf_token: token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});

		test('does not extract token from unsupported content-type', async () => {
			const token = 'valid-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'text/plain' },
				body: 'csrf_token=' + token,
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			// Should fail since token won't be extracted from text/plain
			expect(response.status).toBe(403);
		});

		test('falls back to body token when header is missing', async () => {
			const token = 'body-only-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'content-type': 'application/json' },
				body: { csrf_token: token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});
	});

	describe('cookie handling', () => {
		test('validates cookie token matches request token', async () => {
			const token = 'matching-token';
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(200);
		});

		test('rejects when cookie token is undefined', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': 'some-token' }
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
		});

		test('performs strict equality check on tokens', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			// Test that similar but not identical tokens fail
			const event = createMockEvent({
				headers: { 'x-csrf-token': 'token1' },
				cookieToken: 'token2'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
		});
	});

	describe('response handling', () => {
		test('returns 403 status on CSRF failure by default', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
		});

		test('returns text/plain content-type on CSRF failure', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'POST'
			});

			const response = await middleware({ event, resolve });

			expect(response.headers.get('content-type')).toBe('text/plain');
		});

		test('returns error message in response body', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				method: 'POST'
			});

			const response = await middleware({ event, resolve });
			const text = await response.text();

			expect(text).toBe('Invalid or missing CSRF token');
		});

		test('allows resolve to return custom response on success', async () => {
			const customResponse = new Response('Custom Success', { status: 201 });
			const middleware = createCsrfProtection();
			const resolve = vi.fn(async () => customResponse);

			const token = 'valid-token';
			const event = createMockEvent({
				headers: { 'x-csrf-token': token },
				cookieToken: token
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(201);
			expect(await response.text()).toBe('Custom Success');
		});
	});

	describe('integration scenarios', () => {
		test('handles complex scenario with excluded path and excluded method', async () => {
			const middleware = createCsrfProtection({
				excludePaths: ['/api/*'],
				excludeMethods: ['GET']
			});
			const resolve = createMockResolve();

			// Should bypass due to excluded path
			let event = createMockEvent({
				pathname: '/api/data',
				method: 'POST'
			});
			let response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// Should bypass due to excluded method
			event = createMockEvent({
				pathname: '/protected',
				method: 'GET'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(200);

			// Should require CSRF
			event = createMockEvent({
				pathname: '/protected',
				method: 'POST'
			});
			response = await middleware({ event, resolve });
			expect(response.status).toBe(403);
		});

		test('validates CSRF even with valid-looking but mismatched tokens', async () => {
			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			const event = createMockEvent({
				headers: { 'x-csrf-token': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
				cookieToken: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
			});

			const response = await middleware({ event, resolve });

			expect(response.status).toBe(403);
		});

		test('handles concurrent token sources correctly', async () => {
			const correctToken = 'correct-token';
			const wrongToken = 'wrong-token';

			const middleware = createCsrfProtection();
			const resolve = createMockResolve();

			// Header has correct token, body has wrong token
			const event = createMockEvent({
				headers: {
					'x-csrf-token': correctToken,
					'content-type': 'application/json'
				},
				body: { csrf_token: wrongToken },
				cookieToken: correctToken
			});

			const response = await middleware({ event, resolve });

			// Should succeed because header (which takes precedence) matches
			expect(response.status).toBe(200);
		});
	});
});

describe('generateCsrfToken', () => {
	test('generates a token', () => {
		const token = generateCsrfToken();
		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
	});

	test('generates token of correct length', () => {
		const token = generateCsrfToken();
		// nanoid(32) generates 32 character string
		expect(token.length).toBe(32);
	});

	test('generates unique tokens', () => {
		const token1 = generateCsrfToken();
		const token2 = generateCsrfToken();
		const token3 = generateCsrfToken();

		expect(token1).not.toBe(token2);
		expect(token2).not.toBe(token3);
		expect(token1).not.toBe(token3);
	});

	test('generates URL-safe tokens', () => {
		const token = generateCsrfToken();
		// nanoid uses URL-safe characters (A-Za-z0-9_-)
		expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
	});

	test('generates tokens with sufficient entropy', () => {
		// Generate multiple tokens and ensure they're all unique
		const tokens = new Set();
		for (let i = 0; i < 100; i++) {
			tokens.add(generateCsrfToken());
		}
		expect(tokens.size).toBe(100);
	});
});

describe('setCsrfCookie', () => {
	let originalNodeEnv: string | undefined;

	beforeEach(() => {
		originalNodeEnv = process.env.NODE_ENV;
	});

	afterEach(() => {
		if (originalNodeEnv !== undefined) {
			process.env.NODE_ENV = originalNodeEnv;
		} else {
			delete process.env.NODE_ENV;
		}
	});

	test('sets cookie with generated token', () => {
		const event = createMockEvent();
		const token = setCsrfCookie(event);

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.length).toBe(32);
		expect(event.cookies.set).toHaveBeenCalled();
	});

	test('sets cookie with correct name', () => {
		const event = createMockEvent();
		setCsrfCookie(event);

		expect(event.cookies.set).toHaveBeenCalledWith(
			'csrf_token',
			expect.any(String),
			expect.any(Object)
		);
	});

	test('sets cookie with httpOnly flag', () => {
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.httpOnly).toBe(true);
	});

	test('sets cookie with strict sameSite policy', () => {
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.sameSite).toBe('strict');
	});

	test('sets secure flag in production', () => {
		process.env.NODE_ENV = 'production';
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.secure).toBe(true);
	});

	test('does not set secure flag in development', () => {
		process.env.NODE_ENV = 'development';
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.secure).toBe(false);
	});

	test('sets cookie path to root', () => {
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.path).toBe('/');
	});

	test('sets cookie maxAge to 24 hours', () => {
		const event = createMockEvent();
		setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const options = setCall[2];
		expect(options.maxAge).toBe(60 * 60 * 24);
	});

	test('returns the generated token', () => {
		const event = createMockEvent();
		const token = setCsrfCookie(event);

		const setCall = (event.cookies.set as any).mock.calls[0];
		const cookieValue = setCall[1];
		expect(token).toBe(cookieValue);
	});
});

describe('getCsrfToken', () => {
	test('returns existing token from cookies', () => {
		const existingToken = 'existing-token-123';
		const event = createMockEvent({
			cookieToken: existingToken
		});

		const token = getCsrfToken(event);

		expect(token).toBe(existingToken);
		expect(event.cookies.set).not.toHaveBeenCalled();
	});

	test('creates and sets new token when cookie does not exist', () => {
		const event = createMockEvent();

		const token = getCsrfToken(event);

		expect(token).toBeDefined();
		expect(typeof token).toBe('string');
		expect(token.length).toBe(32);
		expect(event.cookies.set).toHaveBeenCalled();
	});

	test('returns consistent token on repeated calls with existing cookie', () => {
		const existingToken = 'consistent-token';
		const event = createMockEvent({
			cookieToken: existingToken
		});

		const token1 = getCsrfToken(event);
		const token2 = getCsrfToken(event);

		expect(token1).toBe(existingToken);
		expect(token2).toBe(existingToken);
		expect(token1).toBe(token2);
	});
});

describe('validateCsrfToken', () => {
	test('returns true for matching tokens', () => {
		const token = 'matching-token';
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': token }
		});

		const result = validateCsrfToken(request, token);

		expect(result).toBe(true);
	});

	test('returns false for mismatched tokens', () => {
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': 'token1' }
		});

		const result = validateCsrfToken(request, 'token2');

		expect(result).toBe(false);
	});

	test('returns false when cookie token is missing', () => {
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': 'token' }
		});

		const result = validateCsrfToken(request, undefined);

		expect(result).toBe(false);
	});

	test('returns false when header token is missing', () => {
		const request = new Request('https://example.com', {
			method: 'POST'
		});

		const result = validateCsrfToken(request, 'cookie-token');

		expect(result).toBe(false);
	});

	test('returns false when both tokens are missing', () => {
		const request = new Request('https://example.com', {
			method: 'POST'
		});

		const result = validateCsrfToken(request, undefined);

		expect(result).toBe(false);
	});

	test('returns false for empty string tokens', () => {
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': '' }
		});

		const result = validateCsrfToken(request, '');

		expect(result).toBe(false);
	});

	test('performs case-sensitive comparison', () => {
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': 'Token123' }
		});

		const result = validateCsrfToken(request, 'token123');

		expect(result).toBe(false);
	});

	test('performs strict equality check', () => {
		const request = new Request('https://example.com', {
			method: 'POST',
			headers: { 'x-csrf-token': 'token123' }
		});

		// Similar but different tokens should not match
		const result = validateCsrfToken(request, 'token124');

		expect(result).toBe(false);
	});
});
