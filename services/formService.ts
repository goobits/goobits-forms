/**
 * @fileoverview Form Service - Core functionality for form handling
 *
 * This module provides utilities for form initialization, state management,
 * submission handling, and accessibility.
 */

// External Imports
import { superForm } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import type { ZodSchema } from "zod";

// Import logger utility
import { createLogger } from "../utils/logger.ts";

const logger = createLogger("FormService");

// Internal Imports
// import { createRecaptchaProvider } from './recaptcha/index.js'
import { sanitizeFormData } from "../utils/sanitizeInput.ts";
import { debounce } from "../utils/debounce.ts";
import { handleError } from "../utils/errorHandler.ts";

// Import screen reader service to avoid circular dependencies
import * as screenReaderService from "./screenReaderService.ts";

/**
 * Form initialization options interface
 */
export interface FormInitializationOptions {
  /** Initial form data object */
  initialData: Record<string, any>;
  /** Zod schema for form validation */
  schema: ZodSchema;
  /** Custom submission handler function */
  onSubmitHandler?: (formData: any) => Promise<any>;
  /** Additional superForm options */
  extraOptions?: Record<string, any>;
}

/**
 * Form state interface
 */
export interface FormState {
  /** Array of file attachments */
  attachments: File[];
  /** Currently selected form category */
  selectedCategory: string;
  /** Current submission error if any */
  submissionError: Error | null;
  /** reCAPTCHA instance */
  recaptcha: any;
  /** Object tracking which fields have been touched */
  touched: Record<string, boolean>;
  /** Cached category value */
  cachedCategory: string | null;
}

/**
 * Form submission handler options interface
 */
export interface FormSubmitHandlerOptions {
  /** Function to validate the entire form */
  validateForm: () => boolean;
  /** reCAPTCHA instance for token generation */
  recaptcha?: any;
  /** Function to prepare form data before submission */
  prepareFormData: (formData: any, recaptchaToken?: string) => Promise<any>;
  /** Function to submit the prepared form data */
  submitForm: (formData: any) => Promise<any>;
  /** Callback function for successful submission */
  onSuccess: (response: any) => void;
  /** Callback function for submission errors */
  onError: (error: Error) => void;
}

/**
 * Form submission result interface
 */
export interface FormSubmissionResult {
  /** Whether the submission was successful */
  success: boolean;
  /** Response data on success */
  data?: any;
  /** Error object on failure */
  error?: Error;
}

/**
 * reCAPTCHA interface
 */
export interface RecaptchaInstance {
  /** Get a reCAPTCHA token for the specified action */
  getToken: (action: string) => Promise<string>;
}

/**
 * Initialize a form with standard configuration using sveltekit-superforms
 *
 * @param {FormInitializationOptions} options - Form initialization options
 * @returns {any} The initialized form object and related utilities from superForm
 * @throws {Error} When schema is invalid or form initialization fails
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 *
 * const schema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email')
 * });
 *
 * const form = initializeForm({
 *   initialData: { name: '', email: '' },
 *   schema,
 *   onSubmitHandler: async (formData) => {
 *     console.log('Submitting:', formData);
 *   }
 * });
 * ```
 */
export function initializeForm({
  initialData,
  schema,
  onSubmitHandler,
  extraOptions = {},
}: FormInitializationOptions): any {
  // Validate schema before passing to zod adapter
  if (!schema || typeof schema !== "object" || !schema._def) {
    const errorMsg = `Invalid schema provided to initializeForm. Schema details: type=${typeof schema}, hasDefProperty=${!!schema?._def}, schema=${JSON.stringify(schema, null, 2)}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.debug("Initializing form with schema", {
    schemaType: typeof schema,
    hasDefProperty: !!schema._def,
    schemaKeys: schema ? Object.keys(schema) : [],
    initialDataKeys: initialData ? Object.keys(initialData) : [],
  });

  try {
    return superForm(initialData, {
      dataType: "json",
      validators: zod4(schema),
      resetForm: false,
      taintedMessage: false,
      multipleSubmits: "prevent",
      SPA: true,
      onSubmit: onSubmitHandler,
      onUpdate() {
        // Handle form updates
      },
      ...extraOptions,
    });
  } catch (error) {
    logger.error("Failed to initialize superForm", {
      error: error instanceof Error ? error.message : String(error),
      schema,
      initialData,
    });
    throw error;
  }
}

/**
 * Initialize form state with default values
 *
 * @param {Partial<FormState>} [initialState] - Initial state values to override defaults
 * @returns {FormState} The initial form state with defaults applied
 *
 * @example
 * ```typescript
 * const formState = initializeFormState({
 *   selectedCategory: 'bug-report',
 *   attachments: []
 * });
 *
 * console.log(formState.touched); // {}
 * console.log(formState.submissionError); // null
 * ```
 */
export function initializeFormState(initialState: Partial<FormState> = {}): FormState {
  return {
    attachments: [],
    selectedCategory: "",
    submissionError: null,
    recaptcha: null,
    touched: {},
    cachedCategory: null,
    ...initialState,
  };
}

/**
 * Handle field input events with debounced validation
 * Only validates if the field has been touched to avoid premature validation
 *
 * @param {Record<string, boolean>} touched - Object tracking touched state of fields
 * @param {string} fieldName - The name of the field being validated
 * @param {(fieldName: string) => void} validate - Validation function to call
 *
 * @example
 * ```typescript
 * const touched = { email: true, name: false };
 *
 * const validateField = (fieldName: string) => {
 *   console.log(`Validating ${fieldName}`);
 * };
 *
 * handleFieldInput(touched, 'email', validateField); // Will validate (debounced)
 * handleFieldInput(touched, 'name', validateField);  // Will not validate (not touched)
 * ```
 */
export function handleFieldInput(
  touched: Record<string, boolean>,
  fieldName: string,
  validate: (fieldName: string) => void
): void {
  // Validate if the field has been touched
  if (touched[fieldName]) {
    // Use debounce to prevent too many validation calls
    debounce(() => validate(fieldName), 300)();
  }
}

/**
 * Handle field blur events to mark field as touched
 * This enables validation on subsequent input events
 *
 * @param {Record<string, boolean>} touched - Current touched state object
 * @param {string} fieldName - The name of the field that was blurred
 * @returns {Record<string, boolean>} Updated touched object with the field marked as touched
 *
 * @example
 * ```typescript
 * let touched = { email: false };
 * touched = handleFieldTouch(touched, 'email');
 * console.log(touched.email); // true
 * ```
 */
export function handleFieldTouch(
  touched: Record<string, boolean>,
  fieldName: string
): Record<string, boolean> {
  return {
    ...touched,
    [fieldName]: true,
  };
}

/**
 * Creates a standardized form submission handler with common functionality
 * Includes validation, reCAPTCHA handling, data preparation, and error handling
 *
 * @param {FormSubmitHandlerOptions} options - Handler configuration options
 * @returns {(formData: any) => Promise<FormSubmissionResult>} Submission handler function
 *
 * @example
 * ```typescript
 * const submitHandler = createFormSubmitHandler({
 *   validateForm: () => formValid,
 *   recaptcha: recaptchaInstance,
 *   prepareFormData: async (data, token) => ({ ...data, recaptchaToken: token }),
 *   submitForm: async (data) => fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) }),
 *   onSuccess: (response) => console.log('Success!', response),
 *   onError: (error) => console.error('Error:', error)
 * });
 *
 * const result = await submitHandler(formData);
 * ```
 */
export function createFormSubmitHandler(options: FormSubmitHandlerOptions) {
  const {
    validateForm,
    recaptcha,
    prepareFormData,
    submitForm,
    onSuccess,
    onError,
  } = options;

  return async function (formData: any): Promise<FormSubmissionResult> {
    // Validate the form first
    if (!validateForm()) {
      const error = handleError(
        "Please fix the validation errors before submitting.",
        "FormSubmission",
        { step: "validation" },
      );
      onError(error);
      return { success: false, error };
    }

    try {
      // Get reCAPTCHA token if available
      const recaptchaToken = await getRecaptchaToken(recaptcha);

      // Prepare, sanitize and submit
      const preparedData = await prepareFormData(formData, recaptchaToken);
      const sanitizedData = sanitizeFormData(preparedData);
      const response = await submitForm(sanitizedData);

      // Handle response
      if (response?.success) {
        onSuccess(response);
        return { success: true, data: response };
      }

      // Handle non-success response
      const error = handleError(
        response?.error || "Form submission failed",
        "FormSubmission",
        { response },
      );
      throw error;
    } catch (error) {
      const standardizedError =
        error instanceof Error && error.name === "ContactFormError"
          ? error
          : handleError(error, "FormSubmission", { formData });
      onError(standardizedError);
      return { success: false, error: standardizedError };
    }
  };
}

/**
 * Get reCAPTCHA token if reCAPTCHA instance is available
 * Returns null if reCAPTCHA is not configured or fails
 *
 * @param {RecaptchaInstance | null} recaptcha - reCAPTCHA instance
 * @returns {Promise<string | null>} reCAPTCHA token or null
 *
 * @example
 * ```typescript
 * const token = await getRecaptchaToken(recaptchaInstance);
 * if (token) {
 *   console.log('Got reCAPTCHA token:', token.substring(0, 10) + '...');
 * } else {
 *   console.log('No reCAPTCHA token available');
 * }
 * ```
 */
async function getRecaptchaToken(recaptcha: RecaptchaInstance | null): Promise<string | null> {
  if (!recaptcha) return null;

  try {
    return await recaptcha.getToken("submit");
  } catch (error) {
    logger.error("reCAPTCHA execution failed:", error);
    return null;
  }
}

/**
 * Reset a form to its initial state
 * Clears form data, submission errors, and touched state
 *
 * @param {(data: any) => void} setFormData - Function to set form data
 * @param {Record<string, any>} defaultProps - Default form properties to reset to
 * @param {Partial<FormState>} state - State variables to reset
 *
 * @example
 * ```typescript
 * const defaultProps = { name: '', email: '', message: '' };
 * const state = { submissionError: new Error('Test'), touched: { email: true } };
 *
 * resetForm(setFormData, defaultProps, state);
 * // Form is now reset to initial state
 * ```
 */
export function resetForm(
  setFormData: (data: any) => void,
  defaultProps: Record<string, any>,
  state: Partial<FormState>
): void {
  // Reset the form data
  setFormData(defaultProps);

  // Reset form state
  if (state.submissionError !== undefined) {
    state.submissionError = null;
  }

  // Clear touched state
  if (state.touched !== undefined) {
    state.touched = {};
  }
}

/**
 * Type guard to check if an object is a valid RecaptchaInstance
 *
 * @param {any} obj - Object to check
 * @returns {obj is RecaptchaInstance} True if object has required RecaptchaInstance methods
 *
 * @example
 * ```typescript
 * if (isRecaptchaInstance(someObject)) {
 *   const token = await someObject.getToken('submit');
 * }
 * ```
 */
export function isRecaptchaInstance(obj: any): obj is RecaptchaInstance {
  return obj && typeof obj.getToken === 'function';
}

/**
 * Validate that a form submission handler has all required options
 *
 * @param {Partial<FormSubmitHandlerOptions>} options - Options to validate
 * @throws {Error} When required options are missing
 *
 * @example
 * ```typescript
 * try {
 *   validateSubmitHandlerOptions({
 *     validateForm: () => true,
 *     prepareFormData: async (data) => data,
 *     submitForm: async (data) => ({ success: true }),
 *     onSuccess: () => {},
 *     onError: () => {}
 *   });
 *   console.log('Options are valid');
 * } catch (error) {
 *   console.error('Invalid options:', error.message);
 * }
 * ```
 */
export function validateSubmitHandlerOptions(options: Partial<FormSubmitHandlerOptions>): void {
  const required = ['validateForm', 'prepareFormData', 'submitForm', 'onSuccess', 'onError'];
  const missing = required.filter(key => !(key in options) || typeof options[key as keyof FormSubmitHandlerOptions] !== 'function');

  if (missing.length > 0) {
    throw new Error(`Missing required form submit handler options: ${missing.join(', ')}`);
  }
}