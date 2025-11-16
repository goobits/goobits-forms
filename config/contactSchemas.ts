/**
 * Contact form schema definitions and validation
 *
 * Provides standardized schemas for categorized contact forms
 * with validation and configuration utilities. This module includes
 * comprehensive field configurations, category definitions, and
 * validation functions for creating robust contact forms.
 */

import { secureDeepMerge } from './secureDeepMerge';
import { createLogger } from '../utils/logger';
import type {
	FieldConfig,
	CategoryConfig,
	// ContactFormConfig,
	// ValidationResult,
	SubmissionResult,
	FormData
} from './types';

const logger = createLogger('ContactSchemas');

/**
 * Extended field configuration with additional UI properties
 */
export interface ExtendedFieldConfig extends FieldConfig {
	/** Maximum character length for input */
	maxlength?: number;
	/** Number of rows for textarea */
	rows?: number;
	/** File input specific properties */
	multiple?: boolean;
	accept?: string;
	maxFiles?: number;
	maxSize?: number;
}

/**
 * Extended category configuration with icon support
 */
export interface ExtendedCategoryConfig extends CategoryConfig {
	/** Display label for the category */
	label: string;
	/** Icon identifier (e.g., FontAwesome class or icon name) */
	icon?: string;
}

/**
 * UI configuration for contact forms
 */
export interface UiConfig {
	/** Text for submit button */
	submitButtonText: string;
	/** Text for submit button while submitting */
	submittingButtonText: string;
	/** Whether to reset form after successful submission */
	resetAfterSubmit: boolean;
	/** Whether to show success message */
	showSuccessMessage: boolean;
	/** Duration to show success message in milliseconds */
	successMessageDuration: number;
	/** Theme variant */
	theme: 'light' | 'dark' | 'auto';
	/** Position of field labels */
	labelPosition: 'top' | 'left' | 'inline';
	/** Spacing between form fields */
	fieldSpacing: 'tight' | 'medium' | 'loose';
	/** Character used to indicate required fields */
	requiredIndicator: string;
	/** Whether to show required fields label */
	showRequiredLabel: boolean;
	/** Text for required fields label */
	requiredLabelText: string;
	/** Position of error messages */
	errorMessagePosition: 'above' | 'below' | 'inline';
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
	/** Validate fields on blur event */
	validateOnBlur: boolean;
	/** Validate fields on change event */
	validateOnChange: boolean;
	/** Show errors on field blur */
	showErrorsOnBlur: boolean;
	/** Show errors on form submission */
	showErrorsOnSubmit: boolean;
}

/**
 * Route configuration
 */
export interface RouteConfig {
	/** Base path for contact form */
	basePath: string;
	/** Success page path */
	successPath: string;
	/** API endpoint path */
	apiPath: string;
}

/**
 * reCAPTCHA configuration
 */
export interface RecaptchaConfig {
	/** Whether reCAPTCHA is enabled */
	enabled: boolean;
	/** reCAPTCHA provider */
	provider: 'google-v3' | 'google-v2' | 'hcaptcha';
	/** Site key for client-side */
	siteKey: string;
	/** Minimum score for v3 (0.0 to 1.0) */
	minScore: number;
}

/**
 * Storage configuration for form data persistence
 */
export interface StorageConfig {
	/** Whether local storage is enabled */
	enabled: boolean;
	/** Key for storing form data */
	storageKey: string;
	/** Expiry time in milliseconds */
	expiry: number;
	/** Fields to persist in storage */
	fields: string[];
}

/**
 * Complete contact schema configuration
 */
export interface ContactSchema {
	/** Application name */
	appName: string;
	/** Form categories */
	categories: Record<string, ExtendedCategoryConfig>;
	/** Field configurations */
	fieldConfigs: Record<string, ExtendedFieldConfig>;
	/** UI configuration */
	ui: UiConfig;
	/** Validation configuration */
	validation: ValidationConfig;
	/** Route configuration */
	routes: RouteConfig;
	/** reCAPTCHA configuration */
	recaptcha: RecaptchaConfig;
	/** Storage configuration */
	storage: StorageConfig;
}

/**
 * Validation error result
 */
export interface ValidationError {
	/** Whether validation passed */
	valid: boolean;
	/** Array of error messages */
	errors: string[];
}

/**
 * Form data validator function type
 */
type FormValidator = (data: FormData) => ValidationError | Promise<ValidationError>;

/**
 * Submission handler function type
 */
type SubmissionHandler = (data: FormData, categorySlug: string) => Promise<SubmissionResult>;

/**
 * Enhanced contact form configuration with methods
 */
export interface EnhancedContactFormConfig extends ContactSchema {
	/** Get validator for a specific category */
	getValidatorForCategory: (categorySlug: string) => FormValidator | null;
	/** Parse and validate form data */
	formDataParser: (
		formData: FormData,
		categorySlug: string
	) => Promise<{ data: FormData; errors: Record<string, string> }>;
	/** Create submission handler */
	createSubmissionHandler: (context?: any) => Promise<SubmissionHandler>;
	/** Validation result from initialization */
	validationResult: ValidationError;
}

/**
 * Default field configurations with comprehensive form field definitions
 *
 * @example
 * ```typescript
 * const nameField = defaultFieldConfigs.name;
 * // Returns: { type: "text", label: "Name", placeholder: "Your name", required: true, maxlength: 100 }
 * ```
 */
export const defaultFieldConfigs: Record<string, ExtendedFieldConfig> = {
	name: {
		type: 'text',
		label: 'Name',
		placeholder: 'Your name',
		required: true,
		maxlength: 100
	},
	email: {
		type: 'email',
		label: 'Email',
		placeholder: 'your@email.com',
		required: true,
		maxlength: 150
	},
	phone: {
		type: 'tel',
		label: 'Phone',
		placeholder: 'Your phone number (optional)',
		required: false,
		maxlength: 20
	},
	message: {
		type: 'textarea',
		label: 'Message',
		placeholder: 'Your message',
		required: true,
		maxlength: 2000,
		rows: 5
	},
	subject: {
		type: 'text',
		label: 'Subject',
		placeholder: 'Subject of your message',
		required: false,
		maxlength: 200
	},
	company: {
		type: 'text',
		label: 'Company',
		placeholder: 'Your company name',
		required: false,
		maxlength: 150
	},
	website: {
		type: 'url',
		label: 'Website',
		placeholder: 'https://yourwebsite.com',
		required: false,
		maxlength: 200
	},
	industry: {
		type: 'text',
		label: 'Industry',
		placeholder: 'Your industry',
		required: false,
		maxlength: 100
	},
	role: {
		type: 'text',
		label: 'Your Role',
		placeholder: 'Your position or role',
		required: false,
		maxlength: 100
	},
	operatingSystem: {
		type: 'text',
		label: 'Operating System',
		placeholder: 'e.g., Windows, macOS, Linux, iOS, Android',
		required: false,
		maxlength: 100
	},
	browser: {
		type: 'text',
		label: 'Browser',
		placeholder: 'e.g., Chrome, Firefox, Safari, Edge',
		required: false,
		maxlength: 100
	},
	browserVersion: {
		type: 'text',
		label: 'Browser Version',
		placeholder: 'e.g., 15.0',
		required: false,
		maxlength: 50
	},
	attachments: {
		type: 'file',
		label: 'Attachments',
		required: false,
		multiple: true,
		accept: 'image/*,.pdf,.doc,.docx,.txt',
		maxFiles: 3,
		maxSize: 5 * 1024 * 1024 // 5MB
	},
	coppa: {
		type: 'checkbox',
		label: 'I confirm I am over 13 years old or have parent/teacher permission',
		required: true
	},
	terms: {
		type: 'checkbox',
		label: 'I agree to the terms and conditions',
		required: true
	},
	privacy: {
		type: 'checkbox',
		label: 'I have read the privacy policy',
		required: true
	},
	marketing: {
		type: 'checkbox',
		label: 'I would like to receive updates and marketing emails',
		required: false
	}
};

/**
 * Default category configurations with predefined form categories
 *
 * @example
 * ```typescript
 * const supportCategory = defaultCategories.support;
 * // Returns: { label: "Technical Support", icon: "HelpCircle", fields: [...] }
 * ```
 */
export const defaultCategories: Record<string, ExtendedCategoryConfig> = {
	general: {
		label: 'General Inquiry',
		icon: 'MessageCircle',
		fields: ['name', 'email', 'subject', 'message', 'attachments']
	},
	support: {
		label: 'Technical Support',
		icon: 'HelpCircle',
		fields: ['name', 'email', 'operatingSystem', 'browser', 'message', 'attachments']
	},
	feedback: {
		label: 'Feedback',
		icon: 'ThumbsUp',
		fields: ['name', 'email', 'message']
	},
	business: {
		label: 'Business Inquiry',
		icon: 'Briefcase',
		fields: ['name', 'email', 'company', 'role', 'message']
	}
};

/**
 * Default UI configurations
 *
 * @example
 * ```typescript
 * const submitText = defaultUiConfig.submitButtonText; // "Send Message"
 * const theme = defaultUiConfig.theme; // "light"
 * ```
 */
export const defaultUiConfig: UiConfig = {
	submitButtonText: 'Send Message',
	submittingButtonText: 'Sending...',
	resetAfterSubmit: true,
	showSuccessMessage: true,
	successMessageDuration: 5000,
	theme: 'light',
	labelPosition: 'top',
	fieldSpacing: 'medium',
	requiredIndicator: '*',
	showRequiredLabel: true,
	requiredLabelText: 'Required fields are marked with *',
	errorMessagePosition: 'below'
};

/**
 * Default schema for contact form configurations
 *
 * @example
 * ```typescript
 * const schema = defaultContactSchema;
 * const customSchema = secureDeepMerge(schema, { appName: "My App" });
 * ```
 */
export const defaultContactSchema: ContactSchema = {
	appName: 'My App',
	categories: defaultCategories,
	fieldConfigs: defaultFieldConfigs,
	ui: defaultUiConfig,
	validation: {
		validateOnBlur: true,
		validateOnChange: false,
		showErrorsOnBlur: true,
		showErrorsOnSubmit: true
	},
	routes: {
		basePath: '/contact',
		successPath: '/contact/success',
		apiPath: '/api/contact'
	},
	recaptcha: {
		enabled: false,
		provider: 'google-v3',
		siteKey: '',
		minScore: 0.5
	},
	storage: {
		enabled: false,
		storageKey: 'contact_form_data',
		expiry: 24 * 60 * 60 * 1000, // 24 hours
		fields: ['name', 'email', 'company']
	}
};

/**
 * Validate a contact form configuration against the schema
 *
 * @param config - The configuration to validate
 * @returns Validation result with errors
 *
 * @example
 * ```typescript
 * const validation = validateContactConfig(myConfig);
 * if (!validation.valid) {
 *   console.error("Configuration errors:", validation.errors);
 * }
 * ```
 */
export function validateContactConfig(config: Partial<ContactSchema>): ValidationError {
	const errors: string[] = [];

	// Check that categories are defined
	if (!config.categories || Object.keys(config.categories).length === 0) {
		errors.push('No categories defined in contact form configuration');
	}

	// Check that each category has required properties
	if (config.categories) {
		Object.entries(config.categories).forEach(([key, category]) => {
			if (!category.label) {
				errors.push(`Category "${key}" is missing a label`);
			}
			if (!Array.isArray(category.fields) || category.fields.length === 0) {
				errors.push(`Category "${key}" has no fields defined`);
			}
		});
	}

	// Check field configurations for fields used in categories
	const usedFields = new Set<string>();
	if (config.categories) {
		Object.values(config.categories).forEach((category) => {
			if (Array.isArray(category.fields)) {
				category.fields.forEach((field) => usedFields.add(field));
			}
		});
	}

	// Check that every used field has a configuration
	usedFields.forEach((field) => {
		if (!config.fieldConfigs || !config.fieldConfigs[field]) {
			errors.push(`Field "${field}" is used in categories but has no configuration`);
		}
	});

	// Check recaptcha configuration if enabled
	if (config.recaptcha && config.recaptcha.enabled) {
		if (!config.recaptcha.siteKey) {
			errors.push('reCAPTCHA is enabled but no site key is provided');
		}
	}

	return {
		valid: errors.length === 0,
		errors
	};
}

/**
 * Get a validator function for a specific category
 *
 * @param config - The contact form configuration
 * @param categorySlug - The category slug to get validator for
 * @returns A validator function or null if category not found
 *
 * @example
 * ```typescript
 * const validator = getValidatorForCategory(config, "support");
 * if (validator) {
 *   const result = validator(formData);
 *   if (!result.valid) {
 *     console.error("Validation errors:", result.errors);
 *   }
 * }
 * ```
 */
export function getValidatorForCategory(
	config: ContactSchema | EnhancedContactFormConfig,
	categorySlug: string
): FormValidator | null {
	// Handle case where config is the result of initContactFormConfig
	if ('getValidatorForCategory' in config && typeof config.getValidatorForCategory === 'function') {
		return config.getValidatorForCategory(categorySlug);
	}

	const category = config.categories?.[categorySlug];
	if (!category) return null;

	// Return a validator function for this category
	return (data: FormData): ValidationError => {
		const errors: string[] = [];

		if (category.fields) {
			category.fields.forEach((fieldName) => {
				const fieldConfig = config.fieldConfigs?.[fieldName];
				if (fieldConfig && fieldConfig.required) {
					const value = data[fieldName];
					if (!value || (typeof value === 'string' && value.trim() === '')) {
						errors.push(`${fieldConfig.label || fieldName} is required`);
					}
				}
			});
		}

		return {
			valid: errors.length === 0,
			errors
		};
	};
}

/**
 * Initialize a contact form configuration with defaults and validation
 *
 * @param userConfig - User-provided configuration
 * @param options - Additional options for initialization
 * @returns Complete contact form configuration with enhanced methods
 *
 * @example
 * ```typescript
 * const config = initContactFormConfig({
 *   appName: "My Contact Form",
 *   categories: {
 *     custom: {
 *       label: "Custom Category",
 *       fields: ["name", "email", "message"]
 *     }
 *   }
 * });
 *
 * // Use the enhanced configuration
 * const validator = config.getValidatorForCategory("custom");
 * const submissionHandler = await config.createSubmissionHandler();
 * ```
 */
export function initContactFormConfig(
	userConfig: Partial<ContactSchema>
): EnhancedContactFormConfig {
	// Merge with defaults
	const config = secureDeepMerge(defaultContactSchema, userConfig);

	// Validate the configuration
	const validation = validateContactConfig(config);
	if (!validation.valid) {
		// Log warnings but don't throw errors
		logger.warn('Contact form configuration has issues:', validation.errors);
	}

	// Additional configuration functions and objects to return
	return {
		...config,

		// Get validator for a specific category
		getValidatorForCategory: (categorySlug: string): FormValidator | null => {
			return getValidatorForCategory(config, categorySlug);
		},

		// Parse form data with validation
		formDataParser: async (
			formData: FormData,
			categorySlug: string
		): Promise<{ data: FormData; errors: Record<string, string> }> => {
			// Convert FormData to plain object
			const data = Object.fromEntries(formData as any) as FormData;

			// Get validator for this category
			const validator = getValidatorForCategory(config, categorySlug);
			let validationResult: ValidationError = { valid: true, errors: [] };

			if (validator) {
				validationResult = await Promise.resolve(validator(data));
			}

			// Convert errors array to object with field names as keys
			const errors: Record<string, string> = {};
			validationResult.errors.forEach((error, index) => {
				// Simple approach: use error message as both key and value
				// In a real implementation, you'd want to map errors to specific fields
				errors[`error_${index}`] = error;
			});

			return { data, errors };
		},

		// Create a submission handler
		createSubmissionHandler: async (): Promise<SubmissionHandler> => {
			// Return a function that will handle form submissions
			return async (_data: FormData, categorySlug: string): Promise<SubmissionResult> => {
				// This function should be customized by the consumer
				// It could send emails, store in database, etc.
				logger.info('Form submission handler called', {
					category: categorySlug
				});

				// By default, just return success
				return { success: true };
			};
		},

		// Expose validation result
		validationResult: validation
	};
}
