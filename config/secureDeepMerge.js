/**
 * Secure deep merge utility for safely merging configuration objects
 * Prevents prototype pollution and property traversal attacks
 */

/**
 * Checks if a key is safe to use in object merging/access
 * Prevents __proto__, constructor, and other dangerous property names
 *
 * @param {string} key - Object key to check
 * @returns {boolean} True if safe, false if potentially dangerous
 */
export function isSafeKey(key) {
	// List of known dangerous property names
	const dangerousKeys = [
		'__proto__',
		'constructor',
		'prototype'
	]

	return typeof key === 'string' && !dangerousKeys.includes(key)
}

/**
 * Secure deep merge that prevents prototype pollution
 *
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge in
 * @returns {Object} Merged object with only safe keys
 */
export function secureDeepMerge(target, source) {
	// Create a new object to avoid mutating the target
	const result = { ...target }

	// Only merge if both are objects
	if (source && typeof source === 'object' && !Array.isArray(source)) {
		// Iterate using Object.keys to only access own properties
		Object.keys(source).forEach(key => {
			// Skip potentially dangerous keys
			if (!isSafeKey(key)) {
				console.warn(`[secureDeepMerge] Skipping potentially unsafe key: ${ key }`)
				return
			}

			const sourceValue = source[key]

			// If property is an object, recursively merge
			if (sourceValue && typeof sourceValue === 'object' && !Array.isArray(sourceValue)) {
				result[key] = secureDeepMerge(result[key] || {}, sourceValue)
			} else {
				// For primitive values or arrays, just copy
				result[key] = sourceValue
			}
		})
	}

	return result
}

export default secureDeepMerge