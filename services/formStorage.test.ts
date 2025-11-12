/**
 * Comprehensive tests for formStorage
 *
 * Tests cover all localStorage utilities for form data persistence including
 * save, load, clear operations, expiry handling, and browser environment checks.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
	saveFormData,
	loadFormData,
	clearFormData,
	clearAllFormData,
	getDataExpiry,
	hasSavedData,
	getSavedCategories,
	isStorableFormData,
	sanitizeForStorage,
	type StorableFormData,
	type CategorizedFormData
} from './formStorage';

// Mock localStorage
const mockLocalStorage = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	removeItem: vi.fn(),
	clear: vi.fn()
};

// Mock logger
vi.mock('../utils/logger.ts', () => ({
	createLogger: () => ({
		debug: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn()
	})
}));

// Mock constants - we'll override IS_BROWSER in tests
let mockIsBrowser = true;
vi.mock('../utils/constants.ts', () => ({
	get IS_BROWSER() {
		return mockIsBrowser;
	},
	STORAGE_KEY: 'test_form_data',
	STORAGE_EXPIRY_KEY: 'test_form_expiry',
	DEFAULT_EXPIRY_HOURS: 24
}));

describe('saveFormData', () => {
	let mockDateNow: number;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns false in non-browser environment', () => {
		mockIsBrowser = false;
		const formData = { name: 'John Doe', email: 'john@example.com' };
		const result = saveFormData(formData, 'contact');

		expect(result).toBe(false);
		expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
	});

	test('saves data to localStorage with correct key', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		const result = saveFormData(formData, 'contact');

		expect(result).toBe(true);
		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			'test_form_data',
			expect.any(String)
		);
	});

	test('does not filter out category field in saved data', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			category: 'contact'
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact).toBeDefined();
		// Category field is not filtered in the storage loop, only in hasUserData check
		expect(savedData.contact.category).toBe('contact');
	});

	test('filters out excluded values', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const testCases = [
			{ field: 'attachments', value: [{ name: 'file.pdf', size: 1000 }], desc: 'attachments field' },
			{ field: 'empty', value: '', desc: 'empty strings' },
			{ field: 'nullField', value: null, desc: 'null values' },
			{ field: 'undefinedField', value: undefined, desc: 'undefined values' }
		];

		testCases.forEach(({ field, value }) => {
			mockLocalStorage.setItem.mockClear();
			const data = { name: 'John Doe', email: 'john@example.com', [field]: value };
			saveFormData(data, 'contact');
			const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
			expect(savedData.contact).toBeDefined();
			expect(savedData.contact[field]).toBeUndefined();
			expect(savedData.contact.name).toBe('John Doe');
		});
	});

	test('stores data by category and merges with existing categories', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		// Save first category
		saveFormData(formData, 'contact');
		let savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact).toBeDefined();
		expect(savedData.contact.name).toBe('John Doe');
		expect(savedData.contact.email).toBe('john@example.com');

		// Save second category - should merge
		mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedData));
		saveFormData({ issue: 'Bug report' }, 'support');
		savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[2][1]);
		expect(savedData.support).toBeDefined();
		expect(savedData.contact).toBeDefined();
	});

	test('sets expiry timestamp and returns true on success', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		const result = saveFormData(formData, 'contact');

		expect(result).toBe(true);
		const expectedExpiry = mockDateNow + 24 * 60 * 60 * 1000;
		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			'test_form_expiry',
			expectedExpiry.toString()
		);
	});

	test('returns false when no user data (all empty fields)', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: '', email: '', phone: '' };

		const result = saveFormData(formData, 'contact');

		expect(result).toBe(false);
		expect(mockLocalStorage.setItem).not.toHaveBeenCalledWith(
			'test_form_data',
			expect.any(String)
		);
	});

	test('returns false when only system fields present', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { category: 'contact', attachments: [] };

		const result = saveFormData(formData, 'contact');

		expect(result).toBe(false);
	});

	test('handles localStorage setItem errors gracefully', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		mockLocalStorage.setItem.mockImplementation(() => {
			throw new Error('Storage quota exceeded');
		});

		const formData = { name: 'John Doe', email: 'john@example.com' };
		const result = saveFormData(formData, 'contact');

		expect(result).toBe(false);
	});

	test('handles localStorage getItem errors gracefully', () => {
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const formData = { name: 'John Doe', email: 'john@example.com' };
		const result = saveFormData(formData, 'contact');

		expect(result).toBe(false);
	});

	test('handles JSON.parse errors from corrupted existing data', () => {
		mockLocalStorage.getItem.mockReturnValue('invalid json {');

		const formData = { name: 'John Doe', email: 'john@example.com' };
		const result = saveFormData(formData, 'contact');

		// loadAllFormData catches parse error and returns null, which is treated as no existing data
		// But the overall operation will likely fail or return false due to error handling
		expect(result).toBe(false);
	});

	test('filters out falsy values (false and 0) due to falsy check', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			subscribe: false,
			age: 0
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		// The implementation uses !formData[key] which filters out false and 0
		expect(savedData.contact.subscribe).toBeUndefined();
		expect(savedData.contact.age).toBeUndefined();
		expect(savedData.contact.name).toBe('John Doe');
	});

	test('overwrites existing data for same category', () => {
		const existingData = {
			contact: { name: 'Old Name', email: 'old@example.com' }
		};
		mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

		const formData = { name: 'New Name', email: 'new@example.com' };
		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact.name).toBe('New Name');
		expect(savedData.contact.email).toBe('new@example.com');
	});
});

describe('loadFormData', () => {
	let mockDateNow: number;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns null in non-browser environment', () => {
		mockIsBrowser = false;
		const result = loadFormData('contact');

		expect(result).toBeNull();
		expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
	});

	test('loads saved data for category', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow + 1000000; // Not expired
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toEqual({ name: 'John Doe', email: 'john@example.com' });
	});

	test('handles missing data scenarios', () => {
		const expiryTime = mockDateNow + 1000000;

		// Non-existent category
		const savedData = {
			support: { name: 'Jane Doe', issue: 'Bug' }
		};
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});
		expect(loadFormData('contact')).toBeNull();

		// Empty storage
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(loadFormData('contact')).toBeNull();

		// Empty data object
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});
		expect(loadFormData('contact')).toBeNull();
	});

	test('returns null when data is expired', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow - 1000; // Expired
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toBeNull();
	});

	test('clears expired data automatically', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow - 1000; // Expired
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		loadFormData('contact');

		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_data');
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_expiry');
	});

	test('handles localStorage getItem errors gracefully', () => {
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = loadFormData('contact');

		expect(result).toBeNull();
	});

	test('handles JSON.parse errors gracefully', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return 'invalid json {';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toBeNull();
	});

	test('returns null when no expiry set', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return null;
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toBeNull();
	});

	test('loads multiple fields correctly', () => {
		const savedData = {
			contact: {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '555-1234',
				address: '123 Main St',
				city: 'New York',
				zip: '10001',
				newsletter: true,
				age: 30
			}
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toEqual(savedData.contact);
	});

	test('handles complex nested data structures', () => {
		const savedData = {
			contact: {
				name: 'John Doe',
				preferences: {
					newsletter: true,
					notifications: false
				},
				tags: ['customer', 'premium']
			}
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toEqual(savedData.contact);
		expect(result?.preferences).toEqual({ newsletter: true, notifications: false });
		expect(result?.tags).toEqual(['customer', 'premium']);
	});
});

describe('clearFormData', () => {
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		mockIsBrowser = true;

		// Create a realistic storage mock that persists state
		mockStorage = {};
		mockLocalStorage.getItem.mockImplementation((key) => mockStorage[key] || null);
		mockLocalStorage.setItem.mockImplementation((key, value) => {
			mockStorage[key] = value;
		});
		mockLocalStorage.removeItem.mockImplementation((key) => {
			delete mockStorage[key];
		});

		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockStorage = {};
	});

	test('returns false in non-browser environment', () => {
		mockIsBrowser = false;
		const result = clearFormData('contact');

		expect(result).toBe(false);
		expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
	});

	test('clears specific category while preserving others', () => {
		// Save data first
		saveFormData({ name: 'John Doe', email: 'john@example.com' }, 'contact');
		saveFormData({ issue: 'Bug report' }, 'support');

		const result = clearFormData('contact');

		expect(result).toBe(true);
		const updatedData = JSON.parse(mockStorage['test_form_data']);
		expect(updatedData.contact).toBeUndefined();
		expect(updatedData.support).toBeDefined();
		expect(updatedData.support.issue).toBe('Bug report');
	});

	test('handles edge cases gracefully', () => {
		// Non-existent category
		saveFormData({ issue: 'Bug report' }, 'support');
		expect(clearFormData('contact')).toBe(true);

		// Clear already cleared category
		saveFormData({ name: 'John' }, 'test');
		clearFormData('test');
		expect(clearFormData('test')).toBe(true);

		// Empty storage
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(clearFormData('contact')).toBe(true);

		// Invalid JSON
		mockStorage['test_form_data'] = 'invalid json';
		mockStorage['test_form_expiry'] = (Date.now() + 1000000).toString();
		expect(clearFormData('contact')).toBe(true);
	});

	test('handles localStorage errors gracefully', () => {
		// Save data first
		saveFormData({ name: 'John Doe' }, 'contact');

		// Now make setItem throw error
		mockLocalStorage.setItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = clearFormData('contact');

		expect(result).toBe(false);
	});

	test('updates localStorage correctly', () => {
		// Save data for multiple categories
		saveFormData({ name: 'John Doe' }, 'contact');
		saveFormData({ issue: 'Bug' }, 'support');
		saveFormData({ rating: 5 }, 'feedback');

		// Clear setItem calls from saves
		mockLocalStorage.setItem.mockClear();

		clearFormData('support');

		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			'test_form_data',
			expect.any(String)
		);
		const updatedData = JSON.parse(mockStorage['test_form_data']);
		expect(Object.keys(updatedData)).toHaveLength(2);
		expect(updatedData.contact).toBeDefined();
		expect(updatedData.feedback).toBeDefined();
	});

	test('handles localStorage setItem errors', () => {
		// Save data first
		saveFormData({ name: 'John Doe' }, 'contact');

		// Now make setItem throw error
		mockLocalStorage.setItem.mockImplementation(() => {
			throw new Error('Storage quota exceeded');
		});

		const result = clearFormData('contact');

		expect(result).toBe(false);
	});
});

describe('clearAllFormData', () => {
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		mockIsBrowser = true;

		// Create a realistic storage mock that persists state
		mockStorage = {};
		mockLocalStorage.getItem.mockImplementation((key) => mockStorage[key] || null);
		mockLocalStorage.setItem.mockImplementation((key, value) => {
			mockStorage[key] = value;
		});
		mockLocalStorage.removeItem.mockImplementation((key) => {
			delete mockStorage[key];
		});
		mockLocalStorage.clear.mockImplementation(() => {
			mockStorage = {};
		});

		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockStorage = {};
	});

	test('returns false in non-browser environment', () => {
		mockIsBrowser = false;
		const result = clearAllFormData();

		expect(result).toBe(false);
		expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
	});

	test('successfully removes both storage keys', () => {
		const result = clearAllFormData();

		expect(result).toBe(true);
		expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_data');
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_expiry');
	});

	test('handles localStorage errors gracefully', () => {
		mockLocalStorage.removeItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = clearAllFormData();

		expect(result).toBe(false);
	});

	test('handles multiple calls and empty storage', () => {
		// Can be called multiple times safely
		expect(clearAllFormData()).toBe(true);
		expect(clearAllFormData()).toBe(true);
		expect(clearAllFormData()).toBe(true);

		// Works when storage is already empty
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(clearAllFormData()).toBe(true);
	});

	test('handles partial removal errors', () => {
		let callCount = 0;
		mockLocalStorage.removeItem.mockImplementation(() => {
			callCount++;
			if (callCount === 2) {
				throw new Error('Failed to remove expiry');
			}
		});

		const result = clearAllFormData();

		expect(result).toBe(false);
	});
});

describe('getDataExpiry', () => {
	let mockDateNow: number;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns null in non-browser environment', () => {
		mockIsBrowser = false;
		const result = getDataExpiry();

		expect(result).toBeNull();
		expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
	});

	test('returns Date object for valid timestamps', () => {
		// Current + future timestamp
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockReturnValue(expiryTime.toString());
		let result = getDataExpiry();
		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(expiryTime);

		// Different timestamp
		const otherExpiry = 1609545600000;
		mockLocalStorage.getItem.mockReturnValue(otherExpiry.toString());
		result = getDataExpiry();
		expect(result?.getTime()).toBe(otherExpiry);
	});

	test('returns null for missing or errored expiry', () => {
		// No expiry set
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(getDataExpiry()).toBeNull();

		// Parse errors
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});
		expect(getDataExpiry()).toBeNull();
	});

	test('handles invalid timestamp values', () => {
		// Invalid strings
		mockLocalStorage.getItem.mockReturnValue('not a number');
		let result = getDataExpiry();
		expect(result).toBeInstanceOf(Date);
		expect(isNaN(result!.getTime())).toBe(true);

		// Non-numeric values
		mockLocalStorage.getItem.mockReturnValue('abc123');
		result = getDataExpiry();
		expect(result).toBeInstanceOf(Date);
		expect(isNaN(result!.getTime())).toBe(true);
	});

	test('handles edge case timestamp values', () => {
		// Negative timestamps
		mockLocalStorage.getItem.mockReturnValue('-1000');
		let result = getDataExpiry();
		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(-1000);

		// Very large timestamps
		const largeTimestamp = 9999999999999;
		mockLocalStorage.getItem.mockReturnValue(largeTimestamp.toString());
		result = getDataExpiry();
		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(largeTimestamp);
	});
});

describe('hasSavedData', () => {
	let mockDateNow: number;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns false in non-browser environment', () => {
		mockIsBrowser = false;
		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('returns true when data exists', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = hasSavedData();

		expect(result).toBe(true);
	});

	test('returns false for various empty/invalid data scenarios', () => {
		const expiryTime = mockDateNow + 1000000;

		// No data exists
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(hasSavedData()).toBe(false);

		// Expired data
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiredTime = mockDateNow - 1000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiredTime.toString();
			return null;
		});
		expect(hasSavedData()).toBe(false);

		// Empty data object
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});
		expect(hasSavedData()).toBe(false);
	});

	test('handles edge cases gracefully', () => {
		// After clearAll (empty storage)
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(hasSavedData()).toBe(false);

		// localStorage errors
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});
		expect(hasSavedData()).toBe(false);
	});

	test('handles corrupted data', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return 'invalid json';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = hasSavedData();

		expect(result).toBe(false);
	});
});

describe('getSavedCategories', () => {
	let mockDateNow: number;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);
		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('returns empty array in non-browser environment', () => {
		mockIsBrowser = false;
		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('returns array of category names', () => {
		const savedData = {
			contact: { name: 'John Doe' },
			support: { issue: 'Bug' },
			feedback: { rating: 5 }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toEqual(['contact', 'support', 'feedback']);
	});

	test('returns empty array when no data', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('returns empty array when data is expired', () => {
		const savedData = {
			contact: { name: 'John Doe' }
		};
		const expiryTime = mockDateNow - 1000; // Expired
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('handles edge cases gracefully', () => {
		const expiryTime = mockDateNow + 1000000;

		// After clearAll (no data)
		mockLocalStorage.getItem.mockReturnValue(null);
		expect(getSavedCategories()).toEqual([]);

		// localStorage errors
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});
		expect(getSavedCategories()).toEqual([]);

		// Empty object
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});
		expect(getSavedCategories()).toEqual([]);

		// Corrupted data
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return 'invalid json';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});
		expect(getSavedCategories()).toEqual([]);
	});
});

describe('isStorableFormData', () => {
	test('returns true for valid object', () => {
		const obj = { name: 'John', email: 'john@example.com' };
		const result = isStorableFormData(obj);

		expect(result).toBe(true);
	});

	test('returns false for non-object types', () => {
		expect(isStorableFormData(null)).toBe(false);
		expect(isStorableFormData(undefined)).toBe(false);
		expect(isStorableFormData([1, 2, 3])).toBe(false);
	});

	test('returns false for primitive types', () => {
		expect(isStorableFormData('hello')).toBe(false);
		expect(isStorableFormData(123)).toBe(false);
		expect(isStorableFormData(true)).toBe(false);
	});

	test('returns true for empty object', () => {
		const result = isStorableFormData({});

		expect(result).toBe(true);
	});

	test('returns true for object with properties', () => {
		const obj = {
			name: 'John',
			age: 30,
			active: true,
			tags: ['user', 'premium']
		};
		const result = isStorableFormData(obj);

		expect(result).toBe(true);
	});

	test('handles complex objects', () => {
		const obj = {
			nested: {
				deep: {
					value: 'test'
				}
			},
			array: [1, 2, 3],
			mixed: {
				num: 42,
				str: 'text'
			}
		};
		const result = isStorableFormData(obj);

		expect(result).toBe(true);
	});
});

describe('sanitizeForStorage', () => {
	beforeEach(() => {
		mockIsBrowser = true;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test('filters out excluded field types', () => {
		const mockFileList = {
			length: 1,
			item: (index: number) => new File(['content'], 'test.txt')
		};
		Object.setPrototypeOf(mockFileList, FileList.prototype);

		const testCases = [
			{ name: 'attachments field', data: { name: 'John', attachments: [{ name: 'file.pdf' }] }, excluded: 'attachments' },
			{ name: 'category field', data: { name: 'John', category: 'support' }, excluded: 'category' },
			{ name: 'File instances', data: { name: 'John', file: new File([''], 'test.txt') }, excluded: 'file' },
			{ name: 'FileList instances', data: { name: 'John', files: mockFileList }, excluded: 'files' },
			{ name: 'functions', data: { name: 'John', fn: () => {} }, excluded: 'fn' },
			{ name: 'null values', data: { name: 'John', nullField: null }, excluded: 'nullField' },
			{ name: 'undefined values', data: { name: 'John', undefinedField: undefined }, excluded: 'undefinedField' },
			{ name: 'empty strings', data: { name: 'John', empty: '', message: '' }, excluded: 'empty' }
		];

		testCases.forEach(({ name: caseName, data, excluded }) => {
			const result = sanitizeForStorage(data);
			expect(result).not.toHaveProperty(excluded);
			expect(result).toHaveProperty('name', 'John');
		});
	});

	test('preserves valid primitive values and arrays', () => {
		const formData = {
			// Strings
			name: 'John Doe',
			email: 'john@example.com',
			message: 'Hello world',
			// Numbers
			age: 30,
			score: 95,
			zero: 0,
			// Booleans
			subscribe: true,
			verified: false,
			// Arrays
			tags: ['customer', 'premium'],
			scores: [90, 85, 95]
		};

		const result = sanitizeForStorage(formData);

		expect(result.name).toBe('John Doe');
		expect(result.email).toBe('john@example.com');
		expect(result.message).toBe('Hello world');
		expect(result.age).toBe(30);
		expect(result.score).toBe(95);
		expect(result.zero).toBe(0);
		expect(result.subscribe).toBe(true);
		expect(result.verified).toBe(false);
		expect(result.tags).toEqual(['customer', 'premium']);
		expect(result.scores).toEqual([90, 85, 95]);
	});

	test('keeps nested objects', () => {
		const formData = {
			name: 'John Doe',
			preferences: {
				newsletter: true,
				notifications: false
			}
		};

		const result = sanitizeForStorage(formData);

		expect(result.preferences).toEqual({
			newsletter: true,
			notifications: false
		});
	});

	test('handles non-serializable and edge case inputs', () => {
		// Circular references
		const formData: any = {
			name: 'John Doe'
		};
		formData.self = formData;
		let result = sanitizeForStorage(formData);
		expect(result.name).toBe('John Doe');
		expect(result.self).toBeUndefined();

		// Non-serializable values (Symbol, BigInt)
		const formData2 = {
			name: 'John Doe',
			symbol: Symbol('test'),
			bigint: BigInt(9007199254740991)
		};
		result = sanitizeForStorage(formData2);
		expect(result.name).toBe('John Doe');

		// Non-object inputs
		expect(sanitizeForStorage(null)).toEqual({});
		expect(sanitizeForStorage(undefined)).toEqual({});
		expect(sanitizeForStorage('string')).toEqual({});
		expect(sanitizeForStorage(123)).toEqual({});
		expect(sanitizeForStorage([1, 2, 3])).toEqual({});
	});

	test('handles complex mixed data', () => {
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			age: 30,
			subscribe: true,
			category: 'contact',
			attachments: [],
			empty: '',
			nullValue: null,
			callback: () => {},
			preferences: {
				newsletter: true,
				language: 'en'
			},
			tags: ['user', 'premium']
		};

		const result = sanitizeForStorage(formData);

		expect(result.name).toBe('John Doe');
		expect(result.email).toBe('john@example.com');
		expect(result.age).toBe(30);
		expect(result.subscribe).toBe(true);
		expect(result.preferences).toEqual({ newsletter: true, language: 'en' });
		expect(result.tags).toEqual(['user', 'premium']);
		expect(result.category).toBeUndefined();
		expect(result.attachments).toBeUndefined();
		expect(result.empty).toBeUndefined();
		expect(result.nullValue).toBeUndefined();
		expect(result.callback).toBeUndefined();
	});
});

describe('Integration Tests', () => {
	let mockDateNow: number;
	let mockStorage: Record<string, string>;

	beforeEach(() => {
		mockIsBrowser = true;
		mockDateNow = 1609459200000; // 2021-01-01 00:00:00 UTC
		vi.spyOn(Date, 'now').mockReturnValue(mockDateNow);

		// Create a realistic storage mock that persists state
		mockStorage = {};
		mockLocalStorage.getItem.mockImplementation((key) => mockStorage[key] || null);
		mockLocalStorage.setItem.mockImplementation((key, value) => {
			mockStorage[key] = value;
		});
		mockLocalStorage.removeItem.mockImplementation((key) => {
			delete mockStorage[key];
		});
		mockLocalStorage.clear.mockImplementation(() => {
			mockStorage = {};
		});

		vi.stubGlobal('localStorage', mockLocalStorage);
		mockLocalStorage.getItem.mockClear();
		mockLocalStorage.setItem.mockClear();
		mockLocalStorage.removeItem.mockClear();
		mockLocalStorage.clear.mockClear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		mockStorage = {};
	});

	test('save multiple categories → load each independently', () => {
		// Save contact
		const contactData = { name: 'John Doe', email: 'john@example.com' };
		saveFormData(contactData, 'contact');

		// Save support
		const supportData = { issue: 'Bug report', priority: 'high' };
		saveFormData(supportData, 'support');

		// Load each independently
		const loadedContact = loadFormData('contact');
		const loadedSupport = loadFormData('support');

		expect(loadedContact).toEqual({ name: 'John Doe', email: 'john@example.com' });
		expect(loadedSupport).toEqual({ issue: 'Bug report', priority: 'high' });
	});

	test('save → wait for expiry → load returns null', () => {
		const formData = { name: 'John Doe', email: 'john@example.com' };

		// Save at time T
		saveFormData(formData, 'contact');

		// Fast forward time past expiry
		const newTime = mockDateNow + 25 * 60 * 60 * 1000; // 25 hours later
		vi.spyOn(Date, 'now').mockReturnValue(newTime);

		// Load should return null and clear data
		const loaded = loadFormData('contact');
		expect(loaded).toBeNull();
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_data');
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_expiry');
	});

	test('expiry timestamp updates on save', () => {
		// First save
		saveFormData({ name: 'John' }, 'contact');
		const firstExpiry = mockStorage['test_form_expiry'];

		// Advance time
		const newTime = mockDateNow + 1000000;
		vi.spyOn(Date, 'now').mockReturnValue(newTime);

		// Second save
		saveFormData({ name: 'John', email: 'john@example.com' }, 'contact');
		const secondExpiry = mockStorage['test_form_expiry'];

		// Expiry should be updated
		expect(parseInt(secondExpiry)).toBeGreaterThan(parseInt(firstExpiry));
	});

	test('category-specific operations dont affect others', () => {
		// Save two categories
		saveFormData({ name: 'John' }, 'contact');
		saveFormData({ issue: 'Bug' }, 'support');

		// Clear one category
		clearFormData('contact');

		// Check that support still exists
		const supportData = loadFormData('support');
		expect(supportData).toEqual({ issue: 'Bug' });

		// Check that contact is gone
		const contactData = loadFormData('contact');
		expect(contactData).toBeNull();
	});

	test('browser environment check affects all operations', () => {
		// Test with browser environment - save some data first
		mockIsBrowser = true;
		expect(saveFormData({ name: 'John' }, 'contact')).toBe(true);

		// Verify it was saved
		expect(hasSavedData()).toBe(true);

		// Switch to non-browser - new operations should fail
		mockIsBrowser = false;

		expect(saveFormData({ name: 'Jane' }, 'support')).toBe(false);
		expect(loadFormData('contact')).toBeNull();
		expect(clearFormData('contact')).toBe(false);
		expect(clearAllFormData()).toBe(false);
		expect(getDataExpiry()).toBeNull();
		expect(hasSavedData()).toBe(false);
		expect(getSavedCategories()).toEqual([]);
	});
});
