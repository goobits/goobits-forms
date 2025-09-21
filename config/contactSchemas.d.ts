/**
 * Contact form schema definitions and validation
 *
 * Provides standardized schemas for categorized contact forms
 * with validation and configuration utilities. This module includes
 * comprehensive field configurations, category definitions, and
 * validation functions for creating robust contact forms.
 */
import type { FieldConfig, CategoryConfig, SubmissionResult, FormData } from "./types";
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
    theme: "light" | "dark" | "auto";
    /** Position of field labels */
    labelPosition: "top" | "left" | "inline";
    /** Spacing between form fields */
    fieldSpacing: "tight" | "medium" | "loose";
    /** Character used to indicate required fields */
    requiredIndicator: string;
    /** Whether to show required fields label */
    showRequiredLabel: boolean;
    /** Text for required fields label */
    requiredLabelText: string;
    /** Position of error messages */
    errorMessagePosition: "above" | "below" | "inline";
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
    provider: "google-v3" | "google-v2" | "hcaptcha";
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
    formDataParser: (formData: FormData, categorySlug: string) => Promise<{
        data: FormData;
        errors: Record<string, string>;
    }>;
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
export declare const defaultFieldConfigs: Record<string, ExtendedFieldConfig>;
/**
 * Default category configurations with predefined form categories
 *
 * @example
 * ```typescript
 * const supportCategory = defaultCategories.support;
 * // Returns: { label: "Technical Support", icon: "HelpCircle", fields: [...] }
 * ```
 */
export declare const defaultCategories: Record<string, ExtendedCategoryConfig>;
/**
 * Default UI configurations
 *
 * @example
 * ```typescript
 * const submitText = defaultUiConfig.submitButtonText; // "Send Message"
 * const theme = defaultUiConfig.theme; // "light"
 * ```
 */
export declare const defaultUiConfig: UiConfig;
/**
 * Default schema for contact form configurations
 *
 * @example
 * ```typescript
 * const schema = defaultContactSchema;
 * const customSchema = secureDeepMerge(schema, { appName: "My App" });
 * ```
 */
export declare const defaultContactSchema: ContactSchema;
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
export declare function validateContactConfig(config: Partial<ContactSchema>): ValidationError;
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
export declare function getValidatorForCategory(config: ContactSchema | EnhancedContactFormConfig, categorySlug: string): FormValidator | null;
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
export declare function initContactFormConfig(userConfig: Partial<ContactSchema>, options?: Record<string, any>): EnhancedContactFormConfig;
export {};
