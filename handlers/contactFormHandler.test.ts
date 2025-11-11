/**
 * Comprehensive tests for contactFormHandler
 *
 * This test suite provides thorough coverage of the contact form handler,
 * including rate limiting, CSRF validation, data sanitization, reCAPTCHA
 * verification, field validation, custom hooks, and email sending.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies using vi.hoisted() to ensure they're available before imports
const mockRateLimitFormSubmission = vi.hoisted(() => vi.fn());
const mockValidateCsrfToken = vi.hoisted(() => vi.fn());
const mockSanitizeFormData = vi.hoisted(() => vi.fn());
const mockVerifyRecaptchaToken = vi.hoisted(() => vi.fn());
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn()
}));

// Mock all external dependencies
vi.mock('../services/rateLimiterService.ts', () => ({
	rateLimitFormSubmission: mockRateLimitFormSubmission
}));

vi.mock('../security/csrf.js', () => ({
	validateCsrfToken: mockValidateCsrfToken
}));

vi.mock('../utils/sanitizeInput.ts', () => ({
	sanitizeFormData: mockSanitizeFormData
}));

vi.mock('../services/recaptchaVerifierService.ts', () => ({
	verifyRecaptchaToken: mockVerifyRecaptchaToken
}));

vi.mock('../services/emailService.ts', () => ({
	default: mockSendEmail
}));

vi.mock('../utils/logger.ts', () => ({
	createLogger: () => mockLogger
}));

// Import the handler after mocks are set up
import { createContactApiHandler, createContactFormHandlers } from './contactFormHandler';

/**
 * Helper function to create mock RequestEvent for testing
 */
function createMockRequestEvent(options: {
	method?: string;
	body?: any;
	clientAddress?: string;
} = {}): RequestEvent {
	const {
		method = 'POST',
		body = {},
		clientAddress = '192.168.1.1'
	} = options;

	// Create a proper Request object
	const request = new Request('https://example.com/api/contact', {
		method,
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	return {
		request,
		url: new URL('https://example.com/api/contact'),
		params: {},
		route: { id: '/api/contact' },
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn()
		},
		locals: {},
		getClientAddress: vi.fn(() => clientAddress),
		platform: undefined,
		setHeaders: vi.fn(),
		isDataRequest: false,
		isSubRequest: false,
		fetch: vi.fn()
	} as unknown as RequestEvent;
}

describe('createContactApiHandler', () => {
	beforeEach(() => {
		// Clear all mocks before each test
		vi.clearAllMocks();

		// Set default mock implementations
		mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });
		mockValidateCsrfToken.mockReturnValue(true);
		mockSanitizeFormData.mockImplementation((data) => data);
		mockVerifyRecaptchaToken.mockResolvedValue(true);
		mockSendEmail.mockResolvedValue({ success: true });
	});

	describe('Rate Limiting Tests', () => {
		test('allows requests under rate limit', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		test('blocks requests over rate limit', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({
				allowed: false,
				retryAfter: 60
			});

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(429);
			expect(data.success).toBe(false);
			expect(data.error).toBeDefined();
		});

		test('returns 429 with retryAfter on rate limit exceeded', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({
				allowed: false,
				retryAfter: 120
			});

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(429);
			expect(data.retryAfter).toBe(120);
		});

		test('uses custom rate limit options', async () => {
			const handler = createContactApiHandler({
				rateLimitMaxRequests: 10,
				rateLimitWindowMs: 60000,
				rateLimitMessage: 'Custom rate limit message'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockRateLimitFormSubmission).toHaveBeenCalledWith(
				'192.168.1.1',
				null,
				'contact',
				{
					maxRequests: 10,
					windowMs: 60000,
					message: 'Custom rate limit message'
				}
			);
		});

		test('uses custom rate limit message in error response', async () => {
			const customMessage = 'Please slow down!';
			mockRateLimitFormSubmission.mockResolvedValue({
				allowed: false,
				retryAfter: 30
			});

			const handler = createContactApiHandler({
				rateLimitMessage: customMessage
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.error).toBe(customMessage);
		});

		test('different form types have independent limits', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			// Verify rate limiter was called with 'contact' form type
			expect(mockRateLimitFormSubmission).toHaveBeenCalledWith(
				expect.any(String),
				null,
				'contact',
				expect.any(Object)
			);
		});

		test('passes client IP address to rate limiter', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' },
				clientAddress: '10.0.0.5'
			});

			await handler(event);

			// Verify first argument (client IP) is correct
			expect(mockRateLimitFormSubmission.mock.calls[0][0]).toBe('10.0.0.5');
		});
	});

	describe('CSRF Validation Tests', () => {
		test('rejects requests with invalid CSRF token', async () => {
			mockValidateCsrfToken.mockReturnValue(false);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.success).toBe(false);
			expect(data.error).toContain('security token');
		});

		test('returns 403 on CSRF failure', async () => {
			mockValidateCsrfToken.mockReturnValue(false);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(403);
		});

		test('allows requests with valid CSRF token', async () => {
			mockValidateCsrfToken.mockReturnValue(true);

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});

		test('logs CSRF validation failure', async () => {
			mockValidateCsrfToken.mockReturnValue(false);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('CSRF')
			);
		});
	});

	describe('Request Parsing Tests', () => {
		test('parses valid JSON body', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});

		test('rejects malformed JSON with 400', async () => {
			const handler = createContactApiHandler();

			// Create a request with invalid JSON
			const request = new Request('https://example.com/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{invalid json'
			});

			const event = {
				request,
				getClientAddress: vi.fn(() => '192.168.1.1')
			} as unknown as RequestEvent;

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('Invalid request format');
		});

		test('handles empty request body', async () => {
			const handler = createContactApiHandler();

			const request = new Request('https://example.com/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: '{}'
			});

			const event = {
				request,
				getClientAddress: vi.fn(() => '192.168.1.1')
			} as unknown as RequestEvent;

			const response = await handler(event);
			const data = await response.json();

			// Should fail validation due to missing required fields
			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
		});

		test('logs parsing errors', async () => {
			const handler = createContactApiHandler();

			const request = new Request('https://example.com/api/contact', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: 'not valid json at all'
			});

			const event = {
				request,
				getClientAddress: vi.fn(() => '192.168.1.1')
			} as unknown as RequestEvent;

			await handler(event);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('parse'),
				expect.anything()
			);
		});
	});

	describe('Data Sanitization Tests', () => {
		test('sanitizes form data successfully', async () => {
			mockSanitizeFormData.mockReturnValue({
				name: 'John &lt;script&gt;',
				email: 'john@example.com',
				message: 'Hello world'
			});

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John <script>', email: 'john@example.com', message: 'Hello world' }
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
			expect(mockSanitizeFormData).toHaveBeenCalled();
		});

		test('rejects when sanitization fails', async () => {
			mockSanitizeFormData.mockReturnValue(null);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('Invalid form data');
		});

		test('prevents XSS in form data', async () => {
			const maliciousData = {
				name: '<script>alert("xss")</script>',
				email: 'test@example.com',
				message: '<img src=x onerror=alert(1)>'
			};

			mockSanitizeFormData.mockReturnValue({
				name: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
				email: 'test@example.com',
				message: '&lt;img src=x onerror=alert(1)&gt;'
			});

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({ body: maliciousData });

			const response = await handler(event);

			expect(response.status).toBe(200);
			expect(mockSanitizeFormData).toHaveBeenCalledWith(maliciousData);
		});

		test('logs sanitization failure', async () => {
			mockSanitizeFormData.mockReturnValue(undefined);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('sanitization')
			);
		});
	});

	describe('reCAPTCHA Verification Tests', () => {
		test('skips verification when no token provided', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockVerifyRecaptchaToken).not.toHaveBeenCalled();
		});

		test('verifies valid reCAPTCHA token', async () => {
			mockVerifyRecaptchaToken.mockResolvedValue(true);

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				recaptchaSecretKey: 'secret-key',
				recaptchaMinScore: 0.7
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					recaptchaToken: 'valid-token'
				}
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
			expect(mockVerifyRecaptchaToken).toHaveBeenCalledWith('valid-token', {
				secretKey: 'secret-key',
				minScore: 0.7
			});
		});

		test('rejects invalid reCAPTCHA token with 400', async () => {
			mockVerifyRecaptchaToken.mockResolvedValue(false);

			const handler = createContactApiHandler({
				recaptchaSecretKey: 'secret-key'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					recaptchaToken: 'invalid-token'
				}
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.error).toContain('reCAPTCHA');
		});

		test('uses custom minScore configuration', async () => {
			mockVerifyRecaptchaToken.mockResolvedValue(true);

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				recaptchaMinScore: 0.9
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					recaptchaToken: 'token'
				}
			});

			await handler(event);

			expect(mockVerifyRecaptchaToken).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ minScore: 0.9 })
			);
		});

		test('uses custom secretKey configuration', async () => {
			mockVerifyRecaptchaToken.mockResolvedValue(true);

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				recaptchaSecretKey: 'custom-secret-key'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					recaptchaToken: 'token'
				}
			});

			await handler(event);

			expect(mockVerifyRecaptchaToken).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({ secretKey: 'custom-secret-key' })
			);
		});
	});

	describe('Field Validation Tests', () => {
		test('rejects missing name field', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.errors?.name).toBeDefined();
		});

		test('rejects empty name field', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: '   ', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors?.name).toContain('required');
		});

		test('rejects missing email field', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors?.email).toBeDefined();
		});

		test('rejects missing message field', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors?.message).toBeDefined();
		});

		test('allows optional phone field', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					phone: '555-1234'
				}
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});

		test('allows optional subject field', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					subject: 'Question'
				}
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});

		test('returns field-specific errors with 400 status', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: '', email: '', message: '' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors).toBeDefined();
			expect(typeof data.errors).toBe('object');
		});

		test('reports multiple field errors at once', async () => {
			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: '', email: '', message: '' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(Object.keys(data.errors || {}).length).toBeGreaterThan(1);
			expect(data.errors?.name).toBeDefined();
			expect(data.errors?.email).toBeDefined();
			expect(data.errors?.message).toBeDefined();
		});
	});

	describe('Custom Validation Tests', () => {
		test('calls custom validation function', async () => {
			const customValidation = vi.fn().mockResolvedValue(null);

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				customValidation
			});

			const formData = { name: 'John', email: 'john@example.com', message: 'Hello' };
			const event = createMockRequestEvent({ body: formData });

			await handler(event);

			expect(customValidation).toHaveBeenCalledWith(formData);
		});

		test('merges custom errors with built-in errors', async () => {
			const customValidation = vi.fn().mockResolvedValue({
				customField: 'Custom error message'
			});

			const handler = createContactApiHandler({
				customValidation
			});

			const event = createMockRequestEvent({
				body: { name: '', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.errors?.name).toBeDefined(); // Built-in error
			expect(data.errors?.customField).toBe('Custom error message'); // Custom error
		});

		test('handles custom validation rejection', async () => {
			const customValidation = vi.fn().mockResolvedValue({
				email: 'Email is blacklisted'
			});

			const handler = createContactApiHandler({
				customValidation
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'spam@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors?.email).toBe('Email is blacklisted');
		});

		test('skips when no custom validation provided', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});

		test('handles async custom validation', async () => {
			const customValidation = vi.fn().mockImplementation(async (data) => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return data.email.includes('invalid') ? { email: 'Invalid email' } : null;
			});

			const handler = createContactApiHandler({
				customValidation
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'invalid@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.errors?.email).toBe('Invalid email');
		});
	});

	describe('Custom Success Handler Tests', () => {
		test('calls custom success handler', async () => {
			const customSuccessHandler = vi.fn().mockResolvedValue({ customData: 'value' });

			const handler = createContactApiHandler({
				customSuccessHandler
			});

			const formData = { name: 'John', email: 'john@example.com', message: 'Hello' };
			const event = createMockRequestEvent({
				body: formData,
				clientAddress: '192.168.1.1'
			});

			await handler(event);

			expect(customSuccessHandler).toHaveBeenCalledWith(formData, '192.168.1.1');
		});

		test('merges custom success data with response', async () => {
			const customSuccessHandler = vi.fn().mockResolvedValue({
				ticketId: '12345',
				priority: 'high'
			});

			const handler = createContactApiHandler({
				customSuccessHandler,
				successMessage: 'Form submitted!'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe('Form submitted!');
			expect(data.ticketId).toBe('12345');
			expect(data.priority).toBe('high');
		});

		test('handles custom handler errors gracefully', async () => {
			const customSuccessHandler = vi.fn().mockRejectedValue(new Error('Handler error'));

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				customSuccessHandler
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			// Should still succeed and send email despite custom handler error
			expect(response.status).toBe(200);
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('Custom success handler'),
				expect.anything()
			);
		});

		test('continues to email on custom handler error', async () => {
			const customSuccessHandler = vi.fn().mockRejectedValue(new Error('Handler error'));

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				customSuccessHandler
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockSendEmail).toHaveBeenCalled();
		});

		test('skips when no custom handler provided', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(200);
		});
	});

	describe('Email Sending Tests', () => {
		test('sends email with form data', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				fromEmail: 'noreply@example.com'
			});

			const formData = {
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Test message'
			};

			const event = createMockRequestEvent({ body: formData });

			await handler(event);

			expect(mockSendEmail).toHaveBeenCalled();
		});

		test('includes all form fields in email', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const formData = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '555-1234',
				subject: 'Test Subject',
				message: 'Test message',
				category: 'support'
			};

			const event = createMockRequestEvent({ body: formData });

			await handler(event);

			const emailCall = mockSendEmail.mock.calls[0];
			const bodyHtml = emailCall[2];
			const bodyText = emailCall[3];

			expect(bodyText).toContain('John Doe');
			expect(bodyText).toContain('john@example.com');
			expect(bodyText).toContain('555-1234');
			expect(bodyText).toContain('Test Subject');
			expect(bodyText).toContain('Test message');
			expect(bodyHtml).toContain('John Doe');
			expect(bodyHtml).toContain('john@example.com');
		});

		test('uses correct subject format', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					category: 'sales'
				}
			});

			await handler(event);

			const emailCall = mockSendEmail.mock.calls[0];
			const subject = emailCall[1];

			expect(subject).toContain('New Contact Form Submission');
			expect(subject).toContain('sales');
		});

		test('sends to adminEmail', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'contact@mycompany.com',
				fromEmail: 'noreply@mycompany.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockSendEmail).toHaveBeenCalledWith(
				'contact@mycompany.com',
				expect.any(String),
				expect.any(String),
				expect.any(String),
				expect.any(Object)
			);
		});

		test('uses fromEmail in config', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				fromEmail: 'forms@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			const emailCall = mockSendEmail.mock.calls[0];
			const config = emailCall[4];

			expect(config.fromEmail).toBe('forms@example.com');
		});

		test('handles email errors gracefully (does not fail request)', async () => {
			mockSendEmail.mockRejectedValue(new Error('Email service down'));

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			// Should still return success even if email fails
			expect(response.status).toBe(200);
		});

		test('logs email success', async () => {
			mockSendEmail.mockResolvedValue({ success: true });

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining('email sent successfully')
			);
		});

		test('logs email failure', async () => {
			mockSendEmail.mockResolvedValue({ success: false, message: 'Failed to send' });

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockLogger.warn).toHaveBeenCalledWith(
				expect.stringContaining('may not have been sent'),
				expect.anything()
			);
		});

		test('formats HTML body correctly', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			const emailCall = mockSendEmail.mock.calls[0];
			const bodyHtml = emailCall[2];

			expect(bodyHtml).toContain('<h2>');
			expect(bodyHtml).toContain('<p>');
			expect(bodyHtml).toContain('<strong>');
		});

		test('formats text body correctly', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					category: 'support'
				}
			});

			await handler(event);

			const emailCall = mockSendEmail.mock.calls[0];
			const bodyText = emailCall[3];

			expect(bodyText).toContain('New contact form submission');
			expect(bodyText).toContain('Category: support');
			expect(bodyText).toContain('Name: John');
			expect(bodyText).toContain('Email: john@example.com');
			expect(bodyText).toContain('Message: Hello');
		});
	});

	describe('Success Response Tests', () => {
		test('returns 200 with success message', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				successMessage: 'Thank you for contacting us!'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.message).toBe('Thank you for contacting us!');
		});

		test('returns success: true in JSON', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.success).toBe(true);
		});

		test('uses custom success message', async () => {
			const customMessage = 'Your message has been received!';

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				successMessage: customMessage
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.message).toBe(customMessage);
		});

		test('uses default success message when not provided', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.message).toBeDefined();
			expect(data.message.length).toBeGreaterThan(0);
		});
	});

	describe('Error Handling Tests', () => {
		test('catches and handles unexpected errors', async () => {
			// Force an error by making rate limiter throw
			mockRateLimitFormSubmission.mockRejectedValue(new Error('Unexpected error'));

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.success).toBe(false);
		});

		test('returns 500 on internal errors', async () => {
			mockRateLimitFormSubmission.mockRejectedValue(new Error('Internal error'));

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);

			expect(response.status).toBe(500);
		});

		test('logs errors properly', async () => {
			const error = new Error('Test error');
			mockRateLimitFormSubmission.mockRejectedValue(error);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('Contact form API error'),
				expect.anything()
			);
		});

		test('returns generic error message', async () => {
			mockRateLimitFormSubmission.mockRejectedValue(new Error('Internal error'));

			const handler = createContactApiHandler({
				errorMessage: 'Something went wrong'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(data.error).toBe('Something went wrong');
		});

		test('does not expose internal details', async () => {
			mockRateLimitFormSubmission.mockRejectedValue(
				new Error('Database connection failed at server.internal.company.local')
			);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			// Should not contain internal error details
			expect(data.error).not.toContain('Database');
			expect(data.error).not.toContain('internal');
		});
	});

	describe('Integration Tests', () => {
		test('full happy path (all checks pass, email sent)', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });
			mockValidateCsrfToken.mockReturnValue(true);
			mockSanitizeFormData.mockImplementation((data) => data);
			mockVerifyRecaptchaToken.mockResolvedValue(true);
			mockSendEmail.mockResolvedValue({ success: true });

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				fromEmail: 'noreply@example.com',
				successMessage: 'Success!',
				recaptchaSecretKey: 'secret'
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John Doe',
					email: 'john@example.com',
					message: 'Hello world',
					recaptchaToken: 'valid-token'
				}
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.message).toBe('Success!');
			expect(mockRateLimitFormSubmission).toHaveBeenCalled();
			expect(mockValidateCsrfToken).toHaveBeenCalled();
			expect(mockSanitizeFormData).toHaveBeenCalled();
			expect(mockVerifyRecaptchaToken).toHaveBeenCalled();
			expect(mockSendEmail).toHaveBeenCalled();
		});

		test('full rejection path (rate limit failure)', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({
				allowed: false,
				retryAfter: 60
			});

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(429);
			expect(data.success).toBe(false);
			// Should not proceed to other checks
			expect(mockValidateCsrfToken).not.toHaveBeenCalled();
			expect(mockSendEmail).not.toHaveBeenCalled();
		});

		test('full rejection path (CSRF failure)', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });
			mockValidateCsrfToken.mockReturnValue(false);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.success).toBe(false);
			expect(mockSendEmail).not.toHaveBeenCalled();
		});

		test('full rejection path (validation failure)', async () => {
			mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });
			mockValidateCsrfToken.mockReturnValue(true);
			mockSanitizeFormData.mockImplementation((data) => data);

			const handler = createContactApiHandler();
			const event = createMockRequestEvent({
				body: { name: '', email: '', message: '' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.success).toBe(false);
			expect(data.errors).toBeDefined();
			expect(mockSendEmail).not.toHaveBeenCalled();
		});

		test('multiple form submissions in sequence', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event1 = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'First' }
			});

			const event2 = createMockRequestEvent({
				body: { name: 'Jane', email: 'jane@example.com', message: 'Second' }
			});

			const response1 = await handler(event1);
			const response2 = await handler(event2);

			expect(response1.status).toBe(200);
			expect(response2.status).toBe(200);
			expect(mockSendEmail).toHaveBeenCalledTimes(2);
		});

		test('different client IPs handled independently', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event1 = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' },
				clientAddress: '192.168.1.1'
			});

			const event2 = createMockRequestEvent({
				body: { name: 'Jane', email: 'jane@example.com', message: 'Hi' },
				clientAddress: '192.168.1.2'
			});

			await handler(event1);
			await handler(event2);

			// Verify each IP was passed to rate limiter
			expect(mockRateLimitFormSubmission.mock.calls[0][0]).toBe('192.168.1.1');
			expect(mockRateLimitFormSubmission.mock.calls[1][0]).toBe('192.168.1.2');
		});

		test('email failure does not break success response', async () => {
			mockSendEmail.mockRejectedValue(new Error('Email service unavailable'));

			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com'
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			const response = await handler(event);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining('Failed to send'),
				expect.anything()
			);
		});

		test('submission logging when enabled', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				logSubmissions: true
			});

			const event = createMockRequestEvent({
				body: {
					name: 'John',
					email: 'john@example.com',
					message: 'Hello',
					category: 'support'
				},
				clientAddress: '10.0.0.1'
			});

			await handler(event);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining('Contact form submission'),
				expect.objectContaining({
					category: 'support',
					ip: '10.0.0.1'
				})
			);
		});

		test('submission logging when disabled', async () => {
			const handler = createContactApiHandler({
				adminEmail: 'admin@example.com',
				logSubmissions: false
			});

			const event = createMockRequestEvent({
				body: { name: 'John', email: 'john@example.com', message: 'Hello' }
			});

			await handler(event);

			// Should not log submission details
			const logCalls = mockLogger.info.mock.calls.filter((call) =>
				call[0].includes('Contact form submission')
			);
			expect(logCalls.length).toBe(0);
		});
	});
});

describe('createContactFormHandlers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockRateLimitFormSubmission.mockResolvedValue({ allowed: true });
		mockValidateCsrfToken.mockReturnValue(true);
		mockSanitizeFormData.mockImplementation((data) => data);
		mockSendEmail.mockResolvedValue({ success: true });
	});

	test('creates handlers object with POST method', () => {
		const handlers = createContactFormHandlers({
			adminEmail: 'admin@example.com'
		});

		expect(handlers).toBeDefined();
		expect(handlers.POST).toBeDefined();
		expect(typeof handlers.POST).toBe('function');
	});

	test('POST handler works correctly', async () => {
		const handlers = createContactFormHandlers({
			adminEmail: 'admin@example.com'
		});

		const event = createMockRequestEvent({
			body: { name: 'John', email: 'john@example.com', message: 'Hello' }
		});

		const response = await handlers.POST(event);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
	});

	test('passes options to handler', async () => {
		const handlers = createContactFormHandlers({
			adminEmail: 'custom@example.com',
			successMessage: 'Custom success!'
		});

		const event = createMockRequestEvent({
			body: { name: 'John', email: 'john@example.com', message: 'Hello' }
		});

		const response = await handlers.POST(event);
		const data = await response.json();

		expect(data.message).toBe('Custom success!');
	});
});
