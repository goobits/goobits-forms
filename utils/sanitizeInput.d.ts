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
/**
 * Sanitizable value types
 */
type SanitizableValue = string | number | boolean | null | undefined | object | unknown[];
/**
 * Form data interface for sanitization
 */
interface FormData {
    [key: string]: SanitizableValue;
}
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
export declare const DANGEROUS_PROTOCOLS: readonly string[];
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
export declare function escapeHTML(str: unknown): string | typeof str;
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
export declare function sanitizeURL(url: unknown): string | null;
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
export declare function sanitize(input: SanitizableValue): SanitizableValue;
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
export declare function sanitizeFormData(formData: FormData): FormData | undefined;
export {};
