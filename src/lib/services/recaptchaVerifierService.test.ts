/**
 * Comprehensive security tests for recaptchaVerifierService
 *
 * Tests focus on reCAPTCHA token verification, score validation,
 * action validation, and proper error handling to prevent bot submissions.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	verifyRecaptchaToken,
	verifyRecaptchaTokenWithDetails,
	isRecaptchaApiResponse,
	type RecaptchaApiResponse
} from './recaptchaVerifierService';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helper to create mock API responses
const createMockApiResponse = (data: Partial<RecaptchaApiResponse>): RecaptchaApiResponse => ({
	success: false,
	...data
});

// Helper to create mock fetch response
const createMockFetchResponse = (data: any, status = 200) => ({
	ok: status >= 200 && status < 300,
	status,
	json: async () => data
});

describe('verifyRecaptchaToken', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv, NODE_ENV: 'test' };
		mockFetch.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test('returns true for valid token with successful verification', async () => {
		const mockResponse = createMockApiResponse({
			success: true,
			score: 0.9,
			action: 'submit'
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaToken('valid_token_abc123xyz', {
			secretKey: 'test_secret_key'
		});

		expect(result).toBe(true);
	});

	test('returns false for invalid token', async () => {
		const mockResponse = createMockApiResponse({
			success: false,
			'error-codes': ['invalid-input-response']
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaToken('invalid_token', {
			secretKey: 'test_secret_key'
		});

		expect(result).toBe(false);
	});

	test('returns false when token is missing', async () => {
		const result = await verifyRecaptchaToken('', {
			secretKey: 'test_secret_key'
		});

		expect(result).toBe(false);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test('returns false when secret key is missing', async () => {
		const result = await verifyRecaptchaToken('some_token', {
			secretKey: undefined
		});

		expect(result).toBe(false);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test('uses secretKey from options', async () => {
		const mockResponse = createMockApiResponse({ success: true });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		await verifyRecaptchaToken('token_abc123', {
			secretKey: 'custom_secret_key'
		});

		expect(mockFetch).toHaveBeenCalledWith(
			'https://www.google.com/recaptcha/api/siteverify',
			expect.objectContaining({
				method: 'POST',
				body: expect.stringContaining('secret=custom_secret_key')
			})
		);
	});

	test('uses secretKey from environment variable when not provided in options', async () => {
		process.env.RECAPTCHA_SECRET_KEY = 'env_secret_key';
		const mockResponse = createMockApiResponse({ success: true });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		await verifyRecaptchaToken('token_xyz789', {});

		expect(mockFetch).toHaveBeenCalledWith(
			'https://www.google.com/recaptcha/api/siteverify',
			expect.objectContaining({
				body: expect.stringContaining('secret=env_secret_key')
			})
		);
	});

	test('handles fetch errors gracefully and returns false', async () => {
		mockFetch.mockRejectedValueOnce(new Error('Network error'));

		const result = await verifyRecaptchaToken('token_fail', {
			secretKey: 'test_secret_key'
		});

		expect(result).toBe(false);
	});

	test('returns boolean value, not detailed response object', async () => {
		const mockResponse = createMockApiResponse({
			success: true,
			score: 0.8,
			action: 'login'
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaToken('token_check', {
			secretKey: 'test_secret_key'
		});

		expect(typeof result).toBe('boolean');
		expect(result).toBe(true);
	});
});

describe('verifyRecaptchaTokenWithDetails', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv, NODE_ENV: 'test' };
		mockFetch.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe('Development Bypass', () => {
		test('bypasses verification in development when allowInDevelopment is true', async () => {
			process.env.NODE_ENV = 'development';

			const result = await verifyRecaptchaTokenWithDetails('any_token', {
				allowInDevelopment: true,
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(true);
			expect(result.score).toBe(1.0);
			expect(result.action).toBe('development_bypass');
			expect(result.hostname).toBe('localhost');
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test('does NOT bypass in development when allowInDevelopment is false', async () => {
			process.env.NODE_ENV = 'development';
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_dev', {
				allowInDevelopment: false,
				secretKey: 'test_secret_key'
			});

			expect(mockFetch).toHaveBeenCalled();
		});

		test('does NOT bypass in production even with allowInDevelopment true', async () => {
			process.env.NODE_ENV = 'production';
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_prod', {
				allowInDevelopment: true,
				secretKey: 'test_secret_key'
			});

			expect(mockFetch).toHaveBeenCalled();
		});

		test('returns score 1.0 for development bypass', async () => {
			process.env.NODE_ENV = 'development';

			const result = await verifyRecaptchaTokenWithDetails('bypass_token', {
				allowInDevelopment: true
			});

			expect(result.score).toBe(1.0);
		});

		test('uses provided action in development bypass or defaults to development_bypass', async () => {
			process.env.NODE_ENV = 'development';

			const result1 = await verifyRecaptchaTokenWithDetails('token1', {
				allowInDevelopment: true,
				action: 'custom_action'
			});
			expect(result1.action).toBe('custom_action');

			const result2 = await verifyRecaptchaTokenWithDetails('token2', {
				allowInDevelopment: true
			});
			expect(result2.action).toBe('development_bypass');
		});
	});

	describe('Parameter Validation', () => {
		test('returns error when token is missing', async () => {
			const result = await verifyRecaptchaTokenWithDetails('', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing reCAPTCHA token');
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test('returns error when token is empty string', async () => {
			const result = await verifyRecaptchaTokenWithDetails('', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Missing reCAPTCHA token');
		});

		test('returns error when secretKey is missing from both options and env', async () => {
			delete process.env.RECAPTCHA_SECRET_KEY;

			const result = await verifyRecaptchaTokenWithDetails('token_no_secret', {});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Missing reCAPTCHA secret key');
			expect(mockFetch).not.toHaveBeenCalled();
		});

		test('uses process.env.RECAPTCHA_SECRET_KEY as default', async () => {
			process.env.RECAPTCHA_SECRET_KEY = 'env_default_key';
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_env_default', {});

			expect(mockFetch).toHaveBeenCalledWith(
				'https://www.google.com/recaptcha/api/siteverify',
				expect.objectContaining({
					body: expect.stringContaining('secret=env_default_key')
				})
			);
		});
	});

	describe('Google API Integration', () => {
		test('makes POST request to correct URL', async () => {
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_url_test', {
				secretKey: 'test_secret_key'
			});

			expect(mockFetch).toHaveBeenCalledWith(
				'https://www.google.com/recaptcha/api/siteverify',
				expect.any(Object)
			);
		});

		test('sends correct headers (application/x-www-form-urlencoded)', async () => {
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_headers', {
				secretKey: 'test_secret_key'
			});

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					}
				})
			);
		});

		test('sends correct body params (secret and response)', async () => {
			const mockResponse = createMockApiResponse({ success: true });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			await verifyRecaptchaTokenWithDetails('token_body_test', {
				secretKey: 'my_secret_key'
			});

			expect(mockFetch).toHaveBeenCalledWith(
				expect.any(String),
				expect.objectContaining({
					body: 'secret=my_secret_key&response=token_body_test'
				})
			);
		});

		test('handles successful verification (success=true)', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				score: 0.9,
				action: 'submit_form',
				hostname: 'example.com',
				challenge_ts: '2025-01-15T10:00:00Z'
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('valid_token_success', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(true);
			expect(result.score).toBe(0.9);
			expect(result.action).toBe('submit_form');
			expect(result.hostname).toBe('example.com');
		});

		test('handles failed verification (success=false)', async () => {
			const mockResponse = createMockApiResponse({
				success: false,
				'error-codes': ['invalid-input-response']
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('invalid_token_fail', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('invalid-input-response');
		});

		test('handles API error codes', async () => {
			const mockResponse = createMockApiResponse({
				success: false,
				'error-codes': ['timeout-or-duplicate', 'bad-request']
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('error_token', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('timeout-or-duplicate, bad-request');
			expect(result['error-codes']).toEqual(['timeout-or-duplicate', 'bad-request']);
		});

		test.each([
			{ status: 500, token: 'token_500' },
			{ status: 404, token: 'token_404' },
			{ status: 403, token: 'token_403' }
		])('handles non-200 HTTP status: $status', async ({ status, token }) => {
			mockFetch.mockResolvedValueOnce(createMockFetchResponse({}, status));

			const result = await verifyRecaptchaTokenWithDetails(token, {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe(`reCAPTCHA API returned status ${status}`);
		});

		test('handles network errors', async () => {
			mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

			const result = await verifyRecaptchaTokenWithDetails('network_error_token', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Failed to fetch');
		});

		test('handles malformed JSON response', async () => {
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw new Error('Unexpected token in JSON');
				}
			});

			const result = await verifyRecaptchaTokenWithDetails('malformed_json_token', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Unexpected token in JSON');
		});
	});

	describe('Score Validation (v3)', () => {
		test('accepts scores greater than or equal to minScore', async () => {
			// Test score above minScore
			const mockResponse1 = createMockApiResponse({ success: true, score: 0.7 });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse1));
			const result1 = await verifyRecaptchaTokenWithDetails('high_score_token', {
				secretKey: 'test_secret_key',
				minScore: 0.6
			});
			expect(result1.success).toBe(true);
			expect(result1.score).toBe(0.7);

			// Test score exactly equal to minScore
			const mockResponse2 = createMockApiResponse({ success: true, score: 0.5 });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse2));
			const result2 = await verifyRecaptchaTokenWithDetails('exact_score_token', {
				secretKey: 'test_secret_key',
				minScore: 0.5
			});
			expect(result2.success).toBe(true);
		});

		test('rejects scores less than minScore with detailed error', async () => {
			const mockResponse = createMockApiResponse({ success: true, score: 0.3 });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('low_score_token', {
				secretKey: 'test_secret_key',
				minScore: 0.5
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain('Score 0.3 is below minimum threshold 0.5');
		});

		test('uses default minScore of 0.5 and respects custom minScore', async () => {
			// Test default minScore (0.5)
			const mockResponse1 = createMockApiResponse({ success: true, score: 0.4 });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse1));
			const result1 = await verifyRecaptchaTokenWithDetails('default_min_token', {
				secretKey: 'test_secret_key'
			});
			expect(result1.success).toBe(false);
			expect(result1.error).toContain('Score 0.4 is below minimum threshold 0.5');

			// Test custom minScore (0.7)
			const mockResponse2 = createMockApiResponse({ success: true, score: 0.6 });
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse2));
			const result2 = await verifyRecaptchaTokenWithDetails('custom_min_token', {
				secretKey: 'test_secret_key',
				minScore: 0.7
			});
			expect(result2.success).toBe(false);
			expect(result2.error).toBe('Score 0.6 is below minimum threshold 0.7');
		});

		test('passes when score is undefined (v2 scenario)', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				// No score property (v2 doesn't provide scores)
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('v2_token', {
				secretKey: 'test_secret_key',
				minScore: 0.5
			});

			expect(result.success).toBe(true);
		});
	});

	describe('Action Validation (v3)', () => {
		test('accepts matching action', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				action: 'submit_form',
				score: 0.9
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('matching_action_token', {
				secretKey: 'test_secret_key',
				action: 'submit_form'
			});

			expect(result.success).toBe(true);
			expect(result.action).toBe('submit_form');
		});

		test('rejects non-matching action', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				action: 'login',
				score: 0.9
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('wrong_action_token', {
				secretKey: 'test_secret_key',
				action: 'submit_form'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Action mismatch: expected 'submit_form', got 'login'");
		});

		test('passes when action is null or not provided in options', async () => {
			// Test with action: null
			const mockResponse1 = createMockApiResponse({
				success: true,
				action: 'any_action',
				score: 0.9
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse1));
			const result1 = await verifyRecaptchaTokenWithDetails('no_action_check_token', {
				secretKey: 'test_secret_key',
				action: null
			});
			expect(result1.success).toBe(true);

			// Test with action not provided
			const mockResponse2 = createMockApiResponse({
				success: true,
				action: 'any_action',
				score: 0.9
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse2));
			const result2 = await verifyRecaptchaTokenWithDetails('no_action_option_token', {
				secretKey: 'test_secret_key'
			});
			expect(result2.success).toBe(true);
		});

		test('fails when expected action provided but no action in API response', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				score: 0.9
				// No action property
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('no_response_action_token', {
				secretKey: 'test_secret_key',
				action: 'submit_form'
			});

			// When expected action is provided but response has no action, it's a mismatch
			expect(result.success).toBe(false);
			expect(result.error).toBe("Action mismatch: expected 'submit_form', got 'undefined'");
		});

		test('returns detailed error message for action mismatch', async () => {
			const mockResponse = createMockApiResponse({
				success: true,
				action: 'register',
				score: 0.9
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('mismatch_detail_token', {
				secretKey: 'test_secret_key',
				action: 'checkout'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe("Action mismatch: expected 'checkout', got 'register'");
		});
	});

	describe('Error Handling', () => {
		test('catches fetch and JSON parse exceptions with proper error structure', async () => {
			// Test fetch exception
			mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));
			const result1 = await verifyRecaptchaTokenWithDetails('fetch_exception_token', {
				secretKey: 'test_secret_key'
			});
			expect(result1.success).toBe(false);
			expect(result1.error).toBe('Connection timeout');
			expect(result1).toHaveProperty('success');
			expect(result1).toHaveProperty('error');
			expect(typeof result1.error).toBe('string');

			// Test JSON parse exception
			mockFetch.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => {
					throw new SyntaxError('Unexpected end of JSON input');
				}
			});
			const result2 = await verifyRecaptchaTokenWithDetails('json_parse_error_token', {
				secretKey: 'test_secret_key'
			});
			expect(result2.success).toBe(false);
			expect(result2.error).toBe('Unexpected end of JSON input');
		});

		test('includes error-codes from API response', async () => {
			const mockResponse = createMockApiResponse({
				success: false,
				'error-codes': ['missing-input-secret', 'invalid-input-response']
			});
			mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

			const result = await verifyRecaptchaTokenWithDetails('error_codes_token', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result['error-codes']).toEqual(['missing-input-secret', 'invalid-input-response']);
			expect(result.error).toBe('missing-input-secret, invalid-input-response');
		});

		test('handles non-Error exceptions gracefully', async () => {
			mockFetch.mockRejectedValueOnce('String error');

			const result = await verifyRecaptchaTokenWithDetails('non_error_exception', {
				secretKey: 'test_secret_key'
			});

			expect(result.success).toBe(false);
			expect(result.error).toBe('Unknown verification error');
		});
	});
});

describe('isRecaptchaApiResponse', () => {
	test('returns true for valid response objects', () => {
		// Valid full response
		const validResponse: RecaptchaApiResponse = {
			success: true,
			score: 0.9,
			action: 'submit'
		};
		expect(isRecaptchaApiResponse(validResponse)).toBe(true);

		// Minimal valid object
		const minimalResponse = { success: false };
		expect(isRecaptchaApiResponse(minimalResponse)).toBe(true);
	});

	test('returns false for null, undefined, and non-object types', () => {
		expect(isRecaptchaApiResponse(null)).toBeFalsy();
		expect(isRecaptchaApiResponse(undefined)).toBeFalsy();
		expect(isRecaptchaApiResponse('string')).toBe(false);
		expect(isRecaptchaApiResponse(123)).toBe(false);
		expect(isRecaptchaApiResponse(true)).toBe(false);
		expect(isRecaptchaApiResponse([])).toBe(false);
	});

	test('returns false for invalid objects', () => {
		// Missing success property
		const noSuccess = { score: 0.9, action: 'submit' };
		expect(isRecaptchaApiResponse(noSuccess)).toBe(false);

		// Non-boolean success property
		const wrongType = { success: 'true' };
		expect(isRecaptchaApiResponse(wrongType)).toBe(false);
	});
});

describe('Integration Tests', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv, NODE_ENV: 'test' };
		mockFetch.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test('full success flow with all validations passing', async () => {
		const mockResponse = createMockApiResponse({
			success: true,
			score: 0.85,
			action: 'contact_form',
			hostname: 'mysite.com',
			challenge_ts: '2025-01-15T12:00:00Z'
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaTokenWithDetails(
			'integration_valid_token_abc123xyz789',
			{
				secretKey: 'integration_secret_key',
				action: 'contact_form',
				minScore: 0.7
			}
		);

		expect(result.success).toBe(true);
		expect(result.score).toBe(0.85);
		expect(result.action).toBe('contact_form');
		expect(result.hostname).toBe('mysite.com');
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	test('development bypass flow without API call', async () => {
		process.env.NODE_ENV = 'development';

		const result = await verifyRecaptchaTokenWithDetails('dev_bypass_token', {
			allowInDevelopment: true,
			secretKey: 'not_used'
		});

		expect(result.success).toBe(true);
		expect(result.score).toBe(1.0);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test('combined validation checks score before action', async () => {
		const mockResponse = createMockApiResponse({
			success: true,
			score: 0.2,
			action: 'wrong_action'
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaTokenWithDetails('combined_validation_token', {
			secretKey: 'test_secret_key',
			minScore: 0.5,
			action: 'expected_action'
		});

		expect(result.success).toBe(false);
		expect(result.error).toContain('Score 0.2 is below minimum threshold 0.5');
	});
});

describe('Edge Cases', () => {
	const originalEnv = process.env;

	beforeEach(() => {
		process.env = { ...originalEnv, NODE_ENV: 'test' };
		mockFetch.mockClear();
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	test('handles various token formats and empty options', async () => {
		// Empty options with env secret
		process.env.RECAPTCHA_SECRET_KEY = 'env_key';
		const mockResponse1 = createMockApiResponse({ success: true, score: 0.9 });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse1));
		const result1 = await verifyRecaptchaTokenWithDetails('empty_options_token', {});
		expect(result1.success).toBe(true);

		// Very long token
		const longToken = 'a'.repeat(10000);
		const mockResponse2 = createMockApiResponse({ success: true });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse2));
		const result2 = await verifyRecaptchaTokenWithDetails(longToken, {
			secretKey: 'test_secret_key'
		});
		expect(result2.success).toBe(true);
		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				body: expect.stringContaining(longToken)
			})
		);

		// Special characters in token
		const specialToken = 'token-with_special.chars+equals==%20';
		const mockResponse3 = createMockApiResponse({ success: true });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse3));
		const result3 = await verifyRecaptchaTokenWithDetails(specialToken, {
			secretKey: 'test_secret_key'
		});
		expect(result3.success).toBe(true);
	});

	test('handles multiple error codes from API', async () => {
		const mockResponse = createMockApiResponse({
			success: false,
			'error-codes': [
				'missing-input-secret',
				'invalid-input-secret',
				'missing-input-response',
				'invalid-input-response',
				'bad-request'
			]
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaTokenWithDetails('multiple_errors_token', {
			secretKey: 'test_secret_key'
		});

		expect(result.success).toBe(false);
		expect(result['error-codes']).toHaveLength(5);
		expect(result.error).toContain('missing-input-secret');
		expect(result.error).toContain('bad-request');
	});

	test('handles API response with unexpected additional fields', async () => {
		const mockResponse = {
			success: true,
			score: 0.9,
			action: 'submit',
			// Unexpected fields
			foo: 'bar',
			nested: { data: 'value' },
			array: [1, 2, 3]
		};
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaTokenWithDetails('unexpected_fields_token', {
			secretKey: 'test_secret_key'
		});

		expect(result.success).toBe(true);
		expect(result.score).toBe(0.9);
	});

	test('handles edge case scores (0.0 and 1.0) and empty error-codes', async () => {
		// Score of exactly 0.0
		const mockResponse1 = createMockApiResponse({ success: true, score: 0.0 });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse1));
		const result1 = await verifyRecaptchaTokenWithDetails('zero_score_token', {
			secretKey: 'test_secret_key',
			minScore: 0.0
		});
		expect(result1.success).toBe(true);
		expect(result1.score).toBe(0.0);

		// Score of exactly 1.0
		const mockResponse2 = createMockApiResponse({ success: true, score: 1.0 });
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse2));
		const result2 = await verifyRecaptchaTokenWithDetails('perfect_score_token', {
			secretKey: 'test_secret_key',
			minScore: 1.0
		});
		expect(result2.success).toBe(true);
		expect(result2.score).toBe(1.0);

		// Empty error-codes array
		const mockResponse3 = createMockApiResponse({
			success: false,
			'error-codes': []
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse3));
		const result3 = await verifyRecaptchaTokenWithDetails('empty_errors_token', {
			secretKey: 'test_secret_key'
		});
		expect(result3.success).toBe(false);
		expect(result3.error).toBe('Verification failed');
	});

	test('handles response with missing hostname and challenge_ts', async () => {
		const mockResponse = createMockApiResponse({
			success: true,
			score: 0.9
			// No hostname or challenge_ts
		});
		mockFetch.mockResolvedValueOnce(createMockFetchResponse(mockResponse));

		const result = await verifyRecaptchaTokenWithDetails('missing_fields_token', {
			secretKey: 'test_secret_key'
		});

		expect(result.success).toBe(true);
		expect(result.hostname).toBeUndefined();
		expect(result.challenge_ts).toBeUndefined();
	});
});
