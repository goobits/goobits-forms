/**
 * Secure deep merge utility for safely merging configuration objects
 * Prevents prototype pollution and property traversal attacks
 */
import { createLogger } from "../utils/logger";
const logger = createLogger("SecureDeepMerge");
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
export function isSafeKey(key) {
    // List of known dangerous property names
    const dangerousKeys = ["__proto__", "constructor", "prototype"];
    return typeof key === "string" && !dangerousKeys.includes(key);
}
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
export function secureDeepMerge(target, source) {
    // Create a new object to avoid mutating the target
    const result = { ...target };
    // Only merge if both are objects
    if (source && typeof source === "object" && !Array.isArray(source)) {
        // Iterate using Object.keys to only access own properties
        Object.keys(source).forEach((key) => {
            // Skip potentially dangerous keys
            if (!isSafeKey(key)) {
                logger.warn(`Skipping potentially unsafe key: ${key}`);
                return;
            }
            const sourceValue = source[key];
            // If property is an object, recursively merge
            if (sourceValue &&
                typeof sourceValue === "object" &&
                !Array.isArray(sourceValue)) {
                result[key] = secureDeepMerge(result[key] || {}, sourceValue);
            }
            else {
                // For primitive values or arrays, just copy
                result[key] = sourceValue;
            }
        });
    }
    return result;
}
