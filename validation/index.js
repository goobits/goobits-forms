/**
 * Validation utilities for contact forms
 *
 * This module provides type-safe validation utilities for form handling,
 * including schema creation, field validation, and error management.
 */
import { zod4 } from "sveltekit-superforms/adapters";
import { debounce } from "../utils/debounce.ts";
/**
 * Creates a validation schema for a specific contact category
 *
 * This function retrieves or creates a Zod validation schema for a given
 * form category. It first attempts to use pre-built schemas, then falls
 * back to creating one from the field mapping if necessary.
 *
 * @param config - Configuration object containing categories, schemas, and field mappings
 * @param category - The contact category to create a schema for
 * @returns A Zod validation schema for the specified category
 *
 * @throws {Error} When the category is invalid or no schema can be found
 *
 * @example
 * ```typescript
 * const config = {
 *   categories: { general: { fields: ['name', 'email'] } },
 *   schemas: { categories: { general: z.object({ name: z.string(), email: z.string().email() }) } },
 *   categoryToFieldMap: { general: ['name', 'email'] }
 * };
 *
 * const schema = createValidationSchemaForCategory(config, 'general');
 * const result = schema.safeParse({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function createValidationSchemaForCategory(config, category) {
    if (!config.categories[category]) {
        throw new Error(`Invalid category: ${category}`);
    }
    // Use the pre-built category schema
    if (config.schemas && config.schemas.categories && config.schemas.categories[category]) {
        return config.schemas.categories[category];
    }
    // Fallback to creating from field map if schema not available
    if (config.categoryToFieldMap[category] && config.schemas?.complete) {
        return config.schemas.complete.pick(Object.fromEntries(config.categoryToFieldMap[category].map((field) => [field, true])));
    }
    throw new Error(`No schema found for category: ${category}`);
}
/**
 * Gets the superForm validator for a specific category
 *
 * This function creates a superForm-compatible validator by wrapping
 * the category-specific Zod schema with the zod4 adapter.
 *
 * @param config - Configuration object containing validation schemas
 * @param category - The contact category to get a validator for
 * @returns A superForm validator function for the specified category
 *
 * @throws {Error} When the category is invalid or no schema can be found
 *
 * @example
 * ```typescript
 * const validator = getValidatorForCategory(config, 'general');
 *
 * // Use with superForm
 * const form = superForm(defaultData, {
 *   validators: validator
 * });
 * ```
 */
export function getValidatorForCategory(config, category) {
    return zod4(createValidationSchemaForCategory(config, category));
}
/**
 * Get validation state CSS classes for a field
 *
 * Generates appropriate CSS classes based on field validation state.
 * Only shows validation classes after the field has been touched to
 * avoid showing errors before user interaction.
 *
 * @param hasError - Whether the field has a validation error
 * @param isTouched - Whether the field has been touched/focused by the user
 * @param value - The current field value (optional, for showing valid state)
 * @returns Space-separated CSS class names for styling the field
 *
 * @example
 * ```typescript
 * // Field not touched yet
 * getValidationClasses(true, false, ''); // Returns: ""
 *
 * // Field touched with error
 * getValidationClasses(true, true, 'invalid-email'); // Returns: "is-invalid has-error"
 *
 * // Field touched, valid, with value
 * getValidationClasses(false, true, 'valid@email.com'); // Returns: "is-valid"
 *
 * // Field touched, no error, but empty
 * getValidationClasses(false, true, ''); // Returns: ""
 * ```
 */
export function getValidationClasses(hasError, isTouched, value) {
    if (!isTouched)
        return "";
    // Only show valid state if there's an actual value
    return hasError ? "is-invalid has-error" : value ? "is-valid" : "";
}
/**
 * Debounced validation helper
 *
 * Creates a debounced version of a validation function to prevent
 * excessive validation calls during rapid user input. The debounced
 * function will only execute after the specified delay has elapsed
 * since the last call.
 *
 * @param validateFn - Validation function to debounce
 * @param delay - Debounce delay in milliseconds (default: 300ms)
 * @returns Debounced validation function that delays execution
 *
 * @example
 * ```typescript
 * const validateEmail = (email: string) => {
 *   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 * };
 *
 * const debouncedValidateEmail = createDebouncedValidator(validateEmail, 500);
 *
 * // Will only execute once after 500ms of no additional calls
 * debouncedValidateEmail('user@example.com');
 * debouncedValidateEmail('user@example.co');  // Cancels previous call
 * debouncedValidateEmail('user@example.com'); // Executes after 500ms
 * ```
 */
export function createDebouncedValidator(validateFn, delay = 300) {
    return debounce(validateFn, delay);
}
/**
 * Export the debounce function for backward compatibility
 *
 * Re-exports the debounce utility function to maintain backward
 * compatibility with existing code that imports it from this module.
 */
export { debounce };
/**
 * Check if a form has any validation errors
 *
 * Examines the errors object from superforms to determine if there
 * are any active validation errors. An error is considered active
 * if it exists and has a non-zero length.
 *
 * @param errors - Error object from superforms containing field validation errors
 * @returns True if there are any validation errors, false otherwise
 *
 * @example
 * ```typescript
 * const errors = {
 *   email: ['Invalid email format'],
 *   name: [],
 *   phone: undefined
 * };
 *
 * hasValidationErrors(errors); // Returns: true (email has error)
 *
 * const noErrors = {
 *   email: [],
 *   name: [],
 *   phone: undefined
 * };
 *
 * hasValidationErrors(noErrors); // Returns: false (no active errors)
 * ```
 */
export function hasValidationErrors(errors) {
    return Object.values(errors).some((value) => value && value.length > 0);
}
/**
 * Clear specific field error
 *
 * Creates a new errors object with the specified field error removed.
 * This is useful for programmatically clearing validation errors
 * when certain conditions are met or when implementing custom
 * error clearing logic.
 *
 * @param errors - Current errors object containing field validation errors
 * @param field - Field name to clear the error for
 * @returns Updated errors object with the specified field error removed
 *
 * @example
 * ```typescript
 * const errors = {
 *   email: ['Invalid email format'],
 *   name: ['Name is required'],
 *   phone: ['Invalid phone number']
 * };
 *
 * const updatedErrors = clearFieldError(errors, 'email');
 * // Result: { name: ['Name is required'], phone: ['Invalid phone number'] }
 *
 * // Original errors object is not modified
 * console.log(errors.email); // Still: ['Invalid email format']
 * console.log(updatedErrors.email); // undefined
 * ```
 */
export function clearFieldError(errors, field) {
    const updatedErrors = { ...errors };
    delete updatedErrors[field];
    return updatedErrors;
}
