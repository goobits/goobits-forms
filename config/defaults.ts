/**
 * Default configuration for @goobits/contactform
 *
 * This module provides comprehensive default configurations for contact forms,
 * including field definitions, categories, validation rules, and UI settings.
 */

import type {
	MessageObject,
	FieldConfig,
	CategoryConfig,
	ContactFormConfig,
	FileSettings
} from './types';

/**
 * Message function type for dynamic messages with parameters
 */
type MessageFunction = (...args: any[]) => string;

/**
 * Error message configuration with both static and dynamic messages
 */
export interface ErrorMessageConfig extends MessageObject {
	required: MessageFunction;
	invalid: MessageFunction;
	select: MessageFunction;
	fileSize: string;
	fileType: string;
	maxFiles: string;
	name: string;
	email: string;
	message: string;
	coppa: string;
	phone: string;
	preferredDate: string;
	preferredTime: string;
	browser: string;
	browserVersion: string;
	operatingSystem: string;
	company: string;
	businessRole: string;
	institution: string;
	educationRole: string;
	featureArea: string;
	recaptchaInit: string;
	recaptchaVerification: string;
	recaptchaMissing: string;
}


/**
 * reCAPTCHA configuration
 */
export interface RecaptchaConfig {
	/** Whether reCAPTCHA is enabled */
	enabled: boolean;
	/** reCAPTCHA provider type */
	provider: 'google-v3' | 'google-v2' | 'hcaptcha';
	/** Public site key */
	siteKey: string;
	/** Secret key (server-side only) */
	secretKey: string;
	/** Minimum score for v3 (0.0 to 1.0) */
	minScore: number;
	/** Cache timeout in milliseconds */
	cacheTimeout: number;
}

/**
 * API configuration
 */
export interface ApiConfig {
	/** API endpoint URL */
	endpoint: string;
	/** Request timeout in milliseconds */
	timeout: number;
	/** Number of retry attempts */
	retries: number;
}

/**
 * UI configuration
 */
export interface UiConfig {
	/** Show success message after submission */
	showSuccessMessage: boolean;
	/** Duration to show success message in milliseconds */
	successMessageDuration: number;
	/** Show field-level error messages */
	showFieldErrors: boolean;
	/** Focus first field with error */
	focusFirstError: boolean;
	/** Scroll to first error field */
	scrollToError: boolean;
	/** Submit button text */
	submitButtonText: string;
	/** Submit button text while submitting */
	submittingButtonText: string;
	/** Reset form after successful submission */
	resetAfterSubmit: boolean;
}

/**
 * Internationalization (i18n) configuration
 */
export interface I18nConfig {
	/** Whether i18n is enabled */
	enabled: boolean;
	/** Array of supported language codes */
	supportedLanguages: string[];
	/** Default language code */
	defaultLanguage: string;
	/** Include language code in URL */
	includeLanguageInURL: boolean;
	/** Auto-detect user language */
	autoDetectLanguage: boolean;
	/** Order for language detection */
	languageDetectionOrder: ('url' | 'sessionStorage' | 'browser')[];
	/** Storage key for persisted language */
	persistLanguageKey: string;
}

/**
 * Default error messages for form validation
 *
 * @example
 * ```typescript
 * const errorMsg = defaultErrorMessages.required("email");
 * // Returns: "Please provide your email"
 * ```
 */
export const defaultErrorMessages: ErrorMessageConfig = {
	// Common validation errors
	required: (field: string) => `Please provide your ${field}`,
	invalid: (field: string) => `Please provide a valid ${field}`,
	select: (field: string) => `Please select ${field}`,

	// File-related errors
	fileSize: 'File size must be less than 5MB',
	fileType: 'Only .jpg, .jpeg, .png, .webp and .gif files are accepted',
	maxFiles: 'Maximum 3 images allowed',

	// Specific field error messages
	name: 'Please provide your name',
	email: 'Please enter a valid email address',
	message: 'Please share your message with us',
	coppa: "Please confirm you're over 13 or have parent/teacher permission",
	phone: 'Please provide a contact phone number',
	preferredDate: 'Please select your preferred date',
	preferredTime: 'Please select your preferred time',

	// Form-specific field errors
	browser: "Please tell us which browser you're using",
	browserVersion: 'Please tell us your browser version',
	operatingSystem: "Please tell us which operating system you're using",
	company: 'Please provide your company name',
	businessRole: 'Please tell us your role in the company',
	institution: 'Please provide your institution name',
	educationRole: 'Please tell us your role in education',
	featureArea: "Please tell us which feature area you're referring to",

	// reCAPTCHA specific errors
	recaptchaInit:
		"We're having trouble with our security check. Please refresh the page and try again.",
	recaptchaVerification: 'Security verification failed. Please try submitting again.',
	recaptchaMissing:
		'Security verification incomplete. Please ensure JavaScript is enabled and try again.'
};

/**
 * Default file upload settings
 *
 * @example
 * ```typescript
 * const maxSize = defaultFileSettings.maxFileSize; // 5MB in bytes
 * const isValidType = defaultFileSettings.acceptedImageTypes.includes("image/jpeg");
 * ```
 */
export const defaultFileSettings: FileSettings = {
	maxFileSize: 5 * 1024 * 1024, // 5MB
	acceptedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
};

/**
 * Default form categories with field configurations
 *
 * @example
 * ```typescript
 * const generalFields = defaultCategories.general.fields;
 * // Returns: ["name", "email", "message", "attachments", "coppa"]
 * ```
 */
export const defaultCategories: Record<string, CategoryConfig> = {
	general: {
		label: 'General Inquiry',
		icon: 'fa fa-envelope',
		fields: ['name', 'email', 'message', 'attachments', 'coppa']
	},
	support: {
		label: 'Support Request',
		icon: 'fa fa-question-circle',
		fields: [
			'name',
			'email',
			'message',
			'browser',
			'browserVersion',
			'operatingSystem',
			'attachments',
			'coppa'
		]
	},
	feedback: {
		label: 'Feedback',
		icon: 'fa fa-comment',
		fields: ['name', 'email', 'message', 'attachments', 'coppa']
	},
	booking: {
		label: 'Book an Appointment',
		icon: 'fa fa-calendar',
		fields: ['name', 'email', 'phone', 'preferredDate', 'preferredTime', 'message', 'coppa']
	},
	business: {
		label: 'Business Inquiry',
		icon: 'fa fa-briefcase',
		fields: ['name', 'email', 'company', 'businessRole', 'message', 'coppa']
	}
};

/**
 * Default field configurations for form inputs
 *
 * @example
 * ```typescript
 * const nameConfig = defaultFieldConfigs.name;
 * // Returns: { type: "text", label: "Name", placeholder: "Your name", ... }
 * ```
 */
export const defaultFieldConfigs: Record<string, FieldConfig> = {
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
		maxlength: 254
	},
	message: {
		type: 'textarea',
		label: 'Message',
		placeholder: 'Tell us more...',
		required: true,
		rows: 5,
		maxlength: 5000
	},
	phone: {
		type: 'tel',
		label: 'Phone',
		placeholder: '+1 (555) 123-4567',
		required: true
	},
	company: {
		type: 'text',
		label: 'Company',
		placeholder: 'Your company name',
		required: true
	},
	businessRole: {
		type: 'text',
		label: 'Role',
		placeholder: 'Your role',
		required: true
	},
	preferredDate: {
		type: 'date',
		label: 'Preferred Date',
		required: true
	},
	preferredTime: {
		type: 'time',
		label: 'Preferred Time',
		required: true
	},
	browser: {
		type: 'text',
		label: 'Browser',
		placeholder: 'Chrome, Firefox, Safari, etc.',
		required: true
	},
	browserVersion: {
		type: 'text',
		label: 'Browser Version',
		placeholder: 'e.g., 91.0',
		required: true
	},
	operatingSystem: {
		type: 'text',
		label: 'Operating System',
		placeholder: 'Windows 10, macOS, etc.',
		required: true
	},
	coppa: {
		type: 'checkbox',
		label: 'I confirm I am over 13 years old or have parent/teacher permission',
		required: true
	},
	attachments: {
		type: 'file',
		label: 'Add Images (Optional)',
		accept: 'image/jpeg,image/jpg,image/png,image/webp,image/gif',
		maxFiles: 3,
		maxSize: 5 * 1024 * 1024, // 5MB
		required: false
	}
};

/**
 * Default reCAPTCHA configuration
 *
 * @example
 * ```typescript
 * const config = { ...defaultRecaptchaConfig, enabled: true, siteKey: "your-key" };
 * ```
 */
export const defaultRecaptchaConfig: RecaptchaConfig = {
	enabled: false,
	provider: 'google-v3',
	siteKey: '',
	secretKey: '',
	minScore: 0.5,
	cacheTimeout: 110000
};

/**
 * Default API configuration
 *
 * @example
 * ```typescript
 * const apiUrl = defaultApiConfig.endpoint; // "/api/contact"
 * const timeout = defaultApiConfig.timeout; // 30000ms
 * ```
 */
export const defaultApiConfig: ApiConfig = {
	endpoint: '/api/contact',
	timeout: 30000,
	retries: 1
};

/**
 * Default UI configuration
 *
 * @example
 * ```typescript
 * const submitText = defaultUiConfig.submitButtonText; // "Send Message"
 * const showSuccess = defaultUiConfig.showSuccessMessage; // true
 * ```
 */
export const defaultUiConfig: UiConfig = {
	showSuccessMessage: true,
	successMessageDuration: 5000,
	showFieldErrors: true,
	focusFirstError: true,
	scrollToError: true,
	submitButtonText: 'Send Message',
	submittingButtonText: 'Sending...',
	resetAfterSubmit: true
};

/**
 * Default internationalization configuration
 *
 * @example
 * ```typescript
 * const isI18nEnabled = defaultI18nConfig.enabled; // false
 * const defaultLang = defaultI18nConfig.defaultLanguage; // "en"
 * ```
 */
export const defaultI18nConfig: I18nConfig = {
	enabled: false,
	supportedLanguages: ['en'],
	defaultLanguage: 'en',
	includeLanguageInURL: false,
	autoDetectLanguage: false,
	languageDetectionOrder: ['url', 'sessionStorage', 'browser'],
	persistLanguageKey: 'contactform-lang'
};

/**
 * Complete default configuration object
 *
 * This is the master configuration that combines all default settings
 * and can be used as a base for creating custom contact form configurations.
 *
 * @example
 * ```typescript
 * import { defaultConfig } from "./defaults";
 * import { secureDeepMerge } from "./secureDeepMerge";
 *
 * const customConfig = secureDeepMerge(defaultConfig, {
 *   appName: "My App",
 *   ui: { submitButtonText: "Submit Now" }
 * });
 * ```
 */
export const defaultConfig: Partial<ContactFormConfig> = {
	appName: 'ContactForm',
	formUri: '/contact',
	errorMessages: defaultErrorMessages,
	fileSettings: defaultFileSettings,
	categories: defaultCategories,
	fieldConfigs: defaultFieldConfigs,
	// Note: These are extended configurations not in the base ContactFormConfig interface
	recaptcha: defaultRecaptchaConfig,
	api: defaultApiConfig,
	ui: defaultUiConfig,
	i18n: defaultI18nConfig
} as const;
