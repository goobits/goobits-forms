import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
	defaultFieldConfigs,
	defaultCategories,
	defaultUiConfig,
	defaultContactSchema,
	validateContactConfig,
	getValidatorForCategory,
	initContactFormConfig,
	type ContactSchema,
	type ExtendedFieldConfig,
	type ExtendedCategoryConfig,
	type EnhancedContactFormConfig
} from './contactSchemas';

// Mock the logger to verify warning calls - use vi.hoisted to ensure proper initialization
const { mockWarn, mockInfo, mockError, mockDebug } = vi.hoisted(() => ({
	mockWarn: vi.fn(),
	mockInfo: vi.fn(),
	mockError: vi.fn(),
	mockDebug: vi.fn()
}));

vi.mock('../utils/logger', () => ({
	createLogger: () => ({
		warn: mockWarn,
		info: mockInfo,
		error: mockError,
		debug: mockDebug
	})
}));

describe('contactSchemas', () => {
	beforeEach(() => {
		// Reset mocks before each test
		vi.clearAllMocks();
	});

	describe('defaultFieldConfigs', () => {
		describe('field presence', () => {
			test('should contain name field', () => {
				expect(defaultFieldConfigs).toHaveProperty('name');
			});

			test('should contain email field', () => {
				expect(defaultFieldConfigs).toHaveProperty('email');
			});

			test('should contain phone field', () => {
				expect(defaultFieldConfigs).toHaveProperty('phone');
			});

			test('should contain message field', () => {
				expect(defaultFieldConfigs).toHaveProperty('message');
			});

			test('should contain subject field', () => {
				expect(defaultFieldConfigs).toHaveProperty('subject');
			});

			test('should contain company field', () => {
				expect(defaultFieldConfigs).toHaveProperty('company');
			});

			test('should contain website field', () => {
				expect(defaultFieldConfigs).toHaveProperty('website');
			});

			test('should contain industry field', () => {
				expect(defaultFieldConfigs).toHaveProperty('industry');
			});

			test('should contain role field', () => {
				expect(defaultFieldConfigs).toHaveProperty('role');
			});

			test('should contain operatingSystem field', () => {
				expect(defaultFieldConfigs).toHaveProperty('operatingSystem');
			});

			test('should contain browser field', () => {
				expect(defaultFieldConfigs).toHaveProperty('browser');
			});

			test('should contain browserVersion field', () => {
				expect(defaultFieldConfigs).toHaveProperty('browserVersion');
			});

			test('should contain attachments field', () => {
				expect(defaultFieldConfigs).toHaveProperty('attachments');
			});

			test('should contain coppa field', () => {
				expect(defaultFieldConfigs).toHaveProperty('coppa');
			});

			test('should contain terms field', () => {
				expect(defaultFieldConfigs).toHaveProperty('terms');
			});

			test('should contain privacy field', () => {
				expect(defaultFieldConfigs).toHaveProperty('privacy');
			});

			test('should contain marketing field', () => {
				expect(defaultFieldConfigs).toHaveProperty('marketing');
			});

			test('should have at least 14 fields', () => {
				const fieldCount = Object.keys(defaultFieldConfigs).length;
				expect(fieldCount).toBeGreaterThanOrEqual(14);
			});
		});

		describe('required field properties', () => {
			test('each field should have type property', () => {
				Object.entries(defaultFieldConfigs).forEach(([name, field]) => {
					expect(field).toHaveProperty('type');
					expect(typeof field.type).toBe('string');
					expect(field.type).not.toBe('');
				});
			});

			test('each field should have label property', () => {
				Object.entries(defaultFieldConfigs).forEach(([name, field]) => {
					expect(field).toHaveProperty('label');
					expect(typeof field.label).toBe('string');
					expect(field.label).not.toBe('');
				});
			});

			test('each field should have required property', () => {
				Object.entries(defaultFieldConfigs).forEach(([name, field]) => {
					expect(field).toHaveProperty('required');
					expect(typeof field.required).toBe('boolean');
				});
			});

			test('text/email/tel/url fields should have placeholder', () => {
				Object.entries(defaultFieldConfigs).forEach(([name, field]) => {
					if (['text', 'email', 'tel', 'url', 'textarea'].includes(field.type)) {
						expect(field).toHaveProperty('placeholder');
						expect(typeof field.placeholder).toBe('string');
					}
				});
			});
		});

		describe('required field validation', () => {
			test('name field should be required', () => {
				expect(defaultFieldConfigs.name.required).toBe(true);
			});

			test('email field should be required', () => {
				expect(defaultFieldConfigs.email.required).toBe(true);
			});

			test('message field should be required', () => {
				expect(defaultFieldConfigs.message.required).toBe(true);
			});

			test('coppa field should be required', () => {
				expect(defaultFieldConfigs.coppa.required).toBe(true);
			});

			test('terms field should be required', () => {
				expect(defaultFieldConfigs.terms.required).toBe(true);
			});

			test('privacy field should be required', () => {
				expect(defaultFieldConfigs.privacy.required).toBe(true);
			});
		});

		describe('optional field validation', () => {
			test('phone field should be optional', () => {
				expect(defaultFieldConfigs.phone.required).toBe(false);
			});

			test('subject field should be optional', () => {
				expect(defaultFieldConfigs.subject.required).toBe(false);
			});

			test('company field should be optional', () => {
				expect(defaultFieldConfigs.company.required).toBe(false);
			});

			test('website field should be optional', () => {
				expect(defaultFieldConfigs.website.required).toBe(false);
			});

			test('role field should be optional', () => {
				expect(defaultFieldConfigs.role.required).toBe(false);
			});

			test('marketing field should be optional', () => {
				expect(defaultFieldConfigs.marketing.required).toBe(false);
			});
		});

		describe('field type validation', () => {
			test('name field should be text type', () => {
				expect(defaultFieldConfigs.name.type).toBe('text');
			});

			test('email field should be email type', () => {
				expect(defaultFieldConfigs.email.type).toBe('email');
			});

			test('phone field should be tel type', () => {
				expect(defaultFieldConfigs.phone.type).toBe('tel');
			});

			test('message field should be textarea type', () => {
				expect(defaultFieldConfigs.message.type).toBe('textarea');
			});

			test('website field should be url type', () => {
				expect(defaultFieldConfigs.website.type).toBe('url');
			});

			test('attachments field should be file type', () => {
				expect(defaultFieldConfigs.attachments.type).toBe('file');
			});

			test('coppa field should be checkbox type', () => {
				expect(defaultFieldConfigs.coppa.type).toBe('checkbox');
			});

			test('terms field should be checkbox type', () => {
				expect(defaultFieldConfigs.terms.type).toBe('checkbox');
			});

			test('privacy field should be checkbox type', () => {
				expect(defaultFieldConfigs.privacy.type).toBe('checkbox');
			});

			test('marketing field should be checkbox type', () => {
				expect(defaultFieldConfigs.marketing.type).toBe('checkbox');
			});
		});

		describe('special field properties', () => {
			test('message textarea should have rows property', () => {
				expect(defaultFieldConfigs.message).toHaveProperty('rows');
				expect(typeof defaultFieldConfigs.message.rows).toBe('number');
				expect(defaultFieldConfigs.message.rows).toBeGreaterThan(0);
			});

			test('attachments should have multiple property', () => {
				expect(defaultFieldConfigs.attachments).toHaveProperty('multiple');
				expect(defaultFieldConfigs.attachments.multiple).toBe(true);
			});

			test('attachments should have accept property', () => {
				expect(defaultFieldConfigs.attachments).toHaveProperty('accept');
				expect(typeof defaultFieldConfigs.attachments.accept).toBe('string');
				expect(defaultFieldConfigs.attachments.accept).not.toBe('');
			});

			test('attachments should have maxFiles property', () => {
				expect(defaultFieldConfigs.attachments).toHaveProperty('maxFiles');
				expect(typeof defaultFieldConfigs.attachments.maxFiles).toBe('number');
				expect(defaultFieldConfigs.attachments.maxFiles).toBeGreaterThan(0);
			});

			test('attachments should have maxSize property', () => {
				expect(defaultFieldConfigs.attachments).toHaveProperty('maxSize');
				expect(typeof defaultFieldConfigs.attachments.maxSize).toBe('number');
				expect(defaultFieldConfigs.attachments.maxSize).toBeGreaterThan(0);
			});
		});

		describe('maxlength validation', () => {
			test('text fields should have reasonable maxlength', () => {
				const textFields = ['name', 'email', 'phone', 'subject', 'company', 'website'];
				textFields.forEach((fieldName) => {
					if (defaultFieldConfigs[fieldName] && defaultFieldConfigs[fieldName].maxlength) {
						const maxlength = defaultFieldConfigs[fieldName].maxlength!;
						expect(maxlength).toBeGreaterThan(0);
						expect(maxlength).toBeLessThanOrEqual(500);
					}
				});
			});

			test('message field should have large maxlength', () => {
				expect(defaultFieldConfigs.message.maxlength).toBeDefined();
				expect(defaultFieldConfigs.message.maxlength).toBeGreaterThanOrEqual(1000);
			});
		});
	});

	describe('defaultCategories', () => {
		describe('category presence', () => {
			test('should contain general category', () => {
				expect(defaultCategories).toHaveProperty('general');
			});

			test('should contain support category', () => {
				expect(defaultCategories).toHaveProperty('support');
			});

			test('should contain feedback category', () => {
				expect(defaultCategories).toHaveProperty('feedback');
			});

			test('should contain business category', () => {
				expect(defaultCategories).toHaveProperty('business');
			});

			test('should have at least 4 categories', () => {
				const categoryCount = Object.keys(defaultCategories).length;
				expect(categoryCount).toBeGreaterThanOrEqual(4);
			});
		});

		describe('category structure', () => {
			test('each category should have label property', () => {
				Object.entries(defaultCategories).forEach(([key, category]) => {
					expect(category).toHaveProperty('label');
					expect(typeof category.label).toBe('string');
					expect(category.label).not.toBe('');
				});
			});

			test('each category should have icon property', () => {
				Object.entries(defaultCategories).forEach(([key, category]) => {
					expect(category).toHaveProperty('icon');
					expect(typeof category.icon).toBe('string');
					expect(category.icon).not.toBe('');
				});
			});

			test('each category should have fields array', () => {
				Object.entries(defaultCategories).forEach(([key, category]) => {
					expect(category).toHaveProperty('fields');
					expect(Array.isArray(category.fields)).toBe(true);
					expect(category.fields.length).toBeGreaterThan(0);
				});
			});
		});

		describe('category field configurations', () => {
			test('general category should have basic fields', () => {
				expect(defaultCategories.general.fields).toContain('name');
				expect(defaultCategories.general.fields).toContain('email');
				expect(defaultCategories.general.fields).toContain('message');
			});

			test('support category should have technical fields', () => {
				expect(defaultCategories.support.fields).toContain('operatingSystem');
				expect(defaultCategories.support.fields).toContain('browser');
			});

			test('feedback category should have basic fields only', () => {
				expect(defaultCategories.feedback.fields).toContain('name');
				expect(defaultCategories.feedback.fields).toContain('email');
				expect(defaultCategories.feedback.fields).toContain('message');
			});

			test('business category should have company fields', () => {
				expect(defaultCategories.business.fields).toContain('company');
				expect(defaultCategories.business.fields).toContain('role');
			});

			test('all referenced fields should exist in defaultFieldConfigs', () => {
				Object.entries(defaultCategories).forEach(([catKey, category]) => {
					category.fields.forEach((fieldName) => {
						expect(defaultFieldConfigs).toHaveProperty(fieldName);
					});
				});
			});
		});
	});

	describe('defaultUiConfig', () => {
		describe('required properties', () => {
			test('should have submitButtonText property', () => {
				expect(defaultUiConfig).toHaveProperty('submitButtonText');
				expect(typeof defaultUiConfig.submitButtonText).toBe('string');
				expect(defaultUiConfig.submitButtonText).not.toBe('');
			});

			test('should have submittingButtonText property', () => {
				expect(defaultUiConfig).toHaveProperty('submittingButtonText');
				expect(typeof defaultUiConfig.submittingButtonText).toBe('string');
				expect(defaultUiConfig.submittingButtonText).not.toBe('');
			});

			test('should have resetAfterSubmit property', () => {
				expect(defaultUiConfig).toHaveProperty('resetAfterSubmit');
				expect(typeof defaultUiConfig.resetAfterSubmit).toBe('boolean');
			});

			test('should have showSuccessMessage property', () => {
				expect(defaultUiConfig).toHaveProperty('showSuccessMessage');
				expect(typeof defaultUiConfig.showSuccessMessage).toBe('boolean');
			});

			test('should have successMessageDuration property', () => {
				expect(defaultUiConfig).toHaveProperty('successMessageDuration');
				expect(typeof defaultUiConfig.successMessageDuration).toBe('number');
				expect(defaultUiConfig.successMessageDuration).toBeGreaterThan(0);
			});

			test('should have theme property', () => {
				expect(defaultUiConfig).toHaveProperty('theme');
				expect(['light', 'dark', 'auto']).toContain(defaultUiConfig.theme);
			});

			test('should have labelPosition property', () => {
				expect(defaultUiConfig).toHaveProperty('labelPosition');
				expect(['top', 'left', 'inline']).toContain(defaultUiConfig.labelPosition);
			});

			test('should have fieldSpacing property', () => {
				expect(defaultUiConfig).toHaveProperty('fieldSpacing');
				expect(['tight', 'medium', 'loose']).toContain(defaultUiConfig.fieldSpacing);
			});

			test('should have requiredIndicator property', () => {
				expect(defaultUiConfig).toHaveProperty('requiredIndicator');
				expect(typeof defaultUiConfig.requiredIndicator).toBe('string');
				expect(defaultUiConfig.requiredIndicator).not.toBe('');
			});

			test('should have showRequiredLabel property', () => {
				expect(defaultUiConfig).toHaveProperty('showRequiredLabel');
				expect(typeof defaultUiConfig.showRequiredLabel).toBe('boolean');
			});

			test('should have requiredLabelText property', () => {
				expect(defaultUiConfig).toHaveProperty('requiredLabelText');
				expect(typeof defaultUiConfig.requiredLabelText).toBe('string');
				expect(defaultUiConfig.requiredLabelText).not.toBe('');
			});

			test('should have errorMessagePosition property', () => {
				expect(defaultUiConfig).toHaveProperty('errorMessagePosition');
				expect(['above', 'below', 'inline']).toContain(defaultUiConfig.errorMessagePosition);
			});
		});

		describe('default values', () => {
			test('resetAfterSubmit should default to true', () => {
				expect(defaultUiConfig.resetAfterSubmit).toBe(true);
			});

			test('showSuccessMessage should default to true', () => {
				expect(defaultUiConfig.showSuccessMessage).toBe(true);
			});

			test('duration should be positive number', () => {
				expect(defaultUiConfig.successMessageDuration).toBeGreaterThan(0);
			});

			test('showRequiredLabel should default to true', () => {
				expect(defaultUiConfig.showRequiredLabel).toBe(true);
			});
		});
	});

	describe('defaultContactSchema', () => {
		test('should have appName property', () => {
			expect(defaultContactSchema).toHaveProperty('appName');
			expect(typeof defaultContactSchema.appName).toBe('string');
			expect(defaultContactSchema.appName).not.toBe('');
		});

		test('should have categories object', () => {
			expect(defaultContactSchema).toHaveProperty('categories');
			expect(typeof defaultContactSchema.categories).toBe('object');
			expect(defaultContactSchema.categories).toBe(defaultCategories);
		});

		test('should have fieldConfigs object', () => {
			expect(defaultContactSchema).toHaveProperty('fieldConfigs');
			expect(typeof defaultContactSchema.fieldConfigs).toBe('object');
			expect(defaultContactSchema.fieldConfigs).toBe(defaultFieldConfigs);
		});

		test('should have ui object', () => {
			expect(defaultContactSchema).toHaveProperty('ui');
			expect(typeof defaultContactSchema.ui).toBe('object');
			expect(defaultContactSchema.ui).toBe(defaultUiConfig);
		});

		test('should have validation config with boolean properties', () => {
			expect(defaultContactSchema).toHaveProperty('validation');
			expect(typeof defaultContactSchema.validation.validateOnBlur).toBe('boolean');
			expect(typeof defaultContactSchema.validation.validateOnChange).toBe('boolean');
			expect(typeof defaultContactSchema.validation.showErrorsOnBlur).toBe('boolean');
			expect(typeof defaultContactSchema.validation.showErrorsOnSubmit).toBe('boolean');
		});

		test('should have routes config with path strings', () => {
			expect(defaultContactSchema).toHaveProperty('routes');
			expect(typeof defaultContactSchema.routes.basePath).toBe('string');
			expect(typeof defaultContactSchema.routes.successPath).toBe('string');
			expect(typeof defaultContactSchema.routes.apiPath).toBe('string');
			expect(defaultContactSchema.routes.basePath).not.toBe('');
			expect(defaultContactSchema.routes.successPath).not.toBe('');
			expect(defaultContactSchema.routes.apiPath).not.toBe('');
		});

		test('should have recaptcha config with enabled false by default', () => {
			expect(defaultContactSchema).toHaveProperty('recaptcha');
			expect(defaultContactSchema.recaptcha.enabled).toBe(false);
			expect(typeof defaultContactSchema.recaptcha.siteKey).toBe('string');
			expect(typeof defaultContactSchema.recaptcha.minScore).toBe('number');
		});

		test('should have storage config with enabled false by default', () => {
			expect(defaultContactSchema).toHaveProperty('storage');
			expect(defaultContactSchema.storage.enabled).toBe(false);
			expect(typeof defaultContactSchema.storage.storageKey).toBe('string');
			expect(typeof defaultContactSchema.storage.expiry).toBe('number');
			expect(Array.isArray(defaultContactSchema.storage.fields)).toBe(true);
		});

		test('all nested objects should be properly structured', () => {
			expect(Object.keys(defaultContactSchema)).toEqual(
				expect.arrayContaining([
					'appName',
					'categories',
					'fieldConfigs',
					'ui',
					'validation',
					'routes',
					'recaptcha',
					'storage'
				])
			);
		});
	});

	describe('validateContactConfig', () => {
		describe('valid configurations', () => {
			test('should return valid true for complete valid config', () => {
				const result = validateContactConfig(defaultContactSchema);
				expect(result.valid).toBe(true);
			});

			test('should return empty errors array for valid config', () => {
				const result = validateContactConfig(defaultContactSchema);
				expect(result.errors).toEqual([]);
			});

			test('should accept minimal valid config', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: {
							type: 'text',
							label: 'Name',
							required: true
						}
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		describe('category validation', () => {
			test('should return error when no categories defined', () => {
				const config: Partial<ContactSchema> = {
					fieldConfigs: defaultFieldConfigs
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('No categories defined in contact form configuration');
			});

			test('should return error when categories object is empty', () => {
				const config: Partial<ContactSchema> = {
					categories: {},
					fieldConfigs: defaultFieldConfigs
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('No categories defined in contact form configuration');
			});

			test('should return error when category missing label', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: '',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true }
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Category "test" is missing a label');
			});

			test('should return error when category has no fields', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: [] as any
						}
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Category "test" has no fields defined');
			});

			test('should return error when category fields is empty array', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: []
						}
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Category "test" has no fields defined');
			});

			test('should return error when category fields is not array', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: 'invalid' as any
						}
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('Category "test" has no fields defined');
			});
		});

		describe('field validation', () => {
			test('should return error when field used but not configured', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['missingField']
						}
					},
					fieldConfigs: {}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain(
					'Field "missingField" is used in categories but has no configuration'
				);
			});

			test('should accept when all used fields are configured', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name', 'email']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true },
						email: { type: 'email', label: 'Email', required: true }
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(true);
			});

			test('should validate multiple missing field configs', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['field1', 'field2', 'field3']
						}
					},
					fieldConfigs: {}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBe(3);
				expect(result.errors).toContain('Field "field1" is used in categories but has no configuration');
				expect(result.errors).toContain('Field "field2" is used in categories but has no configuration');
				expect(result.errors).toContain('Field "field3" is used in categories but has no configuration');
			});

			test('should ignore unused field configs (no error)', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true },
						unusedField: { type: 'text', label: 'Unused', required: false }
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(true);
				expect(result.errors).toEqual([]);
			});
		});

		describe('reCAPTCHA validation', () => {
			test('should return error when recaptcha enabled but no siteKey', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true }
					},
					recaptcha: {
						enabled: true,
						provider: 'google-v3',
						siteKey: '',
						minScore: 0.5
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors).toContain('reCAPTCHA is enabled but no site key is provided');
			});

			test('should accept when recaptcha enabled with siteKey', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true }
					},
					recaptcha: {
						enabled: true,
						provider: 'google-v3',
						siteKey: 'my-site-key',
						minScore: 0.5
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(true);
			});

			test('should accept when recaptcha disabled without siteKey', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: 'Test',
							fields: ['name']
						}
					},
					fieldConfigs: {
						name: { type: 'text', label: 'Name', required: true }
					},
					recaptcha: {
						enabled: false,
						provider: 'google-v3',
						siteKey: '',
						minScore: 0.5
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(true);
			});
		});

		describe('multiple errors', () => {
			test('should accumulate multiple errors', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test1: {
							label: '',
							fields: []
						},
						test2: {
							label: 'Test2',
							fields: ['missingField']
						}
					},
					fieldConfigs: {}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(1);
			});

			test('should return all errors at once', () => {
				const config: Partial<ContactSchema> = {
					categories: {
						test: {
							label: '',
							fields: ['field1', 'field2']
						}
					},
					fieldConfigs: {},
					recaptcha: {
						enabled: true,
						provider: 'google-v3',
						siteKey: '',
						minScore: 0.5
					}
				};

				const result = validateContactConfig(config);
				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThanOrEqual(3);
			});
		});
	});

	describe('getValidatorForCategory', () => {
		describe('validator retrieval', () => {
			test('should return validator function for valid category', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();
				expect(typeof validator).toBe('function');
			});

			test('should return null for invalid category', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'nonexistent');
				expect(validator).toBeNull();
			});

			test('should return null for missing category', () => {
				const validator = getValidatorForCategory(defaultContactSchema, '');
				expect(validator).toBeNull();
			});

			test('different categories should return different validators', () => {
				const validator1 = getValidatorForCategory(defaultContactSchema, 'general');
				const validator2 = getValidatorForCategory(defaultContactSchema, 'support');
				expect(validator1).not.toBe(validator2);
			});
		});

		describe('validator validation', () => {
			test('validator should accept valid data', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();

				const result = validator!({
					name: 'John Doe',
					email: 'john@example.com',
					subject: 'Test',
					message: 'Test message'
				});

				expect(result.valid).toBe(true);
				expect(result.errors).toEqual([]);
			});

			test('validator should reject missing required fields', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();

				const result = validator!({
					subject: 'Test'
				});

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			test('validator should use field labels in error messages', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();

				const result = validator!({});

				expect(result.valid).toBe(false);
				expect(result.errors.some((err) => err.includes('Name'))).toBe(true);
				expect(result.errors.some((err) => err.includes('Email'))).toBe(true);
			});

			test('validator should check all category fields', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'business');
				expect(validator).not.toBeNull();

				const result = validator!({});

				expect(result.valid).toBe(false);
				// Should have errors for name, email, and message (required fields in business category)
				expect(result.errors.length).toBeGreaterThan(0);
			});

			test('validator should reject whitespace-only values', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();

				const result = validator!({
					name: '   ',
					email: '  ',
					message: '  '
				});

				expect(result.valid).toBe(false);
				expect(result.errors.length).toBeGreaterThan(0);
			});

			test('validator should produce multiple errors for multiple missing fields', () => {
				const validator = getValidatorForCategory(defaultContactSchema, 'general');
				expect(validator).not.toBeNull();

				const result = validator!({});

				expect(result.valid).toBe(false);
				// General category requires name, email, and message
				expect(result.errors.length).toBeGreaterThanOrEqual(3);
			});
		});

		describe('enhanced config handling', () => {
			test('should handle EnhancedContactFormConfig by delegating to method', () => {
				const enhanced = initContactFormConfig({});
				const validator = getValidatorForCategory(enhanced, 'general');

				expect(validator).not.toBeNull();
				expect(typeof validator).toBe('function');
			});

			test('should handle plain ContactSchema by creating validator', () => {
				const plain: ContactSchema = {
					...defaultContactSchema
				};

				const validator = getValidatorForCategory(plain, 'general');
				expect(validator).not.toBeNull();
				expect(typeof validator).toBe('function');
			});

			test('enhanced config validator should work correctly', () => {
				const enhanced = initContactFormConfig({});
				const validator = getValidatorForCategory(enhanced, 'general');

				const result = validator!({
					name: 'Test',
					email: 'test@example.com',
					message: 'Test message'
				});

				expect(result.valid).toBe(true);
			});
		});
	});

	describe('initContactFormConfig', () => {
		describe('basic initialization', () => {
			test('should merge user config with defaults', () => {
				const userConfig = {
					appName: 'Custom App'
				};

				const result = initContactFormConfig(userConfig);
				expect(result.appName).toBe('Custom App');
				expect(result.categories).toBeDefined();
				expect(result.fieldConfigs).toBeDefined();
			});

			test('should return EnhancedContactFormConfig', () => {
				const result = initContactFormConfig({});

				expect(result).toHaveProperty('getValidatorForCategory');
				expect(result).toHaveProperty('formDataParser');
				expect(result).toHaveProperty('createSubmissionHandler');
				expect(result).toHaveProperty('validationResult');
			});

			test('should preserve user-provided values', () => {
				const userConfig = {
					appName: 'Test App',
					ui: {
						submitButtonText: 'Custom Submit'
					}
				};

				const result = initContactFormConfig(userConfig);
				expect(result.appName).toBe('Test App');
				expect(result.ui.submitButtonText).toBe('Custom Submit');
			});

			test('should add missing defaults', () => {
				const userConfig = {
					appName: 'Test App'
				};

				const result = initContactFormConfig(userConfig);
				expect(result.categories).toBeDefined();
				expect(result.fieldConfigs).toBeDefined();
				expect(result.ui).toBeDefined();
				expect(result.validation).toBeDefined();
				expect(result.routes).toBeDefined();
			});

			test('should use secureDeepMerge for merging', () => {
				const userConfig = {
					ui: {
						theme: 'dark' as const
					}
				};

				const result = initContactFormConfig(userConfig);
				// Should merge ui config, not replace it
				expect(result.ui.theme).toBe('dark');
				expect(result.ui.submitButtonText).toBe(defaultUiConfig.submitButtonText);
			});
		});

		describe('validation on init', () => {
			test('should run validation on merged config', () => {
				// Clear mocks to ensure clean state
				vi.clearAllMocks();

				// Create a config with a category that references a non-existent field
				const userConfig = {
					categories: {
						test: {
							label: 'Test',
							fields: ['nonExistentField']
						}
					}
				};

				initContactFormConfig(userConfig);
				// Validation should be run and logger should be called for missing field config
				expect(mockWarn).toHaveBeenCalled();
			});

			test('should store validationResult property', () => {
				const result = initContactFormConfig({});
				expect(result.validationResult).toBeDefined();
				expect(result.validationResult).toHaveProperty('valid');
				expect(result.validationResult).toHaveProperty('errors');
			});

			test('should log warnings for invalid config but not throw', () => {
				// Clear mocks to ensure clean state
				vi.clearAllMocks();

				// Create an invalid config with missing label
				const invalidConfig = {
					categories: {
						bad: {
							label: '',
							fields: ['name']
						}
					}
				};

				expect(() => initContactFormConfig(invalidConfig)).not.toThrow();
				expect(mockWarn).toHaveBeenCalled();
			});

			test('valid config should have validationResult.valid=true', () => {
				const result = initContactFormConfig({});
				expect(result.validationResult.valid).toBe(true);
			});
		});

		describe('getValidatorForCategory method', () => {
			test('method should exist and be function', () => {
				const result = initContactFormConfig({});
				expect(result.getValidatorForCategory).toBeDefined();
				expect(typeof result.getValidatorForCategory).toBe('function');
			});

			test('should return validator for valid category', () => {
				const result = initContactFormConfig({});
				const validator = result.getValidatorForCategory('general');
				expect(validator).not.toBeNull();
				expect(typeof validator).toBe('function');
			});

			test('should return null for invalid category', () => {
				const result = initContactFormConfig({});
				const validator = result.getValidatorForCategory('nonexistent');
				expect(validator).toBeNull();
			});

			test('should use getValidatorForCategory function internally', () => {
				const result = initContactFormConfig({});
				const validator = result.getValidatorForCategory('general');
				expect(validator).not.toBeNull();

				const validationResult = validator!({
					name: 'Test',
					email: 'test@example.com',
					message: 'Message'
				});

				expect(validationResult.valid).toBe(true);
			});
		});

		describe('formDataParser method', () => {
			// Helper to create iterable FormData-like object
			const createMockFormData = (data: Record<string, string>) => {
				const entries = Object.entries(data);
				return {
					*[Symbol.iterator]() {
						for (const entry of entries) {
							yield entry;
						}
					}
				} as any;
			};

			test('method should exist and be async function', () => {
				const result = initContactFormConfig({});
				expect(result.formDataParser).toBeDefined();
				expect(typeof result.formDataParser).toBe('function');
				expect(result.formDataParser.constructor.name).toBe('AsyncFunction');
			});

			test('should convert FormData to plain object', async () => {
				const result = initContactFormConfig({});
				const formData = createMockFormData({
					name: 'Test',
					email: 'test@example.com',
					message: 'Test message'
				});

				const parsed = await result.formDataParser(formData, 'general');
				expect(parsed.data).toBeDefined();
				expect(parsed.data.name).toBe('Test');
			});

			test('should run validation on data', async () => {
				const result = initContactFormConfig({});
				const formData = createMockFormData({});

				const parsed = await result.formDataParser(formData, 'general');
				expect(parsed.errors).toBeDefined();
			});

			test('should return {data, errors} object', async () => {
				const result = initContactFormConfig({});
				const formData = createMockFormData({
					name: 'Test',
					email: 'test@example.com',
					message: 'Test message'
				});

				const parsed = await result.formDataParser(formData, 'general');
				expect(parsed).toHaveProperty('data');
				expect(parsed).toHaveProperty('errors');
			});

			test('errors should be empty for valid data', async () => {
				const result = initContactFormConfig({});
				const formData = createMockFormData({
					name: 'Test',
					email: 'test@example.com',
					message: 'Test message'
				});

				const parsed = await result.formDataParser(formData, 'general');
				expect(Object.keys(parsed.errors).length).toBe(0);
			});

			test('errors should contain messages for invalid data', async () => {
				const result = initContactFormConfig({});
				const formData = createMockFormData({});

				const parsed = await result.formDataParser(formData, 'general');
				expect(Object.keys(parsed.errors).length).toBeGreaterThan(0);
			});
		});

		describe('createSubmissionHandler method', () => {
			test('method should exist and be async function', () => {
				const result = initContactFormConfig({});
				expect(result.createSubmissionHandler).toBeDefined();
				expect(typeof result.createSubmissionHandler).toBe('function');
				expect(result.createSubmissionHandler.constructor.name).toBe('AsyncFunction');
			});

			test('should return submission handler function', async () => {
				const result = initContactFormConfig({});
				const handler = await result.createSubmissionHandler();
				expect(typeof handler).toBe('function');
			});

			test('handler should accept (data, categorySlug)', async () => {
				const result = initContactFormConfig({});
				const handler = await result.createSubmissionHandler();
				expect(handler.length).toBe(2);
			});

			test('handler should return SubmissionResult with success', async () => {
				const result = initContactFormConfig({});
				const handler = await result.createSubmissionHandler();

				const submission = await handler({ name: 'Test' } as any, 'general');
				expect(submission).toHaveProperty('success');
				expect(submission.success).toBe(true);
			});

			test('handler should log submission info', async () => {
				const result = initContactFormConfig({});
				const handler = await result.createSubmissionHandler();

				await handler({ name: 'Test' } as any, 'general');
				expect(mockInfo).toHaveBeenCalled();
			});

			test('handler should be async', async () => {
				const result = initContactFormConfig({});
				const handler = await result.createSubmissionHandler();

				const submission = handler({ name: 'Test' } as any, 'general');
				expect(submission).toBeInstanceOf(Promise);
			});
		});

		describe('integration', () => {
			test('all methods should work together', async () => {
				// Helper to create iterable FormData-like object
				const createMockFormData = (data: Record<string, string>) => {
					const entries = Object.entries(data);
					return {
						*[Symbol.iterator]() {
							for (const entry of entries) {
								yield entry;
							}
						}
					} as any;
				};

				const result = initContactFormConfig({
					appName: 'Integration Test'
				});

				const validator = result.getValidatorForCategory('general');
				expect(validator).not.toBeNull();

				const formData = createMockFormData({
					name: 'Test',
					email: 'test@example.com',
					message: 'Test message'
				});

				const parsed = await result.formDataParser(formData, 'general');
				expect(Object.keys(parsed.errors).length).toBe(0);

				const plainData = { name: 'Test', email: 'test@example.com', message: 'Test message' };
				const handler = await result.createSubmissionHandler();
				const submission = await handler(plainData as any, 'general');
				expect(submission.success).toBe(true);
			});

			test('deep merge should work correctly', () => {
				const result = initContactFormConfig({
					ui: {
						theme: 'dark' as const,
						submitButtonText: 'Custom'
					}
				});

				expect(result.ui.theme).toBe('dark');
				expect(result.ui.submitButtonText).toBe('Custom');
				expect(result.ui.labelPosition).toBe(defaultUiConfig.labelPosition);
			});

			test('custom categories should override defaults', () => {
				const result = initContactFormConfig({
					categories: {
						custom: {
							label: 'Custom Category',
							fields: ['name', 'email']
						}
					}
				});

				expect(result.categories).toHaveProperty('custom');
				expect(result.categories.custom.label).toBe('Custom Category');
			});

			test('partial configs should complete with defaults', () => {
				const result = initContactFormConfig({
					appName: 'Partial'
				});

				expect(result.categories).toBeDefined();
				expect(result.fieldConfigs).toBeDefined();
				expect(result.ui).toBeDefined();
				expect(result.validation).toBeDefined();
				expect(result.routes).toBeDefined();
				expect(result.recaptcha).toBeDefined();
				expect(result.storage).toBeDefined();
			});
		});
	});

	describe('integration tests', () => {
		test('full workflow: init → validate → getValidator → validate data', async () => {
			const config = initContactFormConfig({
				appName: 'Integration Test App'
			});

			expect(config.validationResult.valid).toBe(true);

			const validator = config.getValidatorForCategory('general');
			expect(validator).not.toBeNull();

			const validData = {
				name: 'John Doe',
				email: 'john@example.com',
				message: 'Test message'
			};

			const result = validator!(validData);
			expect(result.valid).toBe(true);
		});

		test('custom category configuration workflow', () => {
			const config = initContactFormConfig({
				categories: {
					custom: {
						label: 'Custom Form',
						icon: 'CustomIcon',
						fields: ['name', 'email', 'company']
					}
				},
				fieldConfigs: {
					name: { type: 'text', label: 'Name', required: true },
					email: { type: 'email', label: 'Email', required: true },
					company: { type: 'text', label: 'Company', required: true }
				}
			});

			expect(config.validationResult.valid).toBe(true);

			const validator = config.getValidatorForCategory('custom');
			expect(validator).not.toBeNull();

			const result = validator!({
				name: 'Test',
				email: 'test@example.com',
				company: 'Test Corp'
			});

			expect(result.valid).toBe(true);
		});

		test('multiple categories with different field requirements', () => {
			const config = initContactFormConfig({
				categories: {
					basic: {
						label: 'Basic',
						fields: ['name']
					},
					advanced: {
						label: 'Advanced',
						fields: ['name', 'email', 'phone']
					}
				},
				fieldConfigs: {
					name: { type: 'text', label: 'Name', required: true },
					email: { type: 'email', label: 'Email', required: true },
					phone: { type: 'tel', label: 'Phone', required: true }
				}
			});

			const basicValidator = config.getValidatorForCategory('basic');
			const advancedValidator = config.getValidatorForCategory('advanced');

			const data = { name: 'Test' };

			expect(basicValidator!(data).valid).toBe(true);
			expect(advancedValidator!(data).valid).toBe(false);
		});

		test('config validation catches all error types', () => {
			const invalidConfig: Partial<ContactSchema> = {
				categories: {
					bad1: { label: '', fields: [] },
					bad2: { label: 'Bad2', fields: ['missingField'] }
				},
				fieldConfigs: {},
				recaptcha: {
					enabled: true,
					provider: 'google-v3',
					siteKey: '',
					minScore: 0.5
				}
			};

			const result = validateContactConfig(invalidConfig);
			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThanOrEqual(4);
		});

		test('validator catches all field validation errors', () => {
			const config = initContactFormConfig({
				categories: {
					test: {
						label: 'Test',
						fields: ['name', 'email', 'phone']
					}
				},
				fieldConfigs: {
					name: { type: 'text', label: 'Name', required: true },
					email: { type: 'email', label: 'Email', required: true },
					phone: { type: 'tel', label: 'Phone', required: true }
				}
			});

			const validator = config.getValidatorForCategory('test');
			const result = validator!({});

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBe(3);
		});

		test('formDataParser full workflow', async () => {
			// Helper to create iterable FormData-like object
			const createMockFormData = (data: Record<string, string>) => {
				const entries = Object.entries(data);
				return {
					*[Symbol.iterator]() {
						for (const entry of entries) {
							yield entry;
						}
					}
				} as any;
			};

			const config = initContactFormConfig({});
			const formData = createMockFormData({
				name: 'Test User',
				email: 'test@example.com',
				message: 'This is a test'
			});

			const parsed = await config.formDataParser(formData, 'general');

			expect(parsed.data).toBeDefined();
			expect(parsed.data.name).toBe('Test User');
			expect(Object.keys(parsed.errors).length).toBe(0);
		});

		test('submission handler workflow', async () => {
			const config = initContactFormConfig({
				appName: 'Test App'
			});

			const handler = await config.createSubmissionHandler();
			const data = {
				name: 'Test',
				email: 'test@example.com',
				message: 'Test'
			} as any;

			const result = await handler(data, 'general');

			expect(result.success).toBe(true);
			expect(mockInfo).toHaveBeenCalled();
		});

		test('deep merge with nested overrides', () => {
			const config = initContactFormConfig({
				validation: {
					validateOnBlur: false,
					showErrorsOnSubmit: false
				},
				routes: {
					apiPath: '/custom/api'
				}
			});

			expect(config.validation.validateOnBlur).toBe(false);
			expect(config.validation.showErrorsOnSubmit).toBe(false);
			expect(config.validation.validateOnChange).toBe(defaultContactSchema.validation.validateOnChange);
			expect(config.routes.apiPath).toBe('/custom/api');
			expect(config.routes.basePath).toBe(defaultContactSchema.routes.basePath);
		});

		test('real-world use case: support form with file upload', () => {
			const config = initContactFormConfig({
				appName: 'Support Portal',
				categories: {
					support: {
						label: 'Technical Support',
						icon: 'HelpCircle',
						fields: ['name', 'email', 'operatingSystem', 'browser', 'message', 'attachments']
					}
				}
			});

			const validator = config.getValidatorForCategory('support');
			const data = {
				name: 'User',
				email: 'user@example.com',
				operatingSystem: 'Windows 11',
				browser: 'Chrome',
				message: 'I need help'
			};

			const result = validator!(data);
			expect(result.valid).toBe(true);
		});

		test('real-world use case: business inquiry with reCAPTCHA', () => {
			const config = initContactFormConfig({
				appName: 'Business Site',
				recaptcha: {
					enabled: true,
					provider: 'google-v3',
					siteKey: 'test-site-key',
					minScore: 0.7
				}
			});

			expect(config.validationResult.valid).toBe(true);
			expect(config.recaptcha.enabled).toBe(true);
			expect(config.recaptcha.siteKey).toBe('test-site-key');
		});
	});

	describe('edge cases', () => {
		test('should handle empty config object', () => {
			const result = initContactFormConfig({});
			expect(result).toBeDefined();
			expect(result.validationResult.valid).toBe(true);
		});

		test('should handle config with only appName', () => {
			const result = initContactFormConfig({ appName: 'Test' });
			expect(result.appName).toBe('Test');
			expect(result.categories).toBeDefined();
			expect(result.fieldConfigs).toBeDefined();
		});

		test('should handle very large config (many categories/fields)', () => {
			const categories: Record<string, ExtendedCategoryConfig> = {};
			const fieldConfigs: Record<string, ExtendedFieldConfig> = {};

			for (let i = 0; i < 50; i++) {
				const fieldName = `field${i}`;
				fieldConfigs[fieldName] = {
					type: 'text',
					label: `Field ${i}`,
					required: false
				};
			}

			for (let i = 0; i < 20; i++) {
				categories[`category${i}`] = {
					label: `Category ${i}`,
					fields: ['field0', 'field1', 'field2']
				};
			}

			const result = initContactFormConfig({
				categories,
				fieldConfigs
			});

			expect(result.validationResult.valid).toBe(true);
			expect(Object.keys(result.categories).length).toBeGreaterThanOrEqual(20);
		});

		test('should handle null values in config', () => {
			const config = {
				appName: 'Test',
				ui: {
					theme: null as any
				}
			};

			const result = initContactFormConfig(config);
			expect(result).toBeDefined();
		});

		test('should handle undefined values in config', () => {
			const config = {
				appName: 'Test',
				ui: {
					theme: undefined as any
				}
			};

			const result = initContactFormConfig(config);
			expect(result).toBeDefined();
		});

		test('should handle special characters in field names', () => {
			const config = initContactFormConfig({
				categories: {
					test: {
						label: 'Test',
						fields: ['field-with-dash', 'field_with_underscore', 'field.with.dot']
					}
				},
				fieldConfigs: {
					'field-with-dash': { type: 'text', label: 'Dash', required: false },
					field_with_underscore: { type: 'text', label: 'Underscore', required: false },
					'field.with.dot': { type: 'text', label: 'Dot', required: false }
				}
			});

			expect(config.validationResult.valid).toBe(true);
		});

		test('should preserve unknown properties in config', () => {
			const config = initContactFormConfig({
				appName: 'Test',
				customProperty: 'custom value' as any
			});

			expect((config as any).customProperty).toBe('custom value');
		});

		test('validator should handle empty data object', () => {
			const validator = getValidatorForCategory(defaultContactSchema, 'general');
			const result = validator!({});

			expect(result.valid).toBe(false);
			expect(result.errors.length).toBeGreaterThan(0);
		});

		test('validator should handle data with extra fields', () => {
			const validator = getValidatorForCategory(defaultContactSchema, 'general');
			const result = validator!({
				name: 'Test',
				email: 'test@example.com',
				message: 'Message',
				extraField: 'extra value'
			});

			expect(result.valid).toBe(true);
		});

		test('should handle config with no field configs', () => {
			const config: Partial<ContactSchema> = {
				categories: {
					test: {
						label: 'Test',
						fields: ['name']
					}
				}
			};

			const result = validateContactConfig(config);
			expect(result.valid).toBe(false);
		});
	});
});
