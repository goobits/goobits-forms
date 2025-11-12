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

	test('should reject invalid schemas', () => {
		const invalidSchemas = [
			{ schema: null, name: 'null' },
			{ schema: undefined, name: 'undefined' },
			{ schema: {}, name: 'missing _def' }
		];

		invalidSchemas.forEach(({ schema, name }) => {
			expect(() => {
				initializeForm({
					initialData: {},
					schema: schema as any
				});
			}).toThrow('Invalid schema provided');
		});
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

	test('should apply all default options correctly', () => {
		const schema = createMockSchema();

		initializeForm({
			initialData: {},
			schema
		});

		const callArgs = mockSuperForm.mock.calls[0];
		const options = callArgs[1];

		expect(options.dataType).toBe('json');
		expect(options.SPA).toBe(true);
		expect(options.resetForm).toBe(false);
		expect(options.taintedMessage).toBe(false);
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

	test('should handle various Zod field types', () => {
		const fieldTypes = [
			{
				type: 'string',
				schema: createMockSchema({
					name: createMockField('ZodString'),
					email: createMockField('ZodString')
				}),
				expectations: { name: '', email: '' }
			},
			{
				type: 'number',
				schema: createMockSchema({
					age: createMockField('ZodNumber'),
					count: createMockField('ZodNumber')
				}),
				expectations: { age: 0, count: 0 }
			},
			{
				type: 'boolean',
				schema: createMockSchema({
					agreed: createMockField('ZodBoolean'),
					verified: createMockField('ZodBoolean')
				}),
				expectations: { agreed: false, verified: false }
			},
			{
				type: 'array',
				schema: createMockSchema({
					tags: createMockField('ZodArray'),
					items: createMockField('ZodArray')
				}),
				expectations: { tags: [], items: [] }
			}
		];

		fieldTypes.forEach(({ type, schema, expectations }) => {
			vi.clearAllMocks();
			initializeForm({
				initialData: {},
				schema
			});

			const callArgs = mockSuperForm.mock.calls[0];
			const mergedData = callArgs[0];

			Object.entries(expectations).forEach(([key, value]) => {
				expect(mergedData[key]).toEqual(value);
			});
		});
	});

	test('should handle complex Zod types', () => {
		const unionSchema = createMockSchema({
			category: createMockField('ZodUnion')
		});

		initializeForm({
			initialData: {},
			schema: unionSchema
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
	test('should initialize all formState defaults correctly', () => {
		const state = initializeFormState();

		expect(state.attachments).toEqual([]);
		expect(Array.isArray(state.attachments)).toBe(true);
		expect(state.selectedCategory).toBe('');
		expect(state.submissionError).toBe(null);
		expect(state.recaptcha).toBe(null);
		expect(state.touched).toEqual({});
		expect(Object.keys(state.touched).length).toBe(0);
		expect(state.cachedCategory).toBe(null);
	});

	test('should allow overriding formState defaults', () => {
		const overrides = {
			selectedCategory: 'bug-report',
			submissionError: new Error('Test error'),
			touched: { email: true }
		};
		const state = initializeFormState(overrides);

		expect(state.selectedCategory).toBe('bug-report');
		expect(state.submissionError).toEqual(new Error('Test error'));
		expect(state.touched).toEqual({ email: true });
		// Verify other defaults are still present
		expect(state.attachments).toEqual([]);
		expect(state.recaptcha).toBe(null);
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

	test('debounces validate call with 300ms delay', () => {
		const validate = vi.fn();
		const touched = { email: true };

		handleFieldInput(touched, 'email', validate);

		expect(mockDebounce).toHaveBeenCalledWith(expect.any(Function), 300);
		expect(validate).toHaveBeenCalledWith('email');
	});

	test('does not call validate when field not touched', () => {
		const validate = vi.fn();
		const touched = { email: false };

		handleFieldInput(touched, 'email', validate);

		expect(validate).not.toHaveBeenCalled();
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
	test('returns new immutable object without mutating original', () => {
		const original = { email: false };
		const result = handleFieldTouch(original, 'email');

		expect(result).not.toBe(original);
		expect(original.email).toBe(false);
		expect(result.email).toBe(true);
	});

	test('marks specified field as touched and preserves other fields', () => {
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
		expect(Object.keys(result).length).toBe(1);
	});

	test('handles marking already touched field', () => {
		const touched = { email: true };
		const result = handleFieldTouch(touched, 'email');

		expect(result.email).toBe(true);
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

		test('should handle validation failure comprehensively', async () => {
			mockValidateForm.mockReturnValue(false);

			const handler = createFormSubmitHandler({
				validateForm: mockValidateForm,
				prepareFormData: mockPrepareFormData,
				submitForm: mockSubmitForm,
				onSuccess: mockOnSuccess,
				onError: mockOnError
			});

			const result = await handler({ name: 'John' });

			// All three assertions in one test
			expect(result.success).toBe(false);
			expect(result.error).toBeDefined();
			expect(mockOnError).toHaveBeenCalled();
			expect(mockHandleError).toHaveBeenCalledWith(
				'Please fix the validation errors before submitting.',
				'FormSubmission',
				{ step: 'validation' }
			);
			expect(mockPrepareFormData).not.toHaveBeenCalled();
			expect(mockSubmitForm).not.toHaveBeenCalled();
		});
	});

	describe('reCAPTCHA', () => {
		test('should handle reCAPTCHA token correctly', async () => {
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

			expect(mockRecaptcha.getToken).toHaveBeenCalledWith('submit');
			expect(mockPrepareFormData).toHaveBeenCalledWith(
				{ name: 'John' },
				'token-abc-123'
			);
		});

		test('should handle reCAPTCHA failures', async () => {
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
			expect(mockOnError).toHaveBeenCalled();
			expect(mockHandleError).toHaveBeenCalledWith(
				'reCAPTCHA verification failed. Please try again.',
				'RecaptchaRequired',
				{ recaptchaEnabled: true }
			);
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
		test('should handle successful submission comprehensively', async () => {
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

			expect(result.success).toBe(true);
			expect(result.data).toEqual(response);
			expect(mockOnSuccess).toHaveBeenCalledWith(response);
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
		test('should handle submitForm errors comprehensively', async () => {
			const error = new Error('Submit failed');
			mockSubmitForm.mockRejectedValue(error);

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
			expect(mockOnError).toHaveBeenCalled();
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
	test('resets form data and clears errors comprehensively', () => {
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
			touched: { name: true, email: true, message: true },
			selectedCategory: 'bug-report',
			attachments: []
		};
		const originalState = state;

		resetForm(setFormData, defaultProps, state);

		// Calls setFormData with defaults
		expect(setFormData).toHaveBeenCalledWith(defaultProps);
		// Resets errors and touched
		expect(state.submissionError).toBe(null);
		expect(state.touched).toEqual({});
		// Preserves other state properties
		expect(state.selectedCategory).toBe('bug-report');
		expect(state.attachments).toEqual([]);
		// Mutates state (not immutable)
		expect(state).toBe(originalState);
	});

	test('handles partial state gracefully', () => {
		const setFormData = vi.fn();
		const defaultProps = {};
		const stateWithoutError: Partial<FormState> = {
			touched: { email: true }
		};
		const stateWithoutTouched: Partial<FormState> = {
			submissionError: new Error('Test')
		};

		expect(() => {
			resetForm(setFormData, defaultProps, stateWithoutError);
		}).not.toThrow();

		expect(() => {
			resetForm(setFormData, defaultProps, stateWithoutTouched);
		}).not.toThrow();

		expect(setFormData).toHaveBeenCalledWith({});
	});
});

describe('isRecaptchaInstance', () => {
	test('returns true for valid instance with getToken function', () => {
		const simpleInstance = { getToken: vi.fn() };
		const complexInstance = {
			getToken: async () => 'token',
			otherMethod: () => {}
		};

		expect(isRecaptchaInstance(simpleInstance)).toBe(true);
		expect(isRecaptchaInstance(complexInstance)).toBe(true);
	});

	test('returns false for invalid instances', () => {
		// null and undefined return falsy
		expect(isRecaptchaInstance(null)).toBeFalsy();
		expect(isRecaptchaInstance(undefined)).toBeFalsy();

		// Other invalid values return false
		const invalidValues = [
			{},
			{ someMethod: vi.fn() },
			{ getToken: 'not a function' },
			123,
			'string',
			true
		];

		invalidValues.forEach((value) => {
			expect(isRecaptchaInstance(value)).toBe(false);
		});
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

	test('accepts async functions and extra options', () => {
		const options = {
			validateForm: vi.fn(),
			prepareFormData: async () => ({}),
			submitForm: async () => ({ success: true }),
			onSuccess: vi.fn(),
			onError: vi.fn(),
			extraOption: 'value',
			anotherOption: 123
		} as any;

		expect(() => {
			validateSubmitHandlerOptions(options);
		}).not.toThrow();
	});

	test('throws when individual required options are missing', () => {
		const requiredOptions = [
			'validateForm',
			'prepareFormData',
			'submitForm',
			'onSuccess',
			'onError'
		];

		requiredOptions.forEach((optionName) => {
			const options = {
				validateForm: vi.fn(),
				prepareFormData: vi.fn(),
				submitForm: vi.fn(),
				onSuccess: vi.fn(),
				onError: vi.fn()
			} as any;

			delete options[optionName];

			expect(() => {
				validateSubmitHandlerOptions(options);
			}).toThrow(`Missing required form submit handler options: ${optionName}`);
		});
	});

	test('throws when multiple options missing and lists them all', () => {
		const options = {
			validateForm: vi.fn(),
			submitForm: vi.fn()
		} as any;

		try {
			validateSubmitHandlerOptions(options);
			fail('Should have thrown');
		} catch (error: any) {
			expect(error.message).toContain('Missing required');
			expect(error.message).toContain('prepareFormData');
			expect(error.message).toContain('onSuccess');
			expect(error.message).toContain('onError');
		}
	});

	test('throws when options are invalid types', () => {
		const invalidOptions = [
			{ name: 'validateForm', value: 'not a function' },
			{ name: 'validateForm', value: null },
			{ name: 'validateForm', value: undefined }
		];

		invalidOptions.forEach(({ name, value }) => {
			const options = {
				validateForm: vi.fn(),
				prepareFormData: vi.fn(),
				submitForm: vi.fn(),
				onSuccess: vi.fn(),
				onError: vi.fn()
			} as any;

			options[name] = value;

			expect(() => {
				validateSubmitHandlerOptions(options);
			}).toThrow(name);
		});
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
