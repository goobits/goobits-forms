/**
 * Secure deep merge utility for safely merging configuration objects
 * Prevents prototype pollution and property traversal attacks
 */
/**
 * Type for any object that can be safely merged
 */
type MergeableObject = Record<string, any>;
/**
 * Checks if a key is safe to use in object merging/access
 * Prevents __proto__, constructor, and other dangerous property names
 *
 * @param key - Object key to check
 * @returns True if safe, false if potentially dangerous
 *
 * @example
 * ```typescript
 * isSafeKey("name") // true
 * isSafeKey("__proto__") // false
 * isSafeKey("constructor") // false
 * ```
 */
export declare function isSafeKey(key: string): boolean;
/**
 * Secure deep merge that prevents prototype pollution
 *
 * This function safely merges configuration objects by:
 * - Creating a new object to avoid mutations
 * - Filtering out dangerous property names
 * - Recursively merging nested objects
 * - Preserving arrays and primitive values
 *
 * @param target - Target object to merge into
 * @param source - Source object to merge from
 * @returns New merged object with only safe keys
 *
 * @example
 * ```typescript
 * const config = { theme: "light", api: { timeout: 5000 } };
 * const userConfig = { theme: "dark", api: { retries: 3 } };
 * const merged = secureDeepMerge(config, userConfig);
 * // Result: { theme: "dark", api: { timeout: 5000, retries: 3 } }
 * ```
 */
export declare function secureDeepMerge<T extends MergeableObject, U extends MergeableObject>(target: T, source: U): T & U;
export {};
