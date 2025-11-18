/**
 * Comprehensive tests for categoryRouter.ts
 *
 * Tests cover all core category router functionality including:
 * - Router creation and configuration
 * - Category routing and validation
 * - CSRF protection
 * - Form data parsing and validation
 * - Submission handling
 * - Error handling and custom error handlers
 * - Success redirects
 * - Label-based slug redirects
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock dependencies using vi.hoisted() to ensure they're available before imports
const mockLogger = vi.hoisted(() => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	debug: vi.fn()
}));

const mockValidateCsrfToken = vi.hoisted(() => vi.fn());

// Mock external dependencies
vi.mock('../utils/logger.ts', () => ({
	createLogger: () => mockLogger
}));

vi.mock('../security/csrf.js', () => ({
	validateCsrfToken: mockValidateCsrfToken
}));

// Import after mocks are set up
import {
	createCategoryRouter,
	createContactRouteHandlers,
	type CategoriesMap,
	type LoadResult,
	type SubmissionResult
} from './categoryRouter';

/**
 * Test categories fixture
 */
const testCategories: CategoriesMap = {
	general: {
		label: 'General Inquiry',
		description: 'General questions and inquiries',
		fields: ['name', 'email', 'message']
	},
	support: {
		label: 'Technical Support',
		description: 'Technical support requests',
		fields: ['name', 'email', 'browser', 'message']
	},
	sales: {
		label: 'Sales Inquiry',
		description: 'Sales and pricing questions',
		fields: ['name', 'email', 'company', 'message']
	}
};

/**
 * Helper to create mock load event parameters
 */
function createMockLoadParams(options: {
	slug: string;
	lang?: string;
	searchParams?: Record<string, string>;
}): any {
	const { slug, lang = 'en', searchParams = {} } = options;

	const url = new URL(`http://localhost:3000/contact/${slug}`);
	Object.entries(searchParams).forEach(([key, value]) => {
		url.searchParams.set(key, value);
	});

	return {
		params: { slug, lang },
		url,
		error: vi.fn((status: number, message: string) => {
			const error: any = new Error(message);
			error.status = status;
			error.message = message;
			throw error;
		}),
		redirect: vi.fn((status: number, location: string) => {
			const error: any = new Error(`Redirect ${status}`);
			error.status = status;
			error.location = location;
			throw error;
		})
	};
}

/**
 * Helper to create mock RequestEvent for actions
 */
function createMockRequestEvent(options: {
	slug: string;
	lang?: string;
	formData?: Record<string, string>;
	locals?: any;
}): RequestEvent {
	const { slug, lang = 'en', formData = {}, locals = {} } = options;

	const form = new FormData();
	Object.entries(formData).forEach(([key, value]) => {
		form.append(key, value);
	});

	const request = new Request(`http://localhost:3000/contact/${slug}`, {
		method: 'POST',
		body: form
	});

	const url = new URL(`http://localhost:3000/contact/${slug}`);

	// Mock redirect that actually throws
	const mockRedirect = vi.fn((status: number, location: string) => {
		const error: any = new Error(`Redirect ${status}`);
		error.status = status;
		error.location = location;
		throw error;
	});

	return {
		request,
		url,
		params: { slug, lang },
		redirect: mockRedirect,
		locals,
		route: { id: `/contact/${slug}` },
		cookies: {
			get: vi.fn(),
			set: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn()
		},
		getClientAddress: vi.fn(() => '192.168.1.1'),
		platform: undefined,
		setHeaders: vi.fn(),
		isDataRequest: false,
		isSubRequest: false,
		fetch: vi.fn()
	} as unknown as RequestEvent;
}

describe('createCategoryRouter', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockValidateCsrfToken.mockReturnValue(true);
	});

	describe('Router Creation and Configuration', () => {
		test('creates router with default config', () => {
			const router = createCategoryRouter({});

			expect(router).toHaveProperty('load');
			expect(router).toHaveProperty('handleSubmission');
			expect(router).toHaveProperty('categories');
			expect(typeof router.load).toBe('function');
			expect(typeof router.handleSubmission).toBe('function');
		});

		test('creates router with merged config options', () => {
			const router = createCategoryRouter({
				categories: testCategories,
				basePath: '/custom',
				defaultCategory: 'support',
				successPath: '/thank-you'
			});

			expect(router).toHaveProperty('load');
			expect(router).toHaveProperty('handleSubmission');
			expect(router).toHaveProperty('categories');
			expect(router.categories).toBe(testCategories);
		});

		test('handles empty categories object', () => {
			const router = createCategoryRouter({ categories: {} });

			expect(router.categories).toEqual({});
		});
	});

	describe('load() function - Category Routing', () => {
		test('returns form state for valid category', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({ slug: 'general' });
			const result = await router.load(mockLoadParams);

			expect(result.form).toBeDefined();
			expect(result.form.data).toEqual({});
			expect(result.form.errors).toEqual({});
			expect(result.form.isSubmitted).toBe(false);
			expect(result.categorySlug).toBe('general');
			expect(result.category).toEqual(testCategories.general);
		});

		test('throws 404 error for invalid category', async () => {
			const router = createCategoryRouter({ categories: testCategories });
			const mockLoadParams = createMockLoadParams({ slug: 'invalid' });

			try {
				await router.load(mockLoadParams);
				expect.fail('Should have thrown 404');
			} catch (e: any) {
				expect(e.status).toBe(404);
				expect(e.message).toContain('Category not found: invalid');
			}
		});

		test('handles success page with slug === success', async () => {
			const router = createCategoryRouter({
				categories: testCategories,
				defaultCategory: 'general'
			});

			const mockLoadParams = createMockLoadParams({
				slug: 'success',
				searchParams: { category: 'support' }
			});

			const result = await router.load(mockLoadParams);

			expect(result.showThankYou).toBe(true);
			expect(result.categorySlug).toBe('support');
		});

		test('returns showThankYou flag for success page', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({
				slug: 'success',
				searchParams: { category: 'general' }
			});

			const result = await router.load(mockLoadParams);

			expect(result.showThankYou).toBe(true);
		});

		test('reads category from URL searchParams on success page', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({
				slug: 'success',
				searchParams: { category: 'sales' }
			});

			const result = await router.load(mockLoadParams);

			expect(result.categorySlug).toBe('sales');
		});

		test('redirects to canonical slug when label-based slug used', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({
				slug: 'technical-support',
				lang: 'en'
			});

			try {
				await router.load(mockLoadParams);
				expect.fail('Should have thrown redirect');
			} catch (e: any) {
				expect(e.status).toBe(301);
				expect(e.location).toBe('/en/contact/support');
			}
		});

		test('redirect has status 301', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({
				slug: 'general-inquiry'
			});

			try {
				await router.load(mockLoadParams);
				expect.fail('Should have thrown redirect');
			} catch (e: any) {
				expect(e.status).toBe(301);
			}
		});

		test('handles lang parameter correctly in redirect', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({
				slug: 'sales-inquiry',
				lang: 'fr'
			});

			try {
				await router.load(mockLoadParams);
				expect.fail('Should have thrown redirect');
			} catch (e: any) {
				expect(e.location).toContain('/fr/');
			}
		});

		test('calls getValidatorForCategory if provided', async () => {
			const mockValidator = { validate: vi.fn() };
			const getValidatorForCategory = vi.fn(() => mockValidator);

			const router = createCategoryRouter({
				categories: testCategories,
				getValidatorForCategory
			});

			const mockLoadParams = createMockLoadParams({ slug: 'general' });
			await router.load(mockLoadParams);

			expect(getValidatorForCategory).toHaveBeenCalledWith('general');
		});

		test('attaches validator to form state', async () => {
			const mockValidator = { validate: vi.fn() };
			const getValidatorForCategory = vi.fn(() => mockValidator);

			const router = createCategoryRouter({
				categories: testCategories,
				getValidatorForCategory
			});

			const mockLoadParams = createMockLoadParams({ slug: 'support' });
			const result = await router.load(mockLoadParams);

			expect(result.form.validator).toBe(mockValidator);
		});

		test('returns correct category config', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({ slug: 'sales' });
			const result = await router.load(mockLoadParams);

			expect(result.category).toEqual(testCategories.sales);
			expect(result.category?.label).toBe('Sales Inquiry');
		});

		test('handles defaultCategory fallback on success page', async () => {
			const router = createCategoryRouter({
				categories: testCategories,
				defaultCategory: 'support'
			});

			const mockLoadParams = createMockLoadParams({
				slug: 'success'
				// No category in searchParams
			});

			const result = await router.load(mockLoadParams);

			expect(result.categorySlug).toBe('support');
		});

		test('form state has all required properties', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({ slug: 'general' });
			const result = await router.load(mockLoadParams);

			expect(result.form).toHaveProperty('data');
			expect(result.form).toHaveProperty('errors');
			expect(result.form).toHaveProperty('isSubmitted');
		});

		test('handles categories with validation field', async () => {
			const categoriesWithValidation: CategoriesMap = {
				special: {
					label: 'Special Form',
					validation: { minLength: 10 }
				}
			};

			const router = createCategoryRouter({ categories: categoriesWithValidation });

			const mockLoadParams = createMockLoadParams({ slug: 'special' });
			const result = await router.load(mockLoadParams);

			expect(result.category).toEqual(categoriesWithValidation.special);
		});
	});

	describe('handleSubmission() - CSRF Validation', () => {
		test('validates CSRF token using validateCsrfToken', async () => {
			const router = createCategoryRouter({ categories: testCategories });
			mockValidateCsrfToken.mockReturnValue(true);

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: {
					name: 'John Doe',
					email: 'john@example.com',
					message: 'Test message'
				}
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockValidateCsrfToken).toHaveBeenCalledWith(mockEvent.request);
		});

		test('handles CSRF validation failure comprehensively', async () => {
			const router = createCategoryRouter({ categories: testCategories });
			mockValidateCsrfToken.mockReturnValue(false);

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John Doe', email: 'john@example.com' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toContain('Invalid security token');
			expect(result.form.isSubmitted).toBe(false);
			expect(mockLogger.error).toHaveBeenCalledWith('CSRF validation failed');
			expect(result.form.data.name).toBe('John Doe');
			expect(result.form.data.email).toBe('john@example.com');
		});
	});

	describe('handleSubmission() - Form Data Parsing', () => {
		test('parses FormData to plain object by default', async () => {
			const mockSubmissionHandler = vi.fn();
			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: {
					name: 'John Doe',
					email: 'john@example.com',
					message: 'Test message'
				}
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockSubmissionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'John Doe',
					email: 'john@example.com',
					message: 'Test message',
					category: 'general'
				}),
				'general'
			);
		});

		test('calls formDataParser if provided', async () => {
			const mockFormDataParser = vi.fn(async (formData, category) => ({
				data: { parsed: true, category },
				errors: {}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John Doe' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockFormDataParser).toHaveBeenCalled();
		});

		test('passes formData and slug to formDataParser', async () => {
			const mockFormDataParser = vi.fn(async (_formData, _category) => ({
				data: {},
				errors: {}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser
			});

			const mockEvent = createMockRequestEvent({
				slug: 'support',
				formData: { name: 'Jane' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			const [formData, slug] = mockFormDataParser.mock.calls[0];
			expect(formData).toBeDefined();
			expect(slug).toBe('support');
		});

		test('uses parsed data from formDataParser result', async () => {
			const mockSubmissionHandler = vi.fn();
			const mockFormDataParser = vi.fn(async () => ({
				data: { custom: 'parsed', field: 'value' },
				errors: {}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockSubmissionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					custom: 'parsed',
					field: 'value',
					category: 'general'
				}),
				'general'
			);
		});

		test('uses parsed errors from formDataParser result', async () => {
			const mockFormDataParser = vi.fn(async () => ({
				data: { name: 'John' },
				errors: { email: 'Email is required', message: 'Message is required' }
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors).toEqual({
				email: 'Email is required',
				message: 'Message is required'
			});
		});

		test('returns validation errors without processing', async () => {
			const mockSubmissionHandler = vi.fn();
			const mockFormDataParser = vi.fn(async () => ({
				data: { name: 'John' },
				errors: { email: 'Email is required' }
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors).toEqual({ email: 'Email is required' });
			expect(result.form.isSubmitted).toBe(false);
			expect(mockSubmissionHandler).not.toHaveBeenCalled();
		});

		test('logs form submission with category and lang', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockEvent = createMockRequestEvent({
				slug: 'support',
				lang: 'fr',
				formData: { name: 'Jean', email: 'jean@example.com', message: 'Bonjour' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockLogger.info).toHaveBeenCalledWith(
				'Contact form submission received',
				expect.objectContaining({
					category: 'support',
					lang: 'fr'
				})
			);
		});

		test('handles empty formData gracefully', async () => {
			const mockFormDataParser = vi.fn(async () => ({
				data: {},
				errors: {}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				formDataParser: mockFormDataParser
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: {}
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockFormDataParser).toHaveBeenCalled();
		});
	});

	describe('handleSubmission() - Submission Processing', () => {
		test('calls createSubmissionHandler if provided', async () => {
			const mockSubmissionHandler = vi.fn();
			const mockCreateSubmissionHandler = vi.fn(async () => mockSubmissionHandler);

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: mockCreateSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' },
				locals: { userId: '123' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockCreateSubmissionHandler).toHaveBeenCalled();
		});

		test('passes locals to createSubmissionHandler', async () => {
			const mockSubmissionHandler = vi.fn();
			const mockCreateSubmissionHandler = vi.fn(async () => mockSubmissionHandler);

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: mockCreateSubmissionHandler
			});

			const locals = { userId: '456', session: 'abc123' };
			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'Jane', email: 'jane@example.com', message: 'Hello' },
				locals
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockCreateSubmissionHandler).toHaveBeenCalledWith(locals);
		});

		test('calls returned submissionHandler with data and slug', async () => {
			const mockSubmissionHandler = vi.fn();
			const mockCreateSubmissionHandler = vi.fn(async () => mockSubmissionHandler);

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: mockCreateSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'sales',
				formData: { name: 'Bob', email: 'bob@example.com', message: 'Pricing info' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockSubmissionHandler).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Bob',
					email: 'bob@example.com',
					message: 'Pricing info',
					category: 'sales'
				}),
				'sales'
			);
		});

		test('adds category field to data before submission', async () => {
			const mockSubmissionHandler = vi.fn();

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'support',
				formData: { name: 'Alice', email: 'alice@example.com', message: 'Help' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			const callData = mockSubmissionHandler.mock.calls[0][0];
			expect(callData.category).toBe('support');
		});

		test('redirects to success page with correct parameters', async () => {
			const router = createCategoryRouter({
				categories: testCategories,
				successPath: '/custom-success'
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				lang: 'en',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			await expect(router.handleSubmission(mockEvent)).rejects.toMatchObject({
				status: 303,
				location: expect.stringMatching(/\/en\/custom-success\?category=general/)
			});
		});

		test('handles submission when no handler provided', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			await expect(router.handleSubmission(mockEvent)).rejects.toMatchObject({
				status: 303
			});
		});

		test('logs successful submission', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockEvent = createMockRequestEvent({
				slug: 'sales',
				formData: { name: 'Bob', email: 'bob@example.com', message: 'Quote' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			expect(mockLogger.info).toHaveBeenCalledWith(
				'Form submission processed successfully',
				expect.objectContaining({ category: 'sales' })
			);
		});

		test('submission handler receives complete data object', async () => {
			const mockSubmissionHandler = vi.fn();

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: {
					name: 'John Doe',
					email: 'john@example.com',
					phone: '555-1234',
					message: 'Test message'
				}
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e) {
				// Expect redirect
			}

			const callData = mockSubmissionHandler.mock.calls[0][0];
			expect(callData).toEqual({
				name: 'John Doe',
				email: 'john@example.com',
				phone: '555-1234',
				message: 'Test message',
				category: 'general'
			});
		});
	});

	describe('handleSubmission() - Error Handling', () => {
		test('catches submission errors and returns generic error message', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('Database connection failed');
			});

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toBe('An error occurred. Please try again.');
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Form submission error',
				expect.objectContaining({ error: expect.any(Error) })
			);
		});

		test('returns specific error for reCAPTCHA failures', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('reCAPTCHA verification failed');
			});

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toBe('reCAPTCHA validation failed. Please try again.');
		});

		test('calls errorHandler and passes error context', async () => {
			const mockError = new Error('Test error');
			const mockSubmissionHandler = vi.fn(async () => {
				throw mockError;
			});
			const mockErrorHandler = vi.fn(async () => null);

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler,
				errorHandler: mockErrorHandler
			});

			const formData = { name: 'John', email: 'john@example.com', message: 'Test' };
			const mockEvent = createMockRequestEvent({
				slug: 'support',
				formData
			});

			await router.handleSubmission(mockEvent);

			expect(mockErrorHandler).toHaveBeenCalledWith(
				mockError,
				expect.objectContaining({
					slug: 'support',
					data: expect.objectContaining({
						name: 'John',
						email: 'john@example.com'
					})
				})
			);
		});

		test('uses custom error result from errorHandler if returned', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('Test error');
			});
			const mockErrorHandler = vi.fn(async () => ({
				form: {
					data: { name: 'John' },
					errors: { _form: 'Custom error message' },
					isSubmitted: false
				}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler,
				errorHandler: mockErrorHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toBe('Custom error message');
		});

		test('falls back to generic error if errorHandler returns null', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('Test error');
			});
			const mockErrorHandler = vi.fn(async () => null);

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler,
				errorHandler: mockErrorHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toBe('An error occurred. Please try again.');
		});

		test('re-throws redirect exceptions', async () => {
			const router = createCategoryRouter({ categories: testCategories });

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			await expect(router.handleSubmission(mockEvent)).rejects.toMatchObject({
				status: 303
			});

			// Also verify location is defined
			try {
				await router.handleSubmission(mockEvent);
			} catch (_e: any) {
				expect(_e.location).toBeDefined();
			}
		});

		test('handles unexpected errors in outer try-catch', async () => {
			// Force an error in outer try-catch by making request.formData() fail
			const mockEvent = {
				request: {
					formData: vi.fn().mockRejectedValue(new Error('FormData parsing failed'))
				},
				url: new URL('http://localhost:3000/contact/general'),
				params: { slug: 'general', lang: 'en' },
				redirect: vi.fn(),
				locals: {}
			} as any;

			const router = createCategoryRouter({ categories: testCategories });

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toContain('An unexpected error occurred');
			expect(mockLogger.error).toHaveBeenCalledWith(
				'Unexpected form submission error',
				expect.objectContaining({ error: expect.any(Error) })
			);
		});

		test('preserves form data on error', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('Submission failed');
			});

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: {
					name: 'John Doe',
					email: 'john@example.com',
					message: 'Test message'
				}
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.data.name).toBe('John Doe');
			expect(result.form.data.email).toBe('john@example.com');
			expect(result.form.data.message).toBe('Test message');
		});
	});

	describe('createContactRouteHandlers', () => {
		test('returns load and actions object', () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			expect(handlers).toHaveProperty('load');
			expect(handlers).toHaveProperty('actions');
		});

		test('actions object has default property', () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			expect(handlers.actions).toHaveProperty('default');
			expect(typeof handlers.actions.default).toBe('function');
		});

		test('load function delegates to router.load', async () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({ slug: 'general' });
			const result = await handlers.load(mockLoadParams);

			expect(result.categorySlug).toBe('general');
			expect(result.form).toBeDefined();
		});

		test('actions.default delegates to router.handleSubmission', async () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			await expect(handlers.actions.default(mockEvent)).rejects.toMatchObject({
				status: 303
			});
		});

		test('works with all router config options', async () => {
			const mockSubmissionHandler = vi.fn();

			const handlers = createContactRouteHandlers({
				categories: testCategories,
				basePath: '/custom',
				defaultCategory: 'support',
				successPath: '/thank-you',
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			const mockLoadParams = createMockLoadParams({ slug: 'support' });
			const loadResult = await handlers.load(mockLoadParams);

			expect(loadResult.categorySlug).toBe('support');

			const mockEvent = createMockRequestEvent({
				slug: 'support',
				formData: { name: 'Jane', email: 'jane@example.com', message: 'Help' }
			});

			try {
				await handlers.actions.default(mockEvent);
			} catch (_e: any) {
				expect(_e.location).toContain('/thank-you');
			}
		});

		test('returns proper TypeScript types', () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			// Type assertions to verify proper typing
			const load: (params: any) => Promise<LoadResult> = handlers.load;
			const action: (params: RequestEvent) => Promise<SubmissionResult> = handlers.actions.default;

			expect(typeof load).toBe('function');
			expect(typeof action).toBe('function');
		});

		test('load returns all expected fields', async () => {
			const handlers = createContactRouteHandlers({ categories: testCategories });

			const mockLoadParams = createMockLoadParams({ slug: 'sales' });
			const result = await handlers.load(mockLoadParams);

			expect(result).toHaveProperty('form');
			expect(result).toHaveProperty('categorySlug');
			expect(result).toHaveProperty('category');
		});
	});

	describe('Integration Tests', () => {
		test('full flow with custom submissionHandler and locals', async () => {
			let capturedData: any = null;
			const mockSubmissionHandler = vi.fn(async (data) => {
				capturedData = data;
			});

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async (locals) => {
					expect(locals.userId).toBe('test-user');
					return mockSubmissionHandler;
				}
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'Alice', email: 'alice@example.com', message: 'Test' },
				locals: { userId: 'test-user' }
			});

			try {
				await router.handleSubmission(mockEvent);
			} catch (_e: any) {
				expect(_e.status).toBe(303);
			}

			expect(capturedData).toEqual({
				name: 'Alice',
				email: 'alice@example.com',
				message: 'Test',
				category: 'general'
			});
		});

		test('full flow with custom errorHandler', async () => {
			const mockSubmissionHandler = vi.fn(async () => {
				throw new Error('Database error');
			});
			const mockErrorHandler = vi.fn(async (error, context) => ({
				form: {
					data: context.data,
					errors: { _form: 'Custom database error message' },
					isSubmitted: false
				}
			}));

			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler,
				errorHandler: mockErrorHandler
			});

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData: { name: 'John', email: 'john@example.com', message: 'Test' }
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.errors._form).toBe('Custom database error message');
			expect(mockErrorHandler).toHaveBeenCalledWith(
				expect.any(Error),
				expect.objectContaining({ slug: 'general' })
			);
		});

		test('complete flow with multiple categories', async () => {
			const mockSubmissionHandler = vi.fn();
			const router = createCategoryRouter({
				categories: testCategories,
				createSubmissionHandler: async () => mockSubmissionHandler
			});

			// Test each category
			for (const slug of ['general', 'support', 'sales']) {
				const mockLoadParams = createMockLoadParams({ slug });
				const loadResult = await router.load(mockLoadParams);

				expect(loadResult.categorySlug).toBe(slug);
				expect(loadResult.category).toEqual(testCategories[slug]);

				const mockEvent = createMockRequestEvent({
					slug,
					formData: { name: 'Test', email: 'test@example.com', message: 'Message' }
				});

				try {
					await router.handleSubmission(mockEvent);
				} catch (_e: any) {
					expect(_e.status).toBe(303);
					expect(_e.location).toContain(`category=${slug}`);
				}
			}

			expect(mockSubmissionHandler).toHaveBeenCalledTimes(3);
		});

		test('preserves form data through error recovery', async () => {
			mockValidateCsrfToken.mockReturnValue(false);

			const router = createCategoryRouter({ categories: testCategories });

			const formData = {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '555-1234',
				message: 'Important message'
			};

			const mockEvent = createMockRequestEvent({
				slug: 'general',
				formData
			});

			const result = await router.handleSubmission(mockEvent);

			expect(result.form.data).toEqual(formData);
			expect(result.form.errors._form).toBeDefined();
			expect(result.form.isSubmitted).toBe(false);
		});
	});
});
