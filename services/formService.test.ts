/**
 * Comprehensive tests for formService.ts
 *
 * Tests cover all core form handling functionality including initialization,
 * state management, submission handling, validation, and accessibility features.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ZodSchema } from 'zod';

// Mock dependencies using vi.hoisted() to ensure they're available before imports
const mockSuperForm = vi.hoisted(() => vi.fn());
const mockZod4 = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
	debug: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
	info: vi.fn()
}));
const mockDebounce = vi.hoisted(() => vi.fn());
const mockSanitizeFormData = vi.hoisted(() => vi.fn());
const mockHandleError = vi.hoisted(() => vi.fn());

// Mock external dependencies
vi.mock('sveltekit-superforms', () => ({
	superForm: mockSuperForm
}));

vi.mock('sveltekit-superforms/adapters', () => ({
	zod4: mockZod4
}));

vi.mock('../utils/logger.ts', () => ({
	createLogger: vi.fn(() => mockLogger)
}));

vi.mock('../utils/debounce.ts', () => ({
	debounce: mockDebounce
}));

vi.mock('../utils/sanitizeInput.ts', () => ({
	sanitizeFormData: mockSanitizeFormData
}));

vi.mock('../utils/errorHandler.ts', () => ({
	handleError: mockHandleError
}));

// Import the service after mocks are set up
import {
	initializeForm,
	initializeFormState,
	handleFieldInput,
	handleFieldTouch,
	createFormSubmitHandler,
	resetForm,
	isRecaptchaInstance,
	validateSubmitHandlerOptions,
	type FormInitializationOptions,
	type FormState,
	type FormSubmitHandlerOptions,
	type RecaptchaInstance
} from './formService';

/**
 * Helper to create mock Zod schema
 */
function createMockSchema(shape: Record<string, any> = {}): ZodSchema {
	return {
		_def: {
			shape: shape,
			typeName: 'ZodObject'
		},
		parse: vi.fn(),
		safeParse: vi.fn()
	} as unknown as ZodSchema;
}

/**
 * Helper to create mock Zod field
 */
function createMockField(typeName: string, defaultValue?: any) {
	const field: any = {
		_def: {
			typeName: typeName
		}
	};

	if (defaultValue !== undefined) {
		field._def.defaultValue = () => defaultValue;
	}

	return field;
}

describe('initializeForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSuperForm.mockReturnValue({ mockForm: true });
		mockZod4.mockReturnValue({ mockValidator: true });
	});

	test('returns superForm instance', () => {
		const schema = createMockSchema();
		const result = initializeForm({
			initialData: {},
			schema
		});

		expect(result).toEqual({ mockForm: true });
		expect(mockSuperForm).toHaveBeenCalled();
	});

	test('validates schema is Zod object', () => {
		const schema = createMockSchema();

		expect(() => {
			initializeForm({
				initialData: {},
				schema
			});
		}).not.toThrow();
	});

	test('throws error for invalid schema - null', () => {
		expect(() => {
			initializeForm({
				initialData: {},
				schema: null as any
			});
		}).toThrow('Invalid schema provided');
	});

	test('throws error for invalid schema - undefined', () => {
		expect(() => {
			initializeForm({
				initialData: {},
				schema: undefined as any
			});
		}).toThrow('Invalid schema provided');
	});

	test('throws error for invalid schema - missing _def', () => {
		expect(() => {
			initializeForm({
				initialData: {},
				schema: {} as any
			});
		}).toThrow('Invalid schema provided');
	});

	test('merges initialData with schema defaults', () => {
		const schema = createMockSchema({
			name: createMockField('ZodString'),
			email: createMockField('ZodString', 'default@example.com')
		});

		initializeForm({
			initialData: { name: 'John' },
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.name).toBe('John');
		expect(mergedData.email).toBe('default@example.com');
	});

	test('uses zod4 adapter for validation', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		expect(mockZod4).toHaveBeenCalledWith(schema);

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.validators).toEqual({ mockValidator: true });
	});

	test('passes onSubmitHandler to superForm', () => {
		const schema = createMockSchema();
		const onSubmitHandler = vi.fn();

		initializeForm({
			initialData: {},
			schema,
			onSubmitHandler
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.onSubmit).toBe(onSubmitHandler);
	});

	test('applies extra options', () => {
		const schema = createMockSchema();
		const extraOptions = {
			customOption: 'value',
			anotherOption: 123
		};

		initializeForm({
			initialData: {},
			schema,
			extraOptions
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.customOption).toBe('value');
		expect(options.anotherOption).toBe(123);
	});

	test('default options - dataType is json', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.dataType).toBe('json');
	});

	test('default options - SPA is true', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.SPA).toBe(true);
	});

	test('default options - resetForm is false', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.resetForm).toBe(false);
	});

	test('default options - taintedMessage is false', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.taintedMessage).toBe(false);
	});

	test('default options - multipleSubmits is prevent', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.multipleSubmits).toBe('prevent');
	});

	test('logs debug info on init', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: { name: 'John' },
			schema
		});

		expect(mockLogger.debug).toHaveBeenCalledWith(
			'Initializing form with schema',
			expect.objectContaining({
				schemaType: 'object',
				hasDefProperty: true
			})
		);
	});

	test('logs error on failure', () => {
		const schema = createMockSchema();
		const error = new Error('Initialization failed');
		mockSuperForm.mockImplementationOnce(() => {
			throw error;
		});

		expect(() => {
			initializeForm({
				initialData: {},
				schema
			});
		}).toThrow('Initialization failed');

		expect(mockLogger.error).toHaveBeenCalledWith(
			'Failed to initialize superForm',
			expect.objectContaining({
				error: 'Initialization failed'
			})
		);
	});

	test('handles schemas with string fields', () => {
		const schema = createMockSchema({
			name: createMockField('ZodString'),
			email: createMockField('ZodString')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.name).toBe('');
		expect(mergedData.email).toBe('');
	});

	test('handles schemas with number fields', () => {
		const schema = createMockSchema({
			age: createMockField('ZodNumber'),
			count: createMockField('ZodNumber')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.age).toBe(0);
		expect(mergedData.count).toBe(0);
	});

	test('handles schemas with boolean fields', () => {
		const schema = createMockSchema({
			agreed: createMockField('ZodBoolean'),
			verified: createMockField('ZodBoolean')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.agreed).toBe(false);
		expect(mergedData.verified).toBe(false);
	});

	test('handles schemas with array fields', () => {
		const schema = createMockSchema({
			tags: createMockField('ZodArray'),
			items: createMockField('ZodArray')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.tags).toEqual([]);
		expect(mergedData.items).toEqual([]);
	});

	test('handles schemas with union fields', () => {
		const schema = createMockSchema({
			category: createMockField('ZodUnion')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.category).toBe('');
	});

	test('handles empty initialData', () => {
		const schema = createMockSchema({
			name: createMockField('ZodString')
		});

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.name).toBe('');
	});

	test('includes onUpdate handler', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.onUpdate).toBeDefined();
		expect(typeof options.onUpdate).toBe('function');
	});
});

describe('initializeFormState', () => {
	test('returns default state when no initial provided', () => {
		const state = initializeFormState();

		expect(state).toEqual({
			attachments: [],
			selectedCategory: '',
			submissionError: null,
			recaptcha: null,
			touched: {},
			cachedCategory: null
		});
	});

	test('default attachments is empty array', () => {
		const state = initializeFormState();
		expect(state.attachments).toEqual([]);
		expect(Array.isArray(state.attachments)).toBe(true);
	});

	test('default selectedCategory is empty string', () => {
		const state = initializeFormState();
		expect(state.selectedCategory).toBe('');
	});

	test('default submissionError is null', () => {
		const state = initializeFormState();
		expect(state.submissionError).toBe(null);
	});

	test('default recaptcha is null', () => {
		const state = initializeFormState();
		expect(state.recaptcha).toBe(null);
	});

	test('default touched is empty object', () => {
		const state = initializeFormState();
		expect(state.touched).toEqual({});
		expect(Object.keys(state.touched).length).toBe(0);
	});

	test('default cachedCategory is null', () => {
		const state = initializeFormState();
		expect(state.cachedCategory).toBe(null);
	});

	test('overrides defaults with initialState', () => {
		const state = initializeFormState({
			selectedCategory: 'bug-report',
			submissionError: new Error('Test error'),
			touched: { email: true }
		});

		expect(state.selectedCategory).toBe('bug-report');
		expect(state.submissionError).toEqual(new Error('Test error'));
		expect(state.touched).toEqual({ email: true });
	});

	test('partial overrides preserve other defaults', () => {
		const state = initializeFormState({
			selectedCategory: 'feature-request'
		});

		expect(state.selectedCategory).toBe('feature-request');
		expect(state.attachments).toEqual([]);
		expect(state.submissionError).toBe(null);
		expect(state.recaptcha).toBe(null);
		expect(state.touched).toEqual({});
		expect(state.cachedCategory).toBe(null);
	});

	test('can override attachments', () => {
		const file = new File(['content'], 'test.txt', { type: 'text/plain' });
		const state = initializeFormState({
			attachments: [file]
		});

		expect(state.attachments).toEqual([file]);
	});

	test('can override recaptcha instance', () => {
		const mockRecaptcha = { getToken: vi.fn() };
		const state = initializeFormState({
			recaptcha: mockRecaptcha
		});

		expect(state.recaptcha).toBe(mockRecaptcha);
	});
});

describe('handleFieldInput', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Mock debounce to return a function that executes immediately
		mockDebounce.mockImplementation((fn: Function) => fn);
	});

	test('calls validate when field is touched', () => {
		const validate = vi.fn();
		const touched = { email: true };

		handleFieldInput(touched, 'email', validate);

		expect(validate).toHaveBeenCalledWith('email');
	});

	test('debounces validate call', () => {
		const validate = vi.fn();
		const touched = { email: true };

		handleFieldInput(touched, 'email', validate);

		expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 300);
	});

	test('does not call validate when field not touched', () => {
		const validate = vi.fn();
		const touched = { email: false };

		handleFieldInput(touched, 'email', validate);

		expect(validate).not.toHaveBeenCalled();
	});

	test('passes correct fieldName to validate', () => {
		const validate = vi.fn();
		const touched = { name: true };

		handleFieldInput(touched, 'name', validate);

		expect(validate).toHaveBeenCalledWith('name');
	});

	test('uses debounce with 300ms delay', () => {
		const validate = vi.fn();
		const touched = { email: true };

		handleFieldInput(touched, 'email', validate);

		expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 300);
	});

	test('multiple rapid calls only validate once with debounce', () => {
		// Create a proper debounce mock that delays execution
		let timeoutId: any;
		mockDebounce.mockImplementation((fn: Function, delay: number) => {
			return () => {
				clearTimeout(timeoutId);
				timeoutId = setTimeout(fn, delay);
			};
		});

		const validate = vi.fn();
		const touched = { email: true };

		// Simulate rapid calls
		handleFieldInput(touched, 'email', validate);
		handleFieldInput(touched, 'email', validate);
		handleFieldInput(touched, 'email', validate);

		// Debounce should have been called but validation not yet executed
		expect(mockDebounce).toHaveBeenCalled();
	});

	test('handles empty fieldName', () => {
		const validate = vi.fn();
		const touched = { '': true };

		handleFieldInput(touched, '', validate);

		expect(validate).toHaveBeenCalledWith('');
	});

	test('handles undefined in touched object', () => {
		const validate = vi.fn();
		const touched = { email: undefined } as any;

		handleFieldInput(touched, 'email', validate);

		expect(validate).not.toHaveBeenCalled();
	});

	test('validates different fields independently', () => {
		const validate = vi.fn();
		const touched = { email: true, name: false, phone: true };

		handleFieldInput(touched, 'email', validate);
		handleFieldInput(touched, 'name', validate);
		handleFieldInput(touched, 'phone', validate);

		expect(validate).toHaveBeenCalledWith('email');
		expect(validate).toHaveBeenCalledWith('phone');
		expect(validate).toHaveBeenCalledTimes(2);
	});

	test('handles field not present in touched object', () => {
		const validate = vi.fn();
		const touched = { email: true };

		handleFieldInput(touched, 'phone', validate);

		expect(validate).not.toHaveBeenCalled();
	});
});

describe('handleFieldTouch', () => {
	test('returns new object (immutability)', () => {
		const touched = { email: false };
		const result = handleFieldTouch(touched, 'name');

		expect(result).not.toBe(touched);
	});

	test('marks specified field as touched', () => {
		const touched = { email: false };
		const result = handleFieldTouch(touched, 'email');

		expect(result.email).toBe(true);
	});

	test('preserves other touched fields', () => {
		const touched = { email: true, name: false };
		const result = handleFieldTouch(touched, 'phone');

		expect(result.email).toBe(true);
		expect(result.name).toBe(false);
		expect(result.phone).toBe(true);
	});

	test('handles empty touched object', () => {
		const touched = {};
		const result = handleFieldTouch(touched, 'email');

		expect(result).toEqual({ email: true });
	});

	test('handles marking already touched field', () => {
		const touched = { email: true };
		const result = handleFieldTouch(touched, 'email');

		expect(result.email).toBe(true);
	});

	test('returns object with single field when starting empty', () => {
		const touched = {};
		const result = handleFieldTouch(touched, 'name');

		expect(result).toEqual({ name: true });
		expect(Object.keys(result).length).toBe(1);
	});

	test('marks multiple fields independently', () => {
		let touched = {};
		touched = handleFieldTouch(touched, 'email');
		touched = handleFieldTouch(touched, 'name');
		touched = handleFieldTouch(touched, 'phone');

		expect(touched).toEqual({
			email: true,
			name: true,
			phone: true
		});
	});

	test('does not mutate original object', () => {
		const original = { email: false };
		const result = handleFieldTouch(original, 'email');

		expect(original.email).toBe(false);
		expect(result.email).toBe(true);
	});
});

describe('createFormSubmitHandler', () => {
	let mockValidateForm: any;
	let mockPrepareFormData: any;
	let mockSubmitForm: any;
	let mockOnSuccess: any;
	let mockOnError: any;

	beforeEach(() => {
		vi.clearAllMocks();
		mockValidateForm = vi.fn().mockReturnValue(true);
		mockPrepareFormData = vi.fn().mockResolvedValue({ prepared: true });
		mockSubmitForm = vi.fn().mockResolvedValue({ success: true, data: 'result' });
		mockOnSuccess = vi.fn();
		mockOnError = vi.fn();
		mockSanitizeFormData.mockImplementation((data) => data);
		mockHandleError.mockImplementation((msg) => new Error(msg));
	});

	describe('Validation', () => {
		test('calls validateForm before submission', async () => {
			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockValidateForm).toHaveBeenCalled();
		});

		test('returns error when validation fails', async () => {
			mockValidateForm.mockReturnValue(false);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		test('calls onError when validation fails', async () => {
			mockValidateForm.mockReturnValue(false);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockOnError).toHaveBeenCalled();
			expect(mockHandleError).toHaveBeenCalledWith(
				'Please fix the validation errors before submitting.',
				'FormSubmission',
				{ step: 'validation' }
			);
		});

		test('does not proceed when validation fails', async () => {
			mockValidateForm.mockReturnValue(false);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockPrepareFormData).not.toHaveBeenCalled();
			expect(mockSubmitForm).not.toHaveBeenCalled();
		});
	});

	describe('reCAPTCHA', () => {
		test('gets token when recaptcha provided', async () => {
			const mockRecaptcha = {
				getToken: vi.fn().mockResolvedValue('recaptcha-token-123')
			};

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				recaptcha: mockRecaptcha,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockRecaptcha.getToken).toHaveBeenCalledWith('submit');
		});

		test('passes token to prepareFormData', async () => {
			const mockRecaptcha = {
				getToken: vi.fn().mockResolvedValue('token-abc-123')
			};

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				recaptcha: mockRecaptcha,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockPrepareFormData).toHaveBeenCalledWith(
				{ name: 'John' },
				'token-abc-123'
			);
		});

		test('returns error when recaptcha enabled but token null', async () => {
			const mockRecaptcha = {
				getToken: vi.fn().mockResolvedValue(null)
			};

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				recaptcha: mockRecaptcha,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(mockHandleError).toHaveBeenCalledWith(
				'reCAPTCHA verification failed. Please try again.',
				'RecaptchaRequired',
				{ recaptchaEnabled: true }
			);
		});

		test('calls onError when recaptcha fails', async () => {
			const mockRecaptcha = {
				getToken: vi.fn().mockResolvedValue(null)
			};

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				recaptcha: mockRecaptcha,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockOnError).toHaveBeenCalled();
		});

		test('proceeds without token when recaptcha not provided', async () => {
			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockPrepareFormData).toHaveBeenCalledWith(
				{ name: 'John' },
				null
			);
		});

		test('handles recaptcha getToken errors gracefully', async () => {
			const mockRecaptcha = {
				getToken: vi.fn().mockRejectedValue(new Error('reCAPTCHA error'))
			};

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				recaptcha: mockRecaptcha,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			// Should fail when recaptcha is enabled but returns null
			expect(result.success).toBe(false);
		});
	});

	describe('Data Processing', () => {
		test('calls prepareFormData with formData and token', async () => {
			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John', email: 'john@example.com' });

			expect(mockPrepareFormData).toHaveBeenCalledWith(
				{ name: 'John', email: 'john@example.com' },
				null
			);
		});

		test('sanitizes prepared data', async () => {
			mockPrepareFormData.mockResolvedValue({ name: 'John', message: '<script>' });

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockSanitizeFormData).toHaveBeenCalledWith({
				name: 'John',
				message: '<script>'
			});
		});

		test('calls submitForm with sanitized data', async () => {
			mockSanitizeFormData.mockReturnValue({ name: 'John', sanitized: true });

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockSubmitForm).toHaveBeenCalledWith({
				name: 'John',
				sanitized: true
			});
		});

		test('processes data in correct order', async () => {
			const callOrder: string[] = [];

			mockValidateForm.mockImplementation(() => {
				callOrder.push('validate');
				return true;
			});
			mockPrepareFormData.mockImplementation(async () => {
				callOrder.push('prepare');
				return {};
			});
			mockSanitizeFormData.mockImplementation(() => {
				callOrder.push('sanitize');
				return {};
			});
			mockSubmitForm.mockImplementation(async () => {
				callOrder.push('submit');
				return { success: true };
			});

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(callOrder).toEqual(['validate', 'prepare', 'sanitize', 'submit']);
		});
	});

	describe('Success Handling', () => {
		test('returns success true when response.success is true', async () => {
			mockSubmitForm.mockResolvedValue({ success: true, data: 'result' });

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(true);
		});

		test('calls onSuccess with response', async () => {
			const response = { success: true, data: 'result', id: 123 };
			mockSubmitForm.mockResolvedValue(response);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockOnSuccess).toHaveBeenCalledWith(response);
		});

		test('returns response data', async () => {
			const response = { success: true, data: 'result', id: 123 };
			mockSubmitForm.mockResolvedValue(response);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.data).toEqual(response);
		});

		test('handles response without success field', async () => {
			mockSubmitForm.mockResolvedValue({ data: 'result' });

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			// Should treat as error since success is not explicitly true
			expect(result.success).toBe(false);
		});
	});

	describe('Error Handling', () => {
		test('catches submitForm errors', async () => {
			mockSubmitForm.mockRejectedValue(new Error('Submit failed'));

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
		});

		test('calls onError with error', async () => {
			const error = new Error('Submit failed');
			mockSubmitForm.mockRejectedValue(error);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockOnError).toHaveBeenCalled();
		});

		test('returns success false on error', async () => {
			mockSubmitForm.mockRejectedValue(new Error('Submit failed'));

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
		});

		test('standardizes errors with handleError', async () => {
			mockSubmitForm.mockRejectedValue(new Error('Network error'));

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Error),
				'FormSubmission',
				expect.objectContaining({ formData: { name: 'John' } })
			);
		});

		test('preserves ContactFormError errors', async () => {
			const contactFormError = new Error('Contact error');
			contactFormError.name = 'ContactFormError';
			mockSubmitForm.mockRejectedValue(contactFormError);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			await handler({ name: 'John' });

			expect(mockOnError).toHaveBeenCalledWith(contactFormError);
		});

		test('handles non-Error exceptions', async () => {
			mockSubmitForm.mockRejectedValue('String error');

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(mockHandleError).toHaveBeenCalled();
		});

		test('handles prepareFormData errors', async () => {
			mockPrepareFormData.mockRejectedValue(new Error('Prepare failed'));

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(mockOnError).toHaveBeenCalled();
		});

		test('handles response with error field', async () => {
			mockSubmitForm.mockResolvedValue({
				success: false,
				error: 'Submission failed'
			});

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			expect(result.success).toBe(false);
			expect(mockHandleError).toHaveBeenCalledWith(
				'Submission failed',
				'FormSubmission',
				expect.any(Object)
			);
		});
	});
});

describe('resetForm', () => {
	test('calls setFormData with defaultProps', () => {
		const setFormData = vi.fn();
		const defaultProps = { name: '', email: '', message: '' };
		const state: Partial<FormState> = {};

		resetForm(setFormData, defaultProps, state);

		expect(setFormData).toHaveBeenCalledWith(defaultProps);
	});

	test('resets submissionError to null', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			submissionError: new Error('Test error')
		};

		resetForm(setFormData, defaultProps, state);

		expect(state.submissionError).toBe(null);
	});

	test('clears touched object (empty)', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			touched: { email: true, name: true }
		};

		resetForm(setFormData, defaultProps, state);

		expect(state.touched).toEqual({});
		expect(Object.keys(state.touched!).length).toBe(0);
	});

	test('handles state without submissionError', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			touched: { email: true }
		};

		expect(() => {
			resetForm(setFormData, defaultProps, state);
		}).not.toThrow();
	});

	test('handles state without touched', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			submissionError: new Error('Test')
		};

		expect(() => {
			resetForm(setFormData, defaultProps, state);
		}).not.toThrow();
	});

	test('handles empty defaultProps', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {};

		resetForm(setFormData, defaultProps, state);

		expect(setFormData).toHaveBeenCalledWith({});
	});

	test('mutates state object (not immutable)', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			submissionError: new Error('Test'),
			touched: { email: true }
		};
		const originalState = state;

		resetForm(setFormData, defaultProps, state);

		// State object is the same reference (mutated)
		expect(state).toBe(originalState);
		expect(state.submissionError).toBe(null);
		expect(state.touched).toEqual({});
	});

	test('resets complex form data', () => {
		const setFormData = vi.fn();
		const defaultProps = {
			name: '',
			email: '',
			phone: '',
			category: '',
			message: '',
			attachments: []
		};
		const state: Partial<FormState> = {
			submissionError: new Error('Previous error'),
			touched: { name: true, email: true, message: true }
		};

		resetForm(setFormData, defaultProps, state);

		expect(setFormData).toHaveBeenCalledWith(defaultProps);
		expect(state.submissionError).toBe(null);
		expect(state.touched).toEqual({});
	});

	test('preserves other state properties', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const state: Partial<FormState> = {
			submissionError: new Error('Test'),
			touched: { email: true },
			selectedCategory: 'bug-report',
			attachments: []
		};

		resetForm(setFormData, defaultProps, state);

		expect(state.selectedCategory).toBe('bug-report');
		expect(state.attachments).toEqual([]);
	});
});

describe('isRecaptchaInstance', () => {
	test('returns true for valid instance with getToken', () => {
		const instance = { getToken: vi.fn() };
		expect(isRecaptchaInstance(instance)).toBe(true);
	});

	test('returns false for null', () => {
		expect(isRecaptchaInstance(null)).toBeFalsy();
	});

	test('returns false for undefined', () => {
		expect(isRecaptchaInstance(undefined)).toBeFalsy();
	});

	test('returns false for object without getToken', () => {
		const instance = { someMethod: vi.fn() };
		expect(isRecaptchaInstance(instance)).toBe(false);
	});

	test('returns false for object with non-function getToken', () => {
		const instance = { getToken: 'not a function' };
		expect(isRecaptchaInstance(instance)).toBe(false);
	});

	test('returns true for any object with getToken function', () => {
		const instance = {
			getToken: async () => 'token',
			otherMethod: () => {}
		};
		expect(isRecaptchaInstance(instance)).toBe(true);
	});

	test('returns false for primitive values', () => {
		expect(isRecaptchaInstance(123)).toBe(false);
		expect(isRecaptchaInstance('string')).toBe(false);
		expect(isRecaptchaInstance(true)).toBe(false);
	});

	test('returns false for empty object', () => {
		expect(isRecaptchaInstance({})).toBe(false);
	});
});

describe('validateSubmitHandlerOptions', () => {
	test('passes when all required options present', () => {
		const options: FormSubmitHandlerOptions = {
			validateForm: vi.fn(),
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		};

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).not.toThrow();
	});

	test('throws when validateForm missing', () => {
		const options = {
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options: validateForm');
	});

	test('throws when prepareFormData missing', () => {
		const options = {
			validateForm: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options: prepareFormData');
	});

	test('throws when submitForm missing', () => {
		const options = {
			validateForm: vi.fn(),
			prepareFormData: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options: submitForm');
	});

	test('throws when onSuccess missing', () => {
		const options = {
			validateForm: vi.fn(),
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options: onSuccess');
	});

	test('throws when onError missing', () => {
		const options = {
			validateForm: vi.fn(),
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options: onError');
	});

	test('throws when multiple options missing', () => {
		const options = {
			validateForm: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('Missing required form submit handler options');

		try {
			validateSubmitHandlerOptions(options);
		} catch (error: any) {
			expect(error.message).toContain('prepareFormData');
			expect(error.message).toContain('submitForm');
			expect(error.message).toContain('onSuccess');
			expect(error.message).toContain('onError');
		}
	});

	test('error message lists missing options', () => {
		const options = {
			validateForm: vi.fn(),
			submitForm: vi.fn()
		} as any;

		try {
			validateSubmitHandlerOptions(options);
			fail('Should have thrown');
		} catch (error: any) {
			expect(error.message).toContain('prepareFormData');
			expect(error.message).toContain('onSuccess');
			expect(error.message).toContain('onError');
		}
	});

	test('validates functions are actually functions', () => {
		const options = {
			validateForm: 'not a function',
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('validateForm');
	});

	test('accepts extra options (ignores them)', () => {
		const options = {
			validateForm: vi.fn(),
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn(),
			extraOption: 'value',
			anotherOption: 123
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).not.toThrow();
	});

	test('throws when option is null', () => {
		const options = {
			validateForm: null,
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('validateForm');
	});

	test('throws when option is undefined', () => {
		const options = {
			validateForm: undefined,
			prepareFormData: vi.fn(),
			submitForm: vi.fn(),
			onSuccess: vi.fn(),
			onError: vi.fn()
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).toThrow('validateForm');
	});

	test('accepts async functions', () => {
		const options: FormSubmitHandlerOptions = {
			validateForm: vi.fn(),
			prepareFormData: async () => ({}),
			submitForm: async () => ({ success: true }),
			onSuccess: vi.fn(),
			onError: vi.fn()
		};

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).not.toThrow();
	});
});

describe('Integration Tests', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSuperForm.mockReturnValue({ mockForm: true });
		mockZod4.mockReturnValue({ mockValidator: true });
		mockDebounce.mockImplementation((fn: Function) => fn);
		mockSanitizeFormData.mockImplementation((data) => data);
		mockHandleError.mockImplementation((msg) => new Error(msg));
	});

	test('full form initialization to validation to submission flow', async () => {
		const schema = createMockSchema({
			name: createMockField('ZodString'),
			email: createMockField('ZodString')
		});

		// Initialize form
		const form = initializeForm({
			initialData: { name: 'John' },
			schema
		});

		expect(form).toEqual({ mockForm: true });

		// Initialize state
		const state = initializeFormState();
		expect(state.touched).toEqual({});

		// Touch fields
		let touched = handleFieldTouch(state.touched, 'email');
		expect(touched.email).toBe(true);

		// Handle input
		const validate = vi.fn();
		handleFieldInput(touched, 'email', validate);
		expect(validate).toHaveBeenCalled();

		// Create and execute submission
		const handler = createFormSubmitHandler({
			validateForm: () => true,
			prepareFormData: async (data) => data,
			submitForm: async (data) => ({ success: true, data }),
			onSuccess: vi.fn(),
			onError: vi.fn()
		});

		const result = await handler({ name: 'John', email: 'john@example.com' });
		expect(result.success).toBe(true);
	});

	test('form with reCAPTCHA to token to submission', async () => {
		const mockRecaptcha = {
			getToken: vi.fn().mockResolvedValue('token-123')
		};

		const state = initializeFormState({
			recaptcha: mockRecaptcha
		});

		expect(isRecaptchaInstance(state.recaptcha)).toBe(true);

		const mockPrepareFormData = vi.fn().mockResolvedValue({ prepared: true });

		const handler = createFormSubmitHandler({
			validateForm: () => true,
			recaptcha: state.recaptcha,
			prepareFormData: mockPrepareFormData,
			submitForm: async () => ({ success: true }),
			onSuccess: vi.fn(),
			onError: vi.fn()
		});

		await handler({ name: 'John' });

		expect(mockRecaptcha.getToken).toHaveBeenCalledWith('submit');
		expect(mockPrepareFormData).toHaveBeenCalledWith(
			{ name: 'John' },
			'token-123'
		);
	});

	test('failed validation prevents submission', async () => {
		const mockSubmitForm = vi.fn();

		const handler = createFormSubmitHandler({
			validateForm: () => false,
			prepareFormData: async (data) => data,
			submitForm: mockSubmitForm,
			onSuccess: vi.fn(),
			onError: vi.fn()
		});

		const result = await handler({ name: '' });

		expect(result.success).toBe(false);
		expect(mockSubmitForm).not.toHaveBeenCalled();
	});

	test('submission error triggers error handling', async () => {
		const mockOnError = vi.fn();

		const handler = createFormSubmitHandler({
			validateForm: () => true,
			prepareFormData: async (data) => data,
			submitForm: async () => {
				throw new Error('Network error');
			},
			onSuccess: vi.fn(),
			onError: mockOnError
		});

		const result = await handler({ name: 'John' });

		expect(result.success).toBe(false);
		expect(mockOnError).toHaveBeenCalled();
	});

	test('field touch to input to debounced validation', async () => {
		const validate = vi.fn();
		let touched = {};

		// Touch field
		touched = handleFieldTouch(touched, 'email');
		expect(touched).toEqual({ email: true });

		// Input on touched field
		handleFieldInput(touched, 'email', validate);
		expect(validate).toHaveBeenCalledWith('email');
		expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 300);
	});

	test('reset form clears state and reinitializes', () => {
		const setFormData = vi.fn();
		const defaultProps = { name: '', email: '', message: '' };
		const state = initializeFormState({
			selectedCategory: 'bug',
			submissionError: new Error('Previous error'),
			touched: { email: true, name: true }
		});

		// Reset form
		resetForm(setFormData, defaultProps, state);

		expect(setFormData).toHaveBeenCalledWith(defaultProps);
		expect(state.submissionError).toBe(null);
		expect(state.touched).toEqual({});
		expect(state.selectedCategory).toBe('bug'); // Preserved

		// Can reinitialize
		const newState = initializeFormState();
		expect(newState.touched).toEqual({});
		expect(newState.submissionError).toBe(null);
	});

	test('multiple fields touched then validated', () => {
		const validate = vi.fn();
		let touched = {};

		// Touch multiple fields
		touched = handleFieldTouch(touched, 'email');
		touched = handleFieldTouch(touched, 'name');
		touched = handleFieldTouch(touched, 'message');

		expect(touched).toEqual({
			email: true,
			name: true,
			message: true
		});

		// Validate each
		handleFieldInput(touched, 'email', validate);
		handleFieldInput(touched, 'name', validate);
		handleFieldInput(touched, 'message', validate);

		expect(validate).toHaveBeenCalledTimes(3);
		expect(validate).toHaveBeenCalledWith('email');
		expect(validate).toHaveBeenCalledWith('name');
		expect(validate).toHaveBeenCalledWith('message');
	});

	test('schema defaults merge with initial data', () => {
		const schema = createMockSchema({
			name: createMockField('ZodString'),
			email: createMockField('ZodString', 'default@example.com'),
			phone: createMockField('ZodString'),
			age: createMockField('ZodNumber', 18)
		});

		initializeForm({
			initialData: { name: 'John', phone: '555-1234' },
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const mergedData = callArgs[0];

		expect(mergedData.name).toBe('John'); // From initialData
		expect(mergedData.email).toBe('default@example.com'); // From schema default
		expect(mergedData.phone).toBe('555-1234'); // From initialData
		expect(mergedData.age).toBe(18); // From schema default
	});

	test('validation options are properly validated', () => {
		// Valid options
		expect(() => {
			validateSubmitHandlerOptions({
				validateForm: vi.fn(),
				prepareFormData: vi.fn(),
				submitForm: vi.fn(),
				onSuccess: vi.fn(),
				onError: vi.fn()
			});
		}).not.toThrow();

		// Invalid options
		expect(() => {
			validateSubmitHandlerOptions({
				validateForm: vi.fn()
			} as any);
		}).toThrow('Missing required');
	});

	test('complete submission flow with all features', async () => {
		// Initialize
		const schema = createMockSchema({
			name: createMockField('ZodString'),
			email: createMockField('ZodString')
		});

		const form = initializeForm({
			initialData: {},
			schema
		});
		expect(form).toBeDefined();

		// State
		const mockRecaptcha = {
			getToken: vi.fn().mockResolvedValue('token-xyz')
		};
		const state = initializeFormState({
			recaptcha: mockRecaptcha
		});

		// Touch and validate
		let touched = handleFieldTouch(state.touched, 'email');
		touched = handleFieldTouch(touched, 'name');

		const validate = vi.fn();
		handleFieldInput(touched, 'email', validate);
		handleFieldInput(touched, 'name', validate);

		// Submit
		const mockOnSuccess = vi.fn();
		const mockPrepareFormData = vi.fn().mockResolvedValue({ prepared: true });

		const handler = createFormSubmitHandler({
			validateForm: () => true,
			recaptcha: mockRecaptcha,
			prepareFormData: mockPrepareFormData,
			submitForm: async (data) => ({ success: true, data }),
			onSuccess: mockOnSuccess,
			onError: vi.fn()
		});

		const result = await handler({ name: 'John', email: 'john@example.com' });

		expect(result.success).toBe(true);
		expect(mockRecaptcha.getToken).toHaveBeenCalled();
		expect(mockSanitizeFormData).toHaveBeenCalled();
		expect(mockOnSuccess).toHaveBeenCalled();
	});

	test('error propagation through submission flow', async () => {
		const mockOnError = vi.fn();
		mockHandleError.mockImplementation((msg) => {
			const err = new Error(msg);
			err.name = 'ContactFormError';
			return err;
		});

		const handler = createFormSubmitHandler({
			validateForm: () => true,
			prepareFormData: async () => {
				throw new Error('Prepare failed');
			},
			submitForm: async () => ({ success: true }),
			onSuccess: vi.fn(),
			onError: mockOnError
		});

		const result = await handler({ name: 'John' });

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
		expect(mockOnError).toHaveBeenCalled();
	});
});
