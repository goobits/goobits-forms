/**
 * Utilities for @goobits/forms
 *
 * This module serves as the main entry point for form utilities,
 * providing configuration helpers and re-exporting all utility functions
 * for convenient access throughout the forms library.
 *
 * @module utils
 * @example
 * ```typescript
 * import { sanitizeInput, DEBOUNCE_DELAY, handleError } from '@goobits/forms/utils';
 *
 * const cleanValue = sanitizeInput(userInput);
 * const debouncedSave = debounce(saveForm, DEBOUNCE_DELAY);
 * ```
 */

// Re-export all utility modules for convenient access
export * from './sanitizeInput.ts';
export * from './constants.ts';
export * from './debounce.ts';
export * from './errorHandler.ts';
export * from './messages.ts';

/**
 * Configuration interfaces for type safety
 */

/**
 * Field configuration interface
 */
export interface FieldConfig {
	/** Whether the field is required */
	required?: boolean;
	/** Validation rules for the field */
	validation?: {
		/** Minimum length for text fields */
		minLength?: number;
		/** Maximum length for text fields */
		maxLength?: number;
		/** Regular expression pattern */
		pattern?: string;
		/** Custom validation function */
		custom?: (value: unknown) => boolean | string;
	};
	/** Default value for the field */
	defaultValue?: unknown;
	/** Field label for display */
	label?: string;
	/** Placeholder text */
	placeholder?: string;
}

/**
 * Category configuration interface
 */
export interface CategoryConfig {
	/** List of field names included in this category */
	fields: string[];
	/** Category display label */
	label?: string;
	/** Category description */
	description?: string;
}

/**
 * Main configuration interface
 */
export interface Config {
	/** Field-specific configurations */
	fieldConfigs: Record<string, FieldConfig>;
	/** Category configurations */
	categories: Record<string, CategoryConfig>;
}

/**
 * Get field configuration for a specific field
 *
 * @description Retrieves the configuration object for a given field name,
 * providing defaults if no specific configuration exists.
 *
 * @param config - Configuration object containing field definitions
 * @param fieldName - Name of the field to get configuration for
 * @returns Field configuration object with validation rules and properties
 *
 * @example
 * ```typescript
 * const config = {
 *   fieldConfigs: {
 *     email: { required: true, validation: { pattern: /\S+@\S+\.\S+/ } }
 *   }
 * };
 * const emailConfig = getFieldConfig(config, 'email');
 * // Returns: { required: true, validation: { pattern: /\S+@\S+\.\S+/ } }
 * ```
 */
export function getFieldConfig(config: Config, fieldName: string): FieldConfig {
	return config.fieldConfigs[fieldName] || {};
}

/**
 * Get category configuration
 *
 * @description Retrieves the configuration for a specific category,
 * falling back to the general category if the requested category doesn't exist.
 *
 * @param config - Configuration object containing category definitions
 * @param category - Name of the category to get configuration for
 * @returns Category configuration object with field lists and metadata
 *
 * @example
 * ```typescript
 * const config = {
 *   categories: {
 *     contact: { fields: ['name', 'email', 'message'] },
 *     general: { fields: ['name', 'email'] }
 *   }
 * };
 * const contactConfig = getCategoryConfig(config, 'contact');
 * // Returns: { fields: ['name', 'email', 'message'] }
 * ```
 */
export function getCategoryConfig(config: Config, category: string): CategoryConfig {
	return config.categories[category] || config.categories.general;
}

/**
 * Check if a field is required in a category
 *
 * @description Determines whether a specific field is both included in a category
 * and marked as required in its field configuration.
 *
 * @param config - Configuration object containing field and category definitions
 * @param category - Name of the category to check within
 * @param fieldName - Name of the field to check requirement status for
 * @returns True if the field is required in the specified category
 *
 * @example
 * ```typescript
 * const config = {
 *   fieldConfigs: {
 *     email: { required: true },
 *     phone: { required: false }
 *   },
 *   categories: {
 *     contact: { fields: ['email', 'phone'] }
 *   }
 * };
 *
 * isFieldRequired(config, 'contact', 'email'); // true
 * isFieldRequired(config, 'contact', 'phone'); // false
 * isFieldRequired(config, 'contact', 'address'); // false (not in category)
 * ```
 */
export function isFieldRequired(config: Config, category: string, fieldName: string): boolean {
	const categoryConfig = getCategoryConfig(config, category);
	const fieldConfig = getFieldConfig(config, fieldName);

	return categoryConfig.fields.includes(fieldName) && fieldConfig.required === true;
}
