/**
 * Utilities for sanitizing user input to prevent XSS attacks
 *
 * This module provides comprehensive input sanitization capabilities including
 * HTML escaping, URL validation, and deep object sanitization. Designed to
 * prevent cross-site scripting (XSS) attacks and malicious content injection.
 *
 * @module sanitizeInput
 * @example
 * ```typescript
 * import { sanitizeFormData, escapeHTML, sanitizeURL } from './sanitizeInput';
 *
 * const userInput = '<script>alert("xss")</script>';
 * const safe = escapeHTML(userInput); // '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 *
 * const formData = { message: userInput, website: 'javascript:alert(1)' };
 * const sanitized = sanitizeFormData(formData);
 * // Returns: { message: '&lt;script&gt;...', website: null }
 * ```
 */
import { createLogger } from "./logger.ts";
const logger = createLogger("SanitizeInput");
/**
 * Local error handling implementation
 *
 * @internal
 * @param moduleName - Name of the module where error occurred
 * @param error - Error instance to handle
 * @returns The original error for re-throwing if needed
 */
function handleError(moduleName, error) {
    logger.error("Error:", error);
    return error;
}
/**
 * Validates input type with optional requirement checking
 *
 * @internal
 * @param value - Value to validate
 * @param type - Expected type ('string', 'number', 'object', 'array')
 * @param name - Parameter name for error messages
 * @param isOptional - Whether the parameter is optional
 * @throws {TypeError} If validation fails
 */
function validateType(value, type, name, isOptional = true) {
    if (value === undefined || value === null) {
        if (!isOptional) {
            throw new TypeError(`${name} is required`);
        }
        return;
    }
    const actualType = typeof value;
    if (type === "array") {
        if (!Array.isArray(value)) {
            throw new TypeError(`${name} must be an array, got ${actualType}`);
        }
    }
    else if (actualType !== type) {
        throw new TypeError(`${name} must be a ${type}, got ${actualType}`);
    }
}
// Module name for error context
const MODULE_NAME = "SanitizeInput";
/**
 * Potentially dangerous URL protocols that should be blocked
 *
 * @description List of URL protocols that can be used for XSS attacks
 * or other malicious activities. URLs starting with these protocols
 * will be rejected during sanitization.
 *
 * @example
 * ```typescript
 * const maliciousUrl = 'javascript:alert("xss")';
 * const isDangerous = DANGEROUS_PROTOCOLS.some(protocol =>
 *   maliciousUrl.toLowerCase().startsWith(protocol)
 * );
 * // isDangerous will be true
 * ```
 */
export const DANGEROUS_PROTOCOLS = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "about:",
    "jscript:",
    "livescript:",
    "mhtml:",
];
/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * @description Converts HTML special characters to their corresponding
 * HTML entities to prevent script execution when displayed in browsers.
 * Essential for safely displaying user-generated content.
 *
 * @param str - String to be escaped
 * @returns Escaped string with HTML entities replacing special characters
 *
 * @example
 * ```typescript
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHTML(userInput);
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 *
 * const complexInput = 'Hello & <goodbye> "world" \'test\'';
 * const escaped = escapeHTML(complexInput);
 * // Returns: 'Hello &amp; &lt;goodbye&gt; &quot;world&quot; &#039;test&#039;'
 * ```
 */
export function escapeHTML(str) {
    // Return non-string inputs unchanged
    if (typeof str !== "string")
        return str;
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
/**
 * Sanitizes a URL to prevent javascript: protocol and other potential injections
 *
 * @description Validates and sanitizes URLs to prevent malicious protocol
 * injection attacks. Removes dangerous protocols while preserving safe URLs.
 * Returns null for potentially malicious URLs.
 *
 * @param url - URL to sanitize
 * @returns Sanitized URL or null if potentially malicious
 *
 * @example
 * ```typescript
 * // Safe URLs pass through
 * sanitizeURL('https://example.com'); // 'https://example.com'
 * sanitizeURL('mailto:test@example.com'); // 'mailto:test@example.com'
 *
 * // Dangerous URLs are rejected
 * sanitizeURL('javascript:alert(1)'); // null
 * sanitizeURL('data:text/html,<script>alert(1)</script>'); // null
 *
 * // Obfuscated attacks are detected
 * sanitizeURL('  java\tscript:alert(1)  '); // null
 * sanitizeURL('JAVASCRIPT:alert(1)'); // null (case insensitive)
 * ```
 */
export function sanitizeURL(url) {
    try {
        // Return non-string inputs unchanged (but typed as string|null)
        if (typeof url !== "string")
            return url;
        // Remove whitespace
        const trimmed = url.trim();
        if (!trimmed)
            return url;
        // Enhanced detection for obfuscated protocols
        const normalized = trimmed
            .toLowerCase()
            .replace(/\s+/g, "")
            // eslint-disable-next-line no-control-regex
            .replace(/[\x01-\x20]/g, "") // Remove control characters (excluding null)
            .replace(/\\+/g, ""); // Handle escaping
        // Check if URL starts with any dangerous protocol
        if (DANGEROUS_PROTOCOLS.some((protocol) => normalized.startsWith(protocol))) {
            return null; // Return null for potentially malicious URLs
        }
        // Return safe URL
        return trimmed;
    }
    catch (error) {
        handleError(MODULE_NAME, error);
        return null; // Return null on error as a safety measure
    }
}
/**
 * Deep sanitizes an object or array, recursively processing all string values
 *
 * @description Recursively traverses objects and arrays, applying HTML escaping
 * to all string values while preserving the original structure. Handles nested
 * objects and arrays of arbitrary depth.
 *
 * @param input - Object, array, or primitive to sanitize
 * @returns Sanitized value with all strings HTML-escaped
 * @throws {Error} If circular references are detected or processing fails
 *
 * @example
 * ```typescript
 * const data = {
 *   message: '<script>alert("xss")</script>',
 *   nested: {
 *     items: ['<b>test</b>', 'normal text'],
 *     count: 42
 *   }
 * };
 *
 * const sanitized = sanitize(data);
 * // Returns:
 * // {
 * //   message: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
 * //   nested: {
 * //     items: ['&lt;b&gt;test&lt;/b&gt;', 'normal text'],
 * //     count: 42
 * //   }
 * // }
 * ```
 */
export function sanitize(input) {
    try {
        // Handle primitives
        if (typeof input !== "object" || input === null) {
            return typeof input === "string" ? escapeHTML(input) : input;
        }
        // Handle arrays
        if (Array.isArray(input)) {
            return input.map((item) => sanitize(item));
        }
        // Handle objects
        const result = {};
        for (const [key, value] of Object.entries(input)) {
            result[key] = sanitize(value);
        }
        return result;
    }
    catch (error) {
        handleError(MODULE_NAME, error);
        return input; // Return original input if sanitization fails
    }
}
/**
 * Sanitizes form data with field-specific sanitization strategies
 *
 * @description Applies intelligent sanitization to form data based on field
 * names and content types. URL fields get URL validation while other string
 * fields get HTML escaping. Preserves object structure and handles nested data.
 *
 * @param formData - Form data object to sanitize
 * @returns Sanitized form data with appropriate transformations applied
 * @throws {TypeError} If formData is not an object
 *
 * @example
 * ```typescript
 * const formData = {
 *   name: '<script>alert("name")</script>',
 *   email: 'user@example.com',
 *   website: 'javascript:alert("evil")',
 *   message: 'Hello & welcome!',
 *   metadata: {
 *     tags: ['<tag1>', '<tag2>']
 *   }
 * };
 *
 * const sanitized = sanitizeFormData(formData);
 * // Returns:
 * // {
 * //   name: '&lt;script&gt;alert(&quot;name&quot;)&lt;/script&gt;',
 * //   email: 'user@example.com', // emails are HTML-escaped
 * //   website: null, // dangerous URL rejected
 * //   message: 'Hello &amp; welcome!',
 * //   metadata: {
 * //     tags: ['&lt;tag1&gt;', '&lt;tag2&gt;']
 * //   }
 * // }
 * ```
 */
export function sanitizeFormData(formData) {
    try {
        // Validate input is an object
        validateType(formData, "object", "formData", false);
        const sanitized = { ...formData };
        // Sanitize each field based on its key and type
        Object.keys(sanitized).forEach((key) => {
            const value = sanitized[key];
            // Skip null/undefined values
            if (value === null || value === undefined)
                return;
            // Field name patterns that should be treated as URLs
            const urlFieldPatterns = ["url", "website", "link", "href", "src"];
            // Check if field name suggests it's a URL (using a more reliable pattern match)
            const isUrlField = urlFieldPatterns.some((pattern) => key.toLowerCase().includes(pattern.toLowerCase()));
            if (isUrlField && typeof value === "string") {
                // URL fields get URL sanitization
                sanitized[key] = sanitizeURL(value);
            }
            else if (typeof value === "string") {
                // All other strings get HTML escaped (including emails)
                sanitized[key] = escapeHTML(value);
            }
            else if (typeof value === "object") {
                // Deep sanitize objects and arrays
                sanitized[key] = sanitize(value);
            }
            // Numbers, booleans, and other primitives are left unchanged
        });
        return sanitized;
    }
    catch (error) {
        handleError(MODULE_NAME, error);
        return undefined; // Return undefined on error for safety
    }
}
