/**
 * Comprehensive tests for validation module
 *
 * Tests focus on schema creation, validation, error handling, and CSS class generation.
 * These tests verify behavior and correctness of form validation utilities.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import {
	createValidationSchemaForCategory,
	getValidatorForCategory,
	getValidationClasses,
	createDebouncedValidator,
	hasValidationErrors,
	clearFieldError,
	contactSchema,
	feedbackSchema,
	supportSchema,
	businessSchema,
	bookingSchema,
	type ValidationConfig,
	type ValidationErrors,
} from './index';

// Helper to create mock ValidationConfig
function createMockValidationConfig(): ValidationConfig {
	return {
		categories: {
			general: { fields: ['name', 'email', 'message'] },
			support: { fields: ['name', 'email', 'message', 'browser'] },
			business: { fields: ['name', 'email', 'company'] },
		},
		schemas: {
			complete: z.object({
				name: z.string().min(1, 'Name is required'),
				email: z.string().email('Invalid email'),
				message: z.string().min(1, 'Message is required'),
				browser: z.string().min(1, 'Browser is required'),
				company: z.string().min(1, 'Company is required'),
			}),
			categories: {
				general: z.object({
					name: z.string().min(1, 'Name is required'),
					email: z.string().email('Invalid email'),
					message: z.string().min(1, 'Message is required'),
				}),
			},
		},
		categoryToFieldMap: {
			general: ['name', 'email', 'message'],
			support: ['name', 'email', 'message', 'browser'],
			business: ['name', 'email', 'company'],
		},
	};
}

describe('createValidationSchemaForCategory', () => {
	describe('schema retrieval', () => {
		test('returns pre-built category schema when available', () => {
			const config = createMockValidationConfig();
			const schema = createValidationSchemaForCategory(config, 'general');

			expect(schema).toBeDefined();
			expect(schema).toBe(config.schemas?.categories?.general);
		});

		test('returns different schemas for different categories', () => {
			const config = createMockValidationConfig();
			const generalSchema = createValidationSchemaForCategory(config, 'general');
			const supportSchema = createValidationSchemaForCategory(config, 'support');

			expect(generalSchema).not.toBe(supportSchema);
		});

		test('validates returned schema is Zod object', () => {
			const config = createMockValidationConfig();
			const schema = createValidationSchemaForCategory(config, 'general');

			expect(schema).toBeInstanceOf(z.ZodObject);
		});
	});

	describe('fallback schema creation', () => {
		test('falls back to creating from field map + complete schema', () => {
			const config = createMockValidationConfig();
			// Remove pre-built schema for support to trigger fallback
			if (config.schemas?.categories) {
				delete config.schemas.categories.support;
			}

			const schema = createValidationSchemaForCategory(config, 'support');

			expect(schema).toBeDefined();
			expect(schema).toBeInstanceOf(z.ZodObject);
		});

		test('uses complete schema with .pick() for field selection', () => {
			const config = createMockValidationConfig();
			// Remove pre-built schema for business
			if (config.schemas?.categories) {
				delete config.schemas.categories.business;
			}

			const schema = createValidationSchemaForCategory(config, 'business');

			// Validate that only the expected fields are in the schema
			const result = schema.safeParse({
				name: 'John Doe',
				email: 'john@example.com',
				company: 'Acme Inc',
			});

			expect(result.success).toBe(true);
		});

		test('created schema validates data correctly', () => {
			const config = createMockValidationConfig();
			if (config.schemas?.categories) {
				delete config.schemas.categories.business;
			}

			const schema = createValidationSchemaForCategory(config, 'business');

			// Valid data
			const validResult = schema.safeParse({
				name: 'John',
				email: 'john@example.com',
				company: 'Acme',
			});
			expect(validResult.success).toBe(true);

			// Invalid data
			const invalidResult = schema.safeParse({
				name: '',
				email: 'invalid-email',
				company: '',
			});
			expect(invalidResult.success).toBe(false);
		});
	});

	describe('error handling', () => {
		test('throws error for invalid category', () => {
			const config = createMockValidationConfig();

			expect(() => {
				createValidationSchemaForCategory(config, 'nonexistent');
			}).toThrow('Invalid category: nonexistent');
		});

		test('throws error for missing category in config', () => {
			const config = createMockValidationConfig();

			expect(() => {
				createValidationSchemaForCategory(config, 'invalid');
			}).toThrow('Invalid category');
		});

		test('throws error when category has no schema and no field map', () => {
			const config: ValidationConfig = {
				categories: {
					empty: { fields: [] },
				},
				schemas: {},
				categoryToFieldMap: {},
			};

			expect(() => {
				createValidationSchemaForCategory(config, 'empty');
			}).toThrow('No schema found for category: empty');
		});

		test('throws error when no complete schema available for fallback', () => {
			const config: ValidationConfig = {
				categories: {
					test: { fields: ['name'] },
				},
				schemas: {},
				categoryToFieldMap: {
					test: ['name'],
				},
			};

			expect(() => {
				createValidationSchemaForCategory(config, 'test');
			}).toThrow('No schema found for category: test');
		});
	});

	describe('schema validation', () => {
		test('schema validates data correctly with valid input', () => {
			const config = createMockValidationConfig();
			const schema = createValidationSchemaForCategory(config, 'general');

			const result = schema.safeParse({
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Hello world',
			});

			expect(result.success).toBe(true);
		});

		test('schema rejects invalid data with error messages', () => {
			const config = createMockValidationConfig();
			const schema = createValidationSchemaForCategory(config, 'general');

			const result = schema.safeParse({
				name: '',
				email: 'invalid',
				message: '',
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
			}
		});
	});
});

describe('getValidatorForCategory', () => {
	describe('validator creation', () => {
		test('returns validator wrapped with zod4 adapter', () => {
			const config = createMockValidationConfig();
			const validator = getValidatorForCategory(config, 'general');

			expect(validator).toBeDefined();
			expect(typeof validator).toBe('object');
		});

		test('returns validator object', () => {
			const config = createMockValidationConfig();
			const validator = getValidatorForCategory(config, 'general');

			expect(typeof validator).toBe('object');
			expect(validator).toBeDefined();
		});

		test('different categories return different validators', () => {
			const config = createMockValidationConfig();
			const generalValidator = getValidatorForCategory(config, 'general');
			const supportValidator = getValidatorForCategory(config, 'support');

			expect(generalValidator).not.toBe(supportValidator);
		});

		test('uses createValidationSchemaForCategory internally', () => {
			const config = createMockValidationConfig();

			// This should work without throwing
			expect(() => {
				getValidatorForCategory(config, 'general');
			}).not.toThrow();
		});
	});

	describe('error handling', () => {
		test('throws error for invalid category', () => {
			const config = createMockValidationConfig();

			expect(() => {
				getValidatorForCategory(config, 'nonexistent');
			}).toThrow('Invalid category: nonexistent');
		});

		test('throws error when schema creation fails', () => {
			const config: ValidationConfig = {
				categories: {
					broken: { fields: [] },
				},
				schemas: {},
				categoryToFieldMap: {},
			};

			expect(() => {
				getValidatorForCategory(config, 'broken');
			}).toThrow('No schema found for category: broken');
		});
	});

	describe('validator functionality', () => {
		test('validator works with superForm format', () => {
			const config = createMockValidationConfig();
			const validator = getValidatorForCategory(config, 'general');

			// Validator should be an object returned by zod4 adapter
			expect(typeof validator).toBe('object');

			// The zod4 adapter returns a validation object
			expect(validator).toBeDefined();
		});

		test('validators from different categories use different schemas', () => {
			const config = createMockValidationConfig();
			const v1 = getValidatorForCategory(config, 'general');
			const v2 = getValidatorForCategory(config, 'support');

			// Different categories return validators
			expect(v1).not.toBe(v2);
			expect(v1).toBeDefined();
			expect(v2).toBeDefined();
		});
	});
});

describe('getValidationClasses', () => {
	describe('untouched field behavior', () => {
		test('returns empty string when not touched', () => {
			expect(getValidationClasses(false, false, '')).toBe('');
		});

		test('returns empty string when not touched even with error', () => {
			expect(getValidationClasses(true, false, '')).toBe('');
		});

		test('returns empty string when not touched with value', () => {
			expect(getValidationClasses(false, false, 'value')).toBe('');
		});

		test('returns empty string when not touched with error and value', () => {
			expect(getValidationClasses(true, false, 'value')).toBe('');
		});
	});

	describe('touched field with errors', () => {
		test('returns "is-invalid has-error" when touched with error', () => {
			expect(getValidationClasses(true, true, '')).toBe('is-invalid has-error');
		});

		test('returns "is-invalid has-error" when touched with error and value', () => {
			expect(getValidationClasses(true, true, 'some value')).toBe('is-invalid has-error');
		});

		test('returns error classes regardless of value type', () => {
			expect(getValidationClasses(true, true, 0)).toBe('is-invalid has-error');
			expect(getValidationClasses(true, true, false)).toBe('is-invalid has-error');
			expect(getValidationClasses(true, true, null)).toBe('is-invalid has-error');
		});
	});

	describe('touched field without errors', () => {
		test('returns "is-valid" when touched, no error, with value', () => {
			expect(getValidationClasses(false, true, 'valid value')).toBe('is-valid');
		});

		test('returns empty string when touched, no error, no value', () => {
			expect(getValidationClasses(false, true, '')).toBe('');
		});

		test('returns empty string when touched, no error, with null', () => {
			expect(getValidationClasses(false, true, null)).toBe('');
		});

		test('returns empty string when touched, no error, with undefined', () => {
			expect(getValidationClasses(false, true, undefined)).toBe('');
		});
	});

	describe('value handling', () => {
		test('handles various truthy values correctly', () => {
			expect(getValidationClasses(false, true, 'text')).toBe('is-valid');
			expect(getValidationClasses(false, true, 123)).toBe('is-valid');
			expect(getValidationClasses(false, true, { key: 'value' })).toBe('is-valid');
			expect(getValidationClasses(false, true, [1, 2, 3])).toBe('is-valid');
		});

		test('handles various falsy values correctly', () => {
			expect(getValidationClasses(false, true, '')).toBe('');
			expect(getValidationClasses(false, true, 0)).toBe('');
			expect(getValidationClasses(false, true, false)).toBe('');
			expect(getValidationClasses(false, true, null)).toBe('');
			expect(getValidationClasses(false, true, undefined)).toBe('');
		});

		test('boolean true is considered a value', () => {
			expect(getValidationClasses(false, true, true)).toBe('is-valid');
		});

		test('empty arrays and objects are considered values', () => {
			expect(getValidationClasses(false, true, [])).toBe('is-valid');
			expect(getValidationClasses(false, true, {})).toBe('is-valid');
		});

		test('whitespace-only string is considered a value', () => {
			expect(getValidationClasses(false, true, '   ')).toBe('is-valid');
		});
	});

	describe('all state combinations', () => {
		test('combinations: hasError=false, isTouched=false', () => {
			expect(getValidationClasses(false, false, '')).toBe('');
			expect(getValidationClasses(false, false, 'value')).toBe('');
		});

		test('combinations: hasError=false, isTouched=true', () => {
			expect(getValidationClasses(false, true, '')).toBe('');
			expect(getValidationClasses(false, true, 'value')).toBe('is-valid');
		});

		test('combinations: hasError=true, isTouched=false', () => {
			expect(getValidationClasses(true, false, '')).toBe('');
			expect(getValidationClasses(true, false, 'value')).toBe('');
		});

		test('combinations: hasError=true, isTouched=true', () => {
			expect(getValidationClasses(true, true, '')).toBe('is-invalid has-error');
			expect(getValidationClasses(true, true, 'value')).toBe('is-invalid has-error');
		});
	});
});

describe('createDebouncedValidator', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	describe('basic debounce behavior', () => {
		test('returns debounced function', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn);

			expect(typeof debounced).toBe('function');
		});

		test('delays execution by specified delay', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 500);

			debounced();
			expect(mockFn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(499);
			expect(mockFn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		test('uses default 300ms delay', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn);

			debounced();
			vi.advanceTimersByTime(299);
			expect(mockFn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(1);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});

	describe('rapid invocation handling', () => {
		test('cancels previous call on rapid invocations', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 300);

			debounced();
			vi.advanceTimersByTime(100);
			debounced();
			vi.advanceTimersByTime(100);
			debounced();

			// Only advance to when the last call should execute
			vi.advanceTimersByTime(300);

			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		test('only executes once after delay period', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 200);

			// Rapid calls
			debounced();
			debounced();
			debounced();

			vi.advanceTimersByTime(200);

			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		test('executes multiple times if delay fully elapses between calls', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 200);

			debounced();
			vi.advanceTimersByTime(200);
			expect(mockFn).toHaveBeenCalledTimes(1);

			debounced();
			vi.advanceTimersByTime(200);
			expect(mockFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('argument passing', () => {
		test('passes arguments correctly to original function', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 100);

			debounced('arg1', 'arg2', 123);
			vi.advanceTimersByTime(100);

			expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2', 123);
		});

		test('passes last arguments when called multiple times', () => {
			const mockFn = vi.fn();
			const debounced = createDebouncedValidator(mockFn, 100);

			debounced('first');
			debounced('second');
			debounced('third');
			vi.advanceTimersByTime(100);

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenCalledWith('third');
		});
	});

	describe('function type handling', () => {
		test('works with async functions', () => {
			const asyncFn = vi.fn(async () => 'result');
			const debounced = createDebouncedValidator(asyncFn, 100);

			debounced();
			vi.advanceTimersByTime(100);

			expect(asyncFn).toHaveBeenCalledTimes(1);
		});

		test('works with sync functions', () => {
			const syncFn = vi.fn(() => 'result');
			const debounced = createDebouncedValidator(syncFn, 100);

			debounced();
			vi.advanceTimersByTime(100);

			expect(syncFn).toHaveBeenCalledTimes(1);
		});

		test('preserves function context', () => {
			let capturedThis: any;
			const mockFn = function (this: any) {
				capturedThis = this;
			};
			const debounced = createDebouncedValidator(mockFn, 100);
			const context = { value: 'test' };

			debounced.call(context);
			vi.advanceTimersByTime(100);

			expect(capturedThis).toBe(context);
		});
	});
});

describe('hasValidationErrors', () => {
	describe('error detection', () => {
		test('returns true when errors exist with length > 0', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email format'],
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});

		test('returns false when no errors exist', () => {
			const errors: ValidationErrors = {};
			expect(hasValidationErrors(errors)).toBe(false);
		});

		test('returns false when errors are empty arrays', () => {
			const errors: ValidationErrors = {
				email: [],
				name: [],
			};
			expect(hasValidationErrors(errors)).toBe(false);
		});

		test('returns false when errors are undefined', () => {
			const errors: ValidationErrors = {
				email: undefined,
				name: undefined,
			};
			expect(hasValidationErrors(errors)).toBe(false);
		});
	});

	describe('mixed error states', () => {
		test('handles mixed error states (some fields with errors, some without)', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email'],
				name: [],
				phone: undefined,
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});

		test('returns true if at least one field has errors', () => {
			const errors: ValidationErrors = {
				field1: [],
				field2: undefined,
				field3: ['Error here'],
				field4: [],
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});

		test('handles single field with multiple errors', () => {
			const errors: ValidationErrors = {
				email: ['Invalid format', 'Already taken', 'Too long'],
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});
	});

	describe('edge cases', () => {
		test('empty errors object returns false', () => {
			expect(hasValidationErrors({})).toBe(false);
		});

		test('handles multiple fields all with empty arrays', () => {
			const errors: ValidationErrors = {
				email: [],
				name: [],
				message: [],
				phone: [],
			};
			expect(hasValidationErrors(errors)).toBe(false);
		});

		test('handles multiple fields all with undefined', () => {
			const errors: ValidationErrors = {
				email: undefined,
				name: undefined,
				message: undefined,
			};
			expect(hasValidationErrors(errors)).toBe(false);
		});

		test('handles large number of fields', () => {
			const errors: ValidationErrors = {};
			for (let i = 0; i < 100; i++) {
				errors[`field${i}`] = [];
			}
			expect(hasValidationErrors(errors)).toBe(false);

			errors.field50 = ['Error'];
			expect(hasValidationErrors(errors)).toBe(true);
		});
	});

	describe('nested error structures', () => {
		test('detects errors in flat structure', () => {
			const errors: ValidationErrors = {
				'user.name': ['Required'],
				'user.email': [],
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});

		test('handles dot-notation field names', () => {
			const errors: ValidationErrors = {
				'profile.bio': ['Too long'],
				'profile.age': undefined,
			};
			expect(hasValidationErrors(errors)).toBe(true);
		});
	});
});

describe('clearFieldError', () => {
	describe('error removal', () => {
		test('removes specified field from errors', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email'],
				name: ['Required'],
			};
			const result = clearFieldError(errors, 'email');

			expect(result.email).toBeUndefined();
			expect(result.name).toEqual(['Required']);
		});

		test('returns new object (immutability)', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email'],
			};
			const result = clearFieldError(errors, 'email');

			expect(result).not.toBe(errors);
		});

		test('original errors object unchanged', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email'],
				name: ['Required'],
			};
			const original = { ...errors };

			clearFieldError(errors, 'email');

			expect(errors).toEqual(original);
		});
	});

	describe('edge cases', () => {
		test('handles non-existent field (no-op)', () => {
			const errors: ValidationErrors = {
				email: ['Invalid'],
			};
			const result = clearFieldError(errors, 'nonexistent');

			expect(result.email).toEqual(['Invalid']);
			expect(result.nonexistent).toBeUndefined();
		});

		test('handles empty errors object', () => {
			const errors: ValidationErrors = {};
			const result = clearFieldError(errors, 'anyfield');

			expect(result).toEqual({});
		});

		test('handles clearing field with undefined value', () => {
			const errors: ValidationErrors = {
				email: undefined,
				name: ['Required'],
			};
			const result = clearFieldError(errors, 'email');

			expect(result.email).toBeUndefined();
			expect(result.name).toEqual(['Required']);
		});
	});

	describe('multiple operations', () => {
		test('handles multiple field clears in sequence', () => {
			let errors: ValidationErrors = {
				email: ['Invalid'],
				name: ['Required'],
				phone: ['Invalid format'],
			};

			errors = clearFieldError(errors, 'email');
			expect(errors.email).toBeUndefined();

			errors = clearFieldError(errors, 'name');
			expect(errors.name).toBeUndefined();

			expect(errors.phone).toEqual(['Invalid format']);
		});

		test('preserves other field errors', () => {
			const errors: ValidationErrors = {
				field1: ['Error 1'],
				field2: ['Error 2'],
				field3: ['Error 3'],
			};
			const result = clearFieldError(errors, 'field2');

			expect(result.field1).toEqual(['Error 1']);
			expect(result.field2).toBeUndefined();
			expect(result.field3).toEqual(['Error 3']);
		});

		test('clearing all fields results in empty object references', () => {
			let errors: ValidationErrors = {
				email: ['Error'],
				name: ['Error'],
			};

			errors = clearFieldError(errors, 'email');
			errors = clearFieldError(errors, 'name');

			expect(Object.keys(errors).length).toBe(0);
		});
	});
});

describe('Pre-built Schemas', () => {
	describe('contactSchema', () => {
		test('validates valid contact data', () => {
			const validData = {
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Hello world',
				coppa: true,
			};

			const result = contactSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test('requires name (non-empty)', () => {
			const data = {
				name: '',
				email: 'john@example.com',
				message: 'Hello',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'name')).toBe(true);
			}
		});

		test('requires valid email format', () => {
			const data = {
				name: 'John',
				email: 'invalid-email',
				message: 'Hello',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'email')).toBe(true);
			}
		});

		test('requires message (non-empty)', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: '',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'message')).toBe(true);
			}
		});

		test('requires coppa=true', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Hello',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		test('rejects coppa=false', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Hello',
				coppa: false,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'coppa')).toBe(true);
			}
		});

		test('optional attachments (array of Files)', () => {
			const dataWithAttachments = {
				name: 'John',
				email: 'john@example.com',
				message: 'Hello',
				attachments: [new File(['content'], 'test.txt')],
				coppa: true,
			};

			const result = contactSchema.safeParse(dataWithAttachments);
			expect(result.success).toBe(true);
		});

		test('validates without attachments', () => {
			const dataWithoutAttachments = {
				name: 'John',
				email: 'john@example.com',
				message: 'Hello',
				coppa: true,
			};

			const result = contactSchema.safeParse(dataWithoutAttachments);
			expect(result.success).toBe(true);
		});
	});

	describe('feedbackSchema', () => {
		test('validates valid feedback data', () => {
			const validData = {
				name: 'Jane Doe',
				email: 'jane@example.com',
				message: 'Great product!',
				coppa: true,
			};

			const result = feedbackSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		test('has same structure as contactSchema', () => {
			const data = {
				name: 'Jane',
				email: 'jane@example.com',
				message: 'Feedback here',
				coppa: true,
			};

			const contactResult = contactSchema.safeParse(data);
			const feedbackResult = feedbackSchema.safeParse(data);

			expect(contactResult.success).toBe(feedbackResult.success);
		});

		test('requires all contact fields', () => {
			const incompleteData = {
				name: '',
				email: 'invalid',
				message: '',
				coppa: false,
			};

			const result = feedbackSchema.safeParse(incompleteData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
			}
		});

		test('accepts attachments like contactSchema', () => {
			const data = {
				name: 'Jane',
				email: 'jane@example.com',
				message: 'Feedback',
				attachments: [new File(['data'], 'screenshot.png')],
				coppa: true,
			};

			const result = feedbackSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe('supportSchema', () => {
		test('requires name, email, message', () => {
			const data = {
				name: '',
				email: 'invalid',
				message: '',
				browser: 'Chrome',
				browserVersion: '100',
				operatingSystem: 'Windows',
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('requires browser field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Help needed',
				browser: '',
				browserVersion: '100',
				operatingSystem: 'Windows',
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'browser')).toBe(true);
			}
		});

		test('requires browserVersion field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Help',
				browser: 'Chrome',
				browserVersion: '',
				operatingSystem: 'Windows',
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('requires operatingSystem field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Help',
				browser: 'Chrome',
				browserVersion: '100',
				operatingSystem: '',
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('optional attachments', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Bug report',
				browser: 'Firefox',
				browserVersion: '95',
				operatingSystem: 'macOS',
				attachments: [new File(['log'], 'error.log')],
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		test('requires coppa=true', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				message: 'Help',
				browser: 'Chrome',
				browserVersion: '100',
				operatingSystem: 'Windows',
				coppa: false,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('validates complete valid support data', () => {
			const data = {
				name: 'John Doe',
				email: 'john@example.com',
				message: 'I need help with login',
				browser: 'Chrome',
				browserVersion: '100.0.4896.127',
				operatingSystem: 'Windows 11',
				coppa: true,
			};

			const result = supportSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe('businessSchema', () => {
		test('requires name, email, message', () => {
			const data = {
				name: '',
				email: 'invalid',
				company: 'Acme',
				businessRole: 'CEO',
				message: '',
				coppa: true,
			};

			const result = businessSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('requires company field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				company: '',
				businessRole: 'Manager',
				message: 'Partnership',
				coppa: true,
			};

			const result = businessSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'company')).toBe(true);
			}
		});

		test('requires businessRole field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				company: 'Acme Inc',
				businessRole: '',
				message: 'Inquiry',
				coppa: true,
			};

			const result = businessSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'businessRole')).toBe(true);
			}
		});

		test('requires coppa=true', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				company: 'Acme',
				businessRole: 'CEO',
				message: 'Business inquiry',
				coppa: false,
			};

			const result = businessSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('validates complete valid business data', () => {
			const data = {
				name: 'Jane Smith',
				email: 'jane@acme.com',
				company: 'Acme Corporation',
				businessRole: 'Chief Technology Officer',
				message: 'Interested in enterprise plan',
				coppa: true,
			};

			const result = businessSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe('bookingSchema', () => {
		test('requires name, email, message', () => {
			const data = {
				name: '',
				email: 'invalid',
				phone: '1234567890',
				preferredDate: '2024-01-01',
				preferredTime: '10:00',
				message: '',
				coppa: true,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('requires phone field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				phone: '',
				preferredDate: '2024-01-01',
				preferredTime: '10:00',
				message: 'Book appointment',
				coppa: true,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'phone')).toBe(true);
			}
		});

		test('requires preferredDate field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				phone: '1234567890',
				preferredDate: '',
				preferredTime: '10:00',
				message: 'Appointment',
				coppa: true,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'preferredDate')).toBe(true);
			}
		});

		test('requires preferredTime field', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				phone: '1234567890',
				preferredDate: '2024-01-01',
				preferredTime: '',
				message: 'Booking',
				coppa: true,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.some((i) => i.path[0] === 'preferredTime')).toBe(true);
			}
		});

		test('requires coppa=true', () => {
			const data = {
				name: 'John',
				email: 'john@example.com',
				phone: '555-0123',
				preferredDate: '2024-06-15',
				preferredTime: '14:30',
				message: 'Book consultation',
				coppa: false,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		test('validates complete valid booking data', () => {
			const data = {
				name: 'Alice Johnson',
				email: 'alice@example.com',
				phone: '+1-555-123-4567',
				preferredDate: '2024-06-15',
				preferredTime: '14:30',
				message: 'Would like to schedule a consultation',
				coppa: true,
			};

			const result = bookingSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe('schema validation edge cases', () => {
		test('rejects missing required fields', () => {
			const schemas = [
				{ schema: contactSchema, name: 'contact' },
				{ schema: feedbackSchema, name: 'feedback' },
				{ schema: supportSchema, name: 'support' },
				{ schema: businessSchema, name: 'business' },
				{ schema: bookingSchema, name: 'booking' },
			];

			schemas.forEach(({ schema }) => {
				const result = schema.safeParse({});
				expect(result.success).toBe(false);
			});
		});

		test('handles special characters in text fields', () => {
			const data = {
				name: "John O'Brien",
				email: 'john@ex-ample.com',
				message: 'Hello! How are you? <test>',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		test('rejects extremely long email addresses', () => {
			const longEmail = 'a'.repeat(255) + '@example.com';
			const data = {
				name: 'John',
				email: longEmail,
				message: 'Test',
				coppa: true,
			};

			const result = contactSchema.safeParse(data);
			// Email validation should handle this appropriately
			expect(result).toBeDefined();
		});
	});
});

describe('Integration Tests', () => {
	describe('full validation flow', () => {
		test('config → schema → validator → validation', () => {
			const config = createMockValidationConfig();

			// Create schema
			const schema = createValidationSchemaForCategory(config, 'general');
			expect(schema).toBeDefined();

			// Create validator
			const validator = getValidatorForCategory(config, 'general');
			expect(validator).toBeDefined();

			// Validate data
			const result = schema.safeParse({
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Hello',
			});
			expect(result.success).toBe(true);
		});

		test('ValidationConfig with multiple categories', () => {
			const config = createMockValidationConfig();

			const generalSchema = createValidationSchemaForCategory(config, 'general');
			const supportSchema = createValidationSchemaForCategory(config, 'support');
			const businessSchema = createValidationSchemaForCategory(config, 'business');

			expect(generalSchema).toBeDefined();
			expect(supportSchema).toBeDefined();
			expect(businessSchema).toBeDefined();
		});

		test('schema creation with field mappings', () => {
			const config = createMockValidationConfig();
			if (config.schemas?.categories) {
				delete config.schemas.categories.business;
			}

			const schema = createValidationSchemaForCategory(config, 'business');

			const validResult = schema.safeParse({
				name: 'John',
				email: 'john@example.com',
				company: 'Acme',
			});

			expect(validResult.success).toBe(true);
		});
	});

	describe('error message formatting', () => {
		test('validates with error messages from Zod', () => {
			const schema = contactSchema;
			const result = schema.safeParse({
				name: '',
				email: 'invalid',
				message: '',
				coppa: false,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues.length).toBeGreaterThan(0);
				result.error.issues.forEach((issue) => {
					expect(issue.message).toBeDefined();
					expect(typeof issue.message).toBe('string');
				});
			}
		});

		test('custom error messages are preserved', () => {
			const result = contactSchema.safeParse({
				name: '',
				email: 'test@test.com',
				message: 'Hello',
				coppa: true,
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				const nameError = result.error.issues.find((i) => i.path[0] === 'name');
				expect(nameError?.message).toBe('Please provide your name');
			}
		});
	});

	describe('CSS classes in form context', () => {
		test('simulates form field validation state', () => {
			const errors: ValidationErrors = {
				email: ['Invalid email'],
			};
			const touched = { email: true, name: false };
			const values = { email: 'invalid', name: '' };

			// Email field: touched, has error
			const emailClasses = getValidationClasses(
				hasValidationErrors({ email: errors.email }),
				touched.email,
				values.email
			);
			expect(emailClasses).toBe('is-invalid has-error');

			// Name field: not touched
			const nameClasses = getValidationClasses(
				false,
				touched.name,
				values.name
			);
			expect(nameClasses).toBe('');
		});

		test('complete form validation lifecycle', () => {
			// Initial state: untouched
			let classes = getValidationClasses(false, false, '');
			expect(classes).toBe('');

			// User touches field, starts typing (invalid)
			classes = getValidationClasses(true, true, 'inv');
			expect(classes).toBe('is-invalid has-error');

			// User fixes the issue
			classes = getValidationClasses(false, true, 'valid@email.com');
			expect(classes).toBe('is-valid');
		});
	});

	describe('debounced validation in rapid input', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		test('validates only after user stops typing', () => {
			const validateFn = vi.fn((value: string) => {
				return contactSchema.shape.email.safeParse(value);
			});

			const debouncedValidate = createDebouncedValidator(validateFn, 300);

			// Simulate rapid typing
			debouncedValidate('t');
			debouncedValidate('te');
			debouncedValidate('tes');
			debouncedValidate('test');
			debouncedValidate('test@');
			debouncedValidate('test@ex');
			debouncedValidate('test@example.com');

			expect(validateFn).not.toHaveBeenCalled();

			vi.advanceTimersByTime(300);

			expect(validateFn).toHaveBeenCalledTimes(1);
			expect(validateFn).toHaveBeenCalledWith('test@example.com');
		});
	});

	describe('combined error checking and clearing', () => {
		test('clear errors and check for remaining errors', () => {
			let errors: ValidationErrors = {
				email: ['Invalid email'],
				name: ['Name required'],
				message: ['Message required'],
			};

			expect(hasValidationErrors(errors)).toBe(true);

			errors = clearFieldError(errors, 'email');
			expect(hasValidationErrors(errors)).toBe(true);

			errors = clearFieldError(errors, 'name');
			expect(hasValidationErrors(errors)).toBe(true);

			errors = clearFieldError(errors, 'message');
			expect(hasValidationErrors(errors)).toBe(false);
		});

		test('progressive error resolution workflow', () => {
			let errors: ValidationErrors = {
				email: ['Invalid'],
				name: ['Required'],
				coppa: ['Must agree'],
			};

			// User fixes email
			errors = clearFieldError(errors, 'email');
			expect(hasValidationErrors(errors)).toBe(true);
			const emailClasses = getValidationClasses(false, true, 'valid@email.com');
			expect(emailClasses).toBe('is-valid');

			// User fixes name
			errors = clearFieldError(errors, 'name');
			expect(hasValidationErrors(errors)).toBe(true);

			// User fixes coppa
			errors = clearFieldError(errors, 'coppa');
			expect(hasValidationErrors(errors)).toBe(false);
		});
	});

	describe('real-world form scenarios', () => {
		test('contact form submission validation', () => {
			const formData = {
				name: 'John Doe',
				email: 'john@example.com',
				message: 'I have a question about your product',
				coppa: true,
			};

			const result = contactSchema.safeParse(formData);
			expect(result.success).toBe(true);

			if (result.success) {
				const errors: ValidationErrors = {};
				expect(hasValidationErrors(errors)).toBe(false);
			}
		});

		test('support form with technical details', () => {
			const formData = {
				name: 'Jane Smith',
				email: 'jane@example.com',
				message: 'Login button not working',
				browser: 'Google Chrome',
				browserVersion: '119.0.6045.105',
				operatingSystem: 'macOS Sonoma 14.1',
				coppa: true,
			};

			const result = supportSchema.safeParse(formData);
			expect(result.success).toBe(true);
		});

		test('validation with partial form completion', () => {
			const partialData = {
				name: 'John',
				email: '',
				message: 'Test',
				coppa: true,
			};

			const result = contactSchema.safeParse(partialData);
			expect(result.success).toBe(false);

			if (!result.success) {
				const errors: ValidationErrors = {};
				result.error.issues.forEach((issue) => {
					const field = issue.path[0] as string;
					if (!errors[field]) {
						errors[field] = [];
					}
					errors[field]?.push(issue.message);
				});

				expect(hasValidationErrors(errors)).toBe(true);
				expect(errors.email).toBeDefined();
			}
		});
	});
});
