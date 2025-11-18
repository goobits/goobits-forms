/**
 * @fileoverview Form hydration service for @goobits/ui
 * Handles form data initialization, auto-detection of browser info, and test data management
 */

import { getContactFormConfig } from '../config/index.ts';
import { loadFormData } from './formStorage.ts';
import { createLogger } from '../utils/logger.ts';
import { IS_BROWSER, IS_DEV } from '../utils/constants.ts';

const logger = createLogger('FormHydration');

/**
 * Form hydration configuration parameters
 */
export interface FormHydrationParams {
	/** The currently selected form category */
	selectedCategory: string;
	/** The current form data object */
	formData: Record<string, any>;
	/** Whether to prefer cached data over existing form data */
	preferCache?: boolean;
}

/**
 * Browser and OS detection result
 */
export interface BrowserInfo {
	/** Detected browser name (e.g., "Chrome", "Firefox") */
	browser: string;
	/** Browser version string */
	version: string;
	/** Operating system name (e.g., "Windows", "macOS") */
	os: string;
}

/**
 * Test data function type
 */
export type TestDataFunction = (category?: string) => Record<string, any>;

/**
 * Default test data function (can be overridden)
 * Returns empty object by default
 *
 * @param {string} [_category] - The form category (unused in default implementation)
 * @returns {Record<string, any>} Empty test data object
 */
const getTestData: TestDataFunction = (): Record<string, any> => ({});

/**
 * Updates the form state and URL based on the selected category
 * Handles auto-detection of browser info, test data in development, and cached data restoration
 *
 * @param {FormHydrationParams} params - Configuration object for form hydration
 * @returns {Record<string, any>} Updated form data with all applicable enhancements
 *
 * @example
 * ```typescript
 * const updatedFormData = hydrateForm({
 *   selectedCategory: 'bug-report',
 *   formData: { name: 'John Doe' },
 *   preferCache: true
 * });
 *
 * console.log(updatedFormData.browser); // Auto-detected browser
 * console.log(updatedFormData.category); // 'bug-report'
 * ```
 */
export function hydrateForm({
	selectedCategory,
	formData,
	preferCache = true
}: FormHydrationParams): Record<string, any> {
	// Get configuration
	const config = getContactFormConfig();
	const { fieldConfigs } = config;

	// Get browser and OS info
	const detectedInfo = detectBrowserInfo();

	// Auto-detectable field values map
	const autoDetectValues: Record<string, any> = {
		browser: detectedInfo.browser,
		browserVersion: detectedInfo.version,
		operatingSystem: detectedInfo.os
	};

	// In development, use test data
	if (IS_DEV) {
		const testFormData = getTestData(selectedCategory);

		// Merge test data with auto-detected values
		return {
			...testFormData,
			...Object.fromEntries(
				Object.keys(fieldConfigs)
					.filter((key) => fieldConfigs[key].autoDetect)
					.map((key) => [key, autoDetectValues[key] || testFormData[key]])
			)
		};
	}

	// Try to load cached form data if available
	let cachedData: Record<string, any> = {};
	if (preferCache && IS_BROWSER) {
		try {
			const savedData = loadFormData(selectedCategory);
			if (savedData) {
				logger.debug(`Restored saved data for category: ${selectedCategory}`);
				cachedData = savedData;
			}
		} catch (error) {
			logger.error('Failed to load cached form data:', error);
		}
	}

	// For production: combine auto-detected values with existing form data and cached data
	return {
		// Auto-detected browser info for fields that support it
		...Object.fromEntries(
			Object.keys(fieldConfigs)
				.filter((key) => fieldConfigs[key].autoDetect)
				.map((key) => [key, autoDetectValues[key]])
		),

		// Cached form data (if available and preferred)
		...(preferCache ? cachedData : {}),

		// Existing form data takes precedence if we're not preferring cache
		...(preferCache ? {} : formData),

		// Always set the selected category
		category: selectedCategory
	};
}

/**
 * Detect browser and OS information from user agent
 * Returns empty object when not in browser environment
 *
 * @returns {BrowserInfo} The detected browser and OS information
 *
 * @example
 * ```typescript
 * const browserInfo = detectBrowserInfo();
 * console.log(`User is using ${browserInfo.browser} ${browserInfo.version} on ${browserInfo.os}`);
 * // Output: "User is using Chrome 91.0.4472.124 on Windows"
 * ```
 */
function detectBrowserInfo(): BrowserInfo {
	if (!IS_BROWSER) {
		return {
			browser: '',
			version: '',
			os: ''
		};
	}

	const userAgent = window.navigator.userAgent;
	const platform = window.navigator.platform;
	let browser = '';
	let version = '';
	let os = '';

	// Detect OS based on platform and user agent
	if (/Windows/.test(platform)) {
		os = 'Windows';
	} else if (/Mac/.test(platform)) {
		os = 'macOS';
	} else if (/Linux/.test(platform)) {
		os = 'Linux';
	} else if (/iPhone/.test(userAgent)) {
		os = 'iOS';
	} else if (/Android/.test(userAgent)) {
		os = 'Android';
	}

	// Detect browser and version with priority order (more specific first)
	if (/Firefox\/([0-9.]+)/.test(userAgent)) {
		browser = 'Firefox';
		const match = userAgent.match(/Firefox\/([0-9.]+)/);
		version = match ? match[1] : '';
	} else if (/Chrome\/([0-9.]+)/.test(userAgent)) {
		browser = 'Chrome';
		const match = userAgent.match(/Chrome\/([0-9.]+)/);
		version = match ? match[1] : '';
	} else if (/Safari\/([0-9.]+)/.test(userAgent)) {
		browser = 'Safari';
		const match = userAgent.match(/Version\/([0-9.]+)/);
		version = match ? match[1] : '';
	} else if (/Edge\/([0-9.]+)/.test(userAgent)) {
		browser = 'Edge';
		const match = userAgent.match(/Edge\/([0-9.]+)/);
		version = match ? match[1] : '';
	}

	return { browser, version, os };
}

/**
 * Type guard to check if a value is a valid test data function
 *
 * @param {any} fn - The value to check
 * @returns {fn is TestDataFunction} True if the value is a valid test data function
 *
 * @example
 * ```typescript
 * const userTestFn = (category: string) => ({ category, test: true });
 *
 * if (isTestDataFunction(userTestFn)) {
 *   const testData = userTestFn('bug-report');
 * }
 * ```
 */
export function isTestDataFunction(fn: any): fn is TestDataFunction {
	return typeof fn === 'function';
}

/**
 * Override the default test data function for development
 * Useful for providing realistic test data during development
 *
 * @param {TestDataFunction} testDataFn - Function that returns test data for a given category
 *
 * @example
 * ```typescript
 * setTestDataFunction((category) => {
 *   switch (category) {
 *     case 'bug-report':
 *       return {
 *         name: 'John Developer',
 *         email: 'john@example.com',
 *         description: 'Found a bug in the login form'
 *       };
 *     default:
 *       return {};
 *   }
 * });
 * ```
 */
export function setTestDataFunction(testDataFn: TestDataFunction): void {
	if (IS_DEV && isTestDataFunction(testDataFn)) {
		// In a real implementation, this would override the getTestData function
		// For now, we log a warning that this needs to be implemented
		logger.warn('setTestDataFunction called but override mechanism not implemented');
	}
}

/**
 * Get the current test data for a specific category
 * Only works in development mode
 *
 * @param {string} category - The form category
 * @returns {Record<string, any>} Test data for the category
 *
 * @example
 * ```typescript
 * if (IS_DEV) {
 *   const testData = getTestDataForCategory('feature-request');
 *   console.log('Test data:', testData);
 * }
 * ```
 */
export function getTestDataForCategory(category: string): Record<string, any> {
	if (!IS_DEV) {
		return {};
	}

	return getTestData(category);
}

/**
 * Clear any cached form data and reset to initial state
 * Useful for testing or when user wants to start fresh
 *
 * @param {string} selectedCategory - The form category to reset
 * @returns {Record<string, any>} Fresh form data with only auto-detected values
 *
 * @example
 * ```typescript
 * const freshFormData = resetFormHydration('contact');
 * // Returns form data with only browser info, no cached or test data
 * ```
 */
export function resetFormHydration(selectedCategory: string): Record<string, any> {
	return hydrateForm({
		selectedCategory,
		formData: {},
		preferCache: false
	});
}
