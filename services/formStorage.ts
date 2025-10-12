/**
 * @fileoverview Form Storage - Local storage utilities for form data persistence
 *
 * This module provides utilities for saving and retrieving form data from localStorage
 * to prevent data loss when users navigate away from the page.
 */

// Import logger utility and constants
import { createLogger } from '../utils/logger.ts';
import {
	IS_BROWSER,
	STORAGE_KEY,
	STORAGE_EXPIRY_KEY,
	DEFAULT_EXPIRY_HOURS
} from '../utils/constants.ts';
// import { handleError } from '../utils/errorHandler.ts'

const logger = createLogger('FormStorage');

/**
 * Form data that can be stored in localStorage
 */
export interface StorableFormData {
	/** Form field key-value pairs */
	[key: string]: any;
}

/**
 * All form data stored by category
 */
export interface CategorizedFormData {
	/** Category name as key, form data as value */
	[category: string]: StorableFormData;
}

/**
 * Save form data to localStorage for a specific category
 * Only saves if there's actual user data and filters out system fields
 *
 * @param {StorableFormData} formData - Form data to save
 * @param {string} category - Current form category
 * @returns {boolean} Success status indicating if data was saved
 *
 * @example
 * ```typescript
 * const formData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   message: 'Hello world',
 *   category: 'contact', // Will be filtered out
 *   attachments: []      // Will be filtered out
 * };
 *
 * const saved = saveFormData(formData, 'contact');
 * if (saved) {
 *   console.log('Form data saved successfully');
 * }
 * ```
 */
export function saveFormData(formData: StorableFormData, category: string): boolean {
	if (!IS_BROWSER) return false;

	try {
		// Only save if there's actual user data (at least one field with content)
		const hasUserData = Object.keys(formData).some((key) => {
			// Skip system fields and empty values
			if (key === 'category' || key === 'attachments') return false;
			return !!formData[key];
		});

		if (!hasUserData) {
			logger.debug('No user data to save');
			return false;
		}

		// Store form data by category
		const existingData = loadAllFormData() || {};

		// Filter out fields that shouldn't be stored (like attachments)
		const filteredData: StorableFormData = {};
		for (const key in formData) {
			// Skip attachments and empty fields
			if (key === 'attachments' || !formData[key]) continue;

			// Store other fields
			filteredData[key] = formData[key];
		}

		// Update data for this category
		existingData[category] = filteredData;

		// Save to localStorage
		localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));

		// Set expiry timestamp
		const expiryTime = Date.now() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000;
		localStorage.setItem(STORAGE_EXPIRY_KEY, expiryTime.toString());

		logger.debug(`Saved form data for category: ${category}`);
		return true;
	} catch (error) {
		logger.error('Error saving form data to localStorage', error);
		return false;
	}
}

/**
 * Load form data for a specific category from localStorage
 * Automatically clears expired data and returns null if not found
 *
 * @param {string} category - Form category to load
 * @returns {StorableFormData | null} Loaded form data or null if not found/expired
 *
 * @example
 * ```typescript
 * const savedData = loadFormData('contact');
 * if (savedData) {
 *   console.log('Restored form data:', savedData);
 *   // Use savedData.name, savedData.email, etc.
 * } else {
 *   console.log('No saved data for this category');
 * }
 * ```
 */
export function loadFormData(category: string): StorableFormData | null {
	if (!IS_BROWSER) return null;

	try {
		// Check if data is expired
		if (isDataExpired()) {
			clearAllFormData();
			return null;
		}

		// Load all saved data
		const allData = loadAllFormData();
		if (!allData || !allData[category]) {
			return null;
		}

		logger.debug(`Loaded saved form data for category: ${category}`);
		return allData[category];
	} catch (error) {
		logger.error('Error loading form data from localStorage', error);
		return null;
	}
}

/**
 * Load all saved form data from localStorage (internal use only)
 * Parses JSON data and handles parse errors gracefully
 *
 * @returns {CategorizedFormData | null} All saved form data or null if not found/invalid
 * @internal
 *
 * @example
 * ```typescript
 * const allData = loadAllFormData();
 * if (allData) {
 *   Object.keys(allData).forEach(category => {
 *     console.log(`Category: ${category}`, allData[category]);
 *   });
 * }
 * ```
 */
function loadAllFormData(): CategorizedFormData | null {
	if (!IS_BROWSER) return null;

	try {
		const savedData = localStorage.getItem(STORAGE_KEY);
		return savedData ? JSON.parse(savedData) : null;
	} catch {
		logger.error('Error parsing saved form data');
		return null;
	}
}

/**
 * Clear form data for a specific category
 * Removes the category from storage while preserving other categories
 *
 * @param {string} category - Form category to clear
 * @returns {boolean} Success status indicating if operation completed
 *
 * @example
 * ```typescript
 * const cleared = clearFormData('contact');
 * if (cleared) {
 *   console.log('Contact form data cleared');
 * }
 * ```
 */
export function clearFormData(category: string): boolean {
	if (!IS_BROWSER) return false;

	try {
		const allData = loadAllFormData();
		if (allData && allData[category]) {
			delete allData[category];
			localStorage.setItem(STORAGE_KEY, JSON.stringify(allData));
			logger.debug(`Cleared form data for category: ${category}`);
		}
		return true;
	} catch {
		logger.error('Error clearing form data');
		return false;
	}
}

/**
 * Clear all saved form data and expiry information
 * Completely removes all form storage from localStorage
 *
 * @returns {boolean} Success status indicating if operation completed
 *
 * @example
 * ```typescript
 * const cleared = clearAllFormData();
 * if (cleared) {
 *   console.log('All form data cleared');
 * }
 * ```
 */
export function clearAllFormData(): boolean {
	if (!IS_BROWSER) return false;

	try {
		localStorage.removeItem(STORAGE_KEY);
		localStorage.removeItem(STORAGE_EXPIRY_KEY);
		logger.debug('Cleared all saved form data');
		return true;
	} catch {
		logger.error('Error clearing all form data');
		return false;
	}
}

/**
 * Check if saved data has expired based on the expiry timestamp
 * Returns true if data is expired or expiry time is not set
 *
 * @returns {boolean} True if data is expired or expiry time is not set
 * @internal
 *
 * @example
 * ```typescript
 * if (isDataExpired()) {
 *   console.log('Saved data has expired');
 *   clearAllFormData();
 * }
 * ```
 */
function isDataExpired(): boolean {
	try {
		const expiryTime = localStorage.getItem(STORAGE_EXPIRY_KEY);
		if (!expiryTime) return true;

		const expiryTimestamp = parseInt(expiryTime, 10);
		return Date.now() > expiryTimestamp;
	} catch {
		return true;
	}
}

/**
 * Get the expiry timestamp for the current saved data
 * Returns null if no expiry is set or in non-browser environment
 *
 * @returns {Date | null} Expiry date or null if not set
 *
 * @example
 * ```typescript
 * const expiry = getDataExpiry();
 * if (expiry) {
 *   console.log(`Data expires at: ${expiry.toLocaleString()}`);
 * }
 * ```
 */
export function getDataExpiry(): Date | null {
	if (!IS_BROWSER) return null;

	try {
		const expiryTime = localStorage.getItem(STORAGE_EXPIRY_KEY);
		if (!expiryTime) return null;

		const expiryTimestamp = parseInt(expiryTime, 10);
		return new Date(expiryTimestamp);
	} catch (error) {
		return null;
	}
}

/**
 * Check if there is any saved form data in localStorage
 * Useful for determining if a user has previously started filling forms
 *
 * @returns {boolean} True if any form data exists (not expired)
 *
 * @example
 * ```typescript
 * if (hasSavedData()) {
 *   console.log('User has previously saved form data');
 *   // Maybe show a "restore data" prompt
 * }
 * ```
 */
export function hasSavedData(): boolean {
	if (!IS_BROWSER || isDataExpired()) {
		return false;
	}

	const allData = loadAllFormData();
	return allData !== null && Object.keys(allData).length > 0;
}

/**
 * Get list of categories that have saved data
 * Useful for showing users which forms have saved data
 *
 * @returns {string[]} Array of category names with saved data
 *
 * @example
 * ```typescript
 * const categoriesWithData = getSavedCategories();
 * categoriesWithData.forEach(category => {
 *   console.log(`Found saved data for: ${category}`);
 * });
 * ```
 */
export function getSavedCategories(): string[] {
	if (!IS_BROWSER || isDataExpired()) {
		return [];
	}

	const allData = loadAllFormData();
	return allData ? Object.keys(allData) : [];
}

/**
 * Type guard to check if an object is valid StorableFormData
 *
 * @param {any} obj - Object to check
 * @returns {obj is StorableFormData} True if object is valid form data
 *
 * @example
 * ```typescript
 * const data = loadFormData('contact');
 * if (isStorableFormData(data)) {
 *   // TypeScript now knows data is StorableFormData
 *   console.log(data.name);
 * }
 * ```
 */
export function isStorableFormData(obj: any): obj is StorableFormData {
	return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * Safely convert form data to a storable format
 * Filters out non-serializable values and system fields
 *
 * @param {any} formData - Raw form data that may contain non-serializable values
 * @returns {StorableFormData} Clean form data safe for storage
 *
 * @example
 * ```typescript
 * const formData = {
 *   name: 'John',
 *   file: new File(['content'], 'test.txt'), // Will be filtered out
 *   attachments: [],                         // Will be filtered out
 *   callback: () => {}                       // Will be filtered out
 * };
 *
 * const storableData = sanitizeForStorage(formData);
 * console.log(storableData); // { name: 'John' }
 * ```
 */
export function sanitizeForStorage(formData: any): StorableFormData {
	const sanitized: StorableFormData = {};

	if (!isStorableFormData(formData)) {
		return sanitized;
	}

	for (const [key, value] of Object.entries(formData)) {
		// Skip system fields
		if (key === 'attachments' || key === 'category') {
			continue;
		}

		// Skip functions, Files, and other non-serializable types
		if (typeof value === 'function' || value instanceof File || value instanceof FileList) {
			continue;
		}

		// Skip empty values
		if (value === null || value === undefined || value === '') {
			continue;
		}

		// Store serializable values
		try {
			JSON.stringify(value);
			sanitized[key] = value;
		} catch (error) {
			// Skip values that can't be serialized
			logger.debug(`Skipping non-serializable field: ${key}`);
		}
	}

	return sanitized;
}
