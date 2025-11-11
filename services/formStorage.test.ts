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

	test('filters out attachments field', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			attachments: [{ name: 'file.pdf', size: 1000 }]
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact).toBeDefined();
		expect(savedData.contact.attachments).toBeUndefined();
	});

	test('filters out empty string values', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			phone: '',
			message: ''
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact.phone).toBeUndefined();
		expect(savedData.contact.message).toBeUndefined();
	});

	test('filters out null values', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			phone: null
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact.phone).toBeUndefined();
	});

	test('filters out undefined values', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			phone: undefined
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact.phone).toBeUndefined();
	});

	test('stores data by category', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.contact).toBeDefined();
		expect(savedData.contact.name).toBe('John Doe');
		expect(savedData.contact.email).toBe('john@example.com');
	});

	test('merges with existing data for other categories', () => {
		const existingData = {
			support: { name: 'Jane Doe', issue: 'Bug report' }
		};
		mockLocalStorage.getItem.mockReturnValue(JSON.stringify(existingData));

		const formData = { name: 'John Doe', email: 'john@example.com' };
		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		expect(savedData.support).toBeDefined();
		expect(savedData.support.name).toBe('Jane Doe');
		expect(savedData.contact).toBeDefined();
		expect(savedData.contact.name).toBe('John Doe');
	});

	test('sets expiry timestamp', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		saveFormData(formData, 'contact');

		const expectedExpiry = mockDateNow + 24 * 60 * 60 * 1000;
		expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
			'test_form_expiry',
			expectedExpiry.toString()
		);
	});

	test('returns true on success', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = { name: 'John Doe', email: 'john@example.com' };

		const result = saveFormData(formData, 'contact');

		expect(result).toBe(true);
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

	test('filters out boolean false values due to falsy check', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			subscribe: false
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		// The implementation uses !formData[key] which filters out false
		expect(savedData.contact.subscribe).toBeUndefined();
	});

	test('filters out numeric zero values due to falsy check', () => {
		mockLocalStorage.getItem.mockReturnValue(null);
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			age: 0
		};

		saveFormData(formData, 'contact');

		const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
		// The implementation uses !formData[key] which filters out 0
		expect(savedData.contact.age).toBeUndefined();
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

	test('returns null for non-existent category', () => {
		const savedData = {
			support: { name: 'Jane Doe', issue: 'Bug' }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toBeNull();
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

	test('returns correct data structure', () => {
		const savedData = {
			contact: {
				name: 'John Doe',
				email: 'john@example.com',
				phone: '555-1234',
				message: 'Hello world'
			}
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = loadFormData('contact');

		expect(result).toHaveProperty('name');
		expect(result).toHaveProperty('email');
		expect(result).toHaveProperty('phone');
		expect(result).toHaveProperty('message');
	});

	test('handles empty storage', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = loadFormData('contact');

		expect(result).toBeNull();
	});

	test('handles empty data object', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
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

	test('clears data for specific category', () => {
		// Save data first using the real saveFormData function
		saveFormData({ name: 'John Doe', email: 'john@example.com' }, 'contact');
		saveFormData({ issue: 'Bug report' }, 'support');

		const result = clearFormData('contact');

		expect(result).toBe(true);
		const updatedData = JSON.parse(mockStorage['test_form_data']);
		expect(updatedData.contact).toBeUndefined();
	});

	test('preserves other category data', () => {
		// Save data first
		saveFormData({ name: 'John Doe', email: 'john@example.com' }, 'contact');
		saveFormData({ issue: 'Bug report' }, 'support');

		clearFormData('contact');

		const updatedData = JSON.parse(mockStorage['test_form_data']);
		expect(updatedData.support).toBeDefined();
		expect(updatedData.support.issue).toBe('Bug report');
	});

	test('returns true on success', () => {
		// Save data first
		saveFormData({ name: 'John Doe', email: 'john@example.com' }, 'contact');

		const result = clearFormData('contact');

		expect(result).toBe(true);
	});

	test('handles non-existent category gracefully', () => {
		// Save data for one category only
		saveFormData({ issue: 'Bug report' }, 'support');

		const result = clearFormData('contact');

		expect(result).toBe(true);
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

	test('handles clearing already cleared category', () => {
		// Save data for one category
		saveFormData({ issue: 'Bug report' }, 'support');

		const result = clearFormData('contact');

		expect(result).toBe(true);
	});

	test('handles empty storage', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = clearFormData('contact');

		expect(result).toBe(true);
	});

	test('handles JSON.parse errors', () => {
		// Manually corrupt the storage
		mockStorage['test_form_data'] = 'invalid json';
		mockStorage['test_form_expiry'] = (Date.now() + 1000000).toString();

		const result = clearFormData('contact');

		// loadAllFormData catches parse error and returns null, clearFormData returns true
		expect(result).toBe(true);
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

	test('removes data storage key', () => {
		const result = clearAllFormData();

		expect(result).toBe(true);
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_data');
	});

	test('removes expiry key', () => {
		const result = clearAllFormData();

		expect(result).toBe(true);
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_expiry');
	});

	test('returns true on success', () => {
		const result = clearAllFormData();

		expect(result).toBe(true);
	});

	test('handles localStorage errors gracefully', () => {
		mockLocalStorage.removeItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = clearAllFormData();

		expect(result).toBe(false);
	});

	test('clears all categories at once', () => {
		clearAllFormData();

		expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_data');
		expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test_form_expiry');
	});

	test('can be called multiple times safely', () => {
		const result1 = clearAllFormData();
		const result2 = clearAllFormData();
		const result3 = clearAllFormData();

		expect(result1).toBe(true);
		expect(result2).toBe(true);
		expect(result3).toBe(true);
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

	test('removes both keys in correct order', () => {
		clearAllFormData();

		expect(mockLocalStorage.removeItem.mock.calls[0][0]).toBe('test_form_data');
		expect(mockLocalStorage.removeItem.mock.calls[1][0]).toBe('test_form_expiry');
	});

	test('works when storage is already empty', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = clearAllFormData();

		expect(result).toBe(true);
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

	test('returns Date object for valid expiry', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockReturnValue(expiryTime.toString());

		const result = getDataExpiry();

		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(expiryTime);
	});

	test('returns null when no expiry set', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = getDataExpiry();

		expect(result).toBeNull();
	});

	test('returns null on parse errors', () => {
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = getDataExpiry();

		expect(result).toBeNull();
	});

	test('parses timestamp correctly', () => {
		const expiryTime = 1609545600000; // 2021-01-02 00:00:00 UTC
		mockLocalStorage.getItem.mockReturnValue(expiryTime.toString());

		const result = getDataExpiry();

		expect(result?.getTime()).toBe(expiryTime);
	});

	test('returns future date', () => {
		const expiryTime = mockDateNow + 24 * 60 * 60 * 1000; // 24 hours from now
		mockLocalStorage.getItem.mockReturnValue(expiryTime.toString());

		const result = getDataExpiry();

		expect(result).toBeInstanceOf(Date);
		expect(result!.getTime()).toBeGreaterThan(mockDateNow);
	});

	test('handles invalid timestamp strings', () => {
		mockLocalStorage.getItem.mockReturnValue('not a number');

		const result = getDataExpiry();

		// parseInt returns NaN for invalid strings, new Date(NaN) is still a Date
		expect(result).toBeInstanceOf(Date);
		expect(isNaN(result!.getTime())).toBe(true);
	});

	test('handles non-numeric expiry values', () => {
		mockLocalStorage.getItem.mockReturnValue('abc123');

		const result = getDataExpiry();

		expect(result).toBeInstanceOf(Date);
		expect(isNaN(result!.getTime())).toBe(true);
	});

	test('handles negative timestamps', () => {
		mockLocalStorage.getItem.mockReturnValue('-1000');

		const result = getDataExpiry();

		expect(result).toBeInstanceOf(Date);
		expect(result?.getTime()).toBe(-1000);
	});

	test('handles very large timestamps', () => {
		const largeTimestamp = 9999999999999;
		mockLocalStorage.getItem.mockReturnValue(largeTimestamp.toString());

		const result = getDataExpiry();

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

	test('returns false when no data exists', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('returns false when data is expired', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow - 1000; // Expired
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('returns false for empty data object', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('handles multiple categories', () => {
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

		const result = hasSavedData();

		expect(result).toBe(true);
	});

	test('returns false after clearAll', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('handles localStorage errors gracefully', () => {
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = hasSavedData();

		expect(result).toBe(false);
	});

	test('returns false when expiry is missing', () => {
		const savedData = {
			contact: { name: 'John Doe' }
		};
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return null;
			return null;
		});

		const result = hasSavedData();

		expect(result).toBe(false);
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

	test('returns true for single category with data', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com', phone: '555-1234' }
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

	test('returns all category keys', () => {
		const savedData = {
			contact: { name: 'John' },
			support: { issue: 'Bug' }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toHaveLength(2);
		expect(result).toContain('contact');
		expect(result).toContain('support');
	});

	test('handles multiple categories', () => {
		const savedData = {
			cat1: { field: 'value1' },
			cat2: { field: 'value2' },
			cat3: { field: 'value3' },
			cat4: { field: 'value4' }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toHaveLength(4);
	});

	test('returns empty array after clearAll', () => {
		mockLocalStorage.getItem.mockReturnValue(null);

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('handles localStorage errors gracefully', () => {
		mockLocalStorage.getItem.mockImplementation(() => {
			throw new Error('Storage access denied');
		});

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('returns empty array for empty object', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return '{}';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('handles corrupted data', () => {
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return 'invalid json';
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toEqual([]);
	});

	test('returns single category correctly', () => {
		const savedData = {
			contact: { name: 'John Doe', email: 'john@example.com' }
		};
		const expiryTime = mockDateNow + 1000000;
		mockLocalStorage.getItem.mockImplementation((key) => {
			if (key === 'test_form_data') return JSON.stringify(savedData);
			if (key === 'test_form_expiry') return expiryTime.toString();
			return null;
		});

		const result = getSavedCategories();

		expect(result).toEqual(['contact']);
	});
});

describe('isStorableFormData', () => {
	test('returns true for valid object', () => {
		const obj = { name: 'John', email: 'john@example.com' };
		const result = isStorableFormData(obj);

		expect(result).toBe(true);
	});

	test('returns false for null', () => {
		const result = isStorableFormData(null);

		expect(result).toBe(false);
	});

	test('returns false for undefined', () => {
		const result = isStorableFormData(undefined);

		expect(result).toBe(false);
	});

	test('returns false for arrays', () => {
		const result = isStorableFormData([1, 2, 3]);

		expect(result).toBe(false);
	});

	test('returns false for string primitive', () => {
		const result = isStorableFormData('hello');

		expect(result).toBe(false);
	});

	test('returns false for number primitive', () => {
		const result = isStorableFormData(123);

		expect(result).toBe(false);
	});

	test('returns false for boolean primitive', () => {
		const result = isStorableFormData(true);

		expect(result).toBe(false);
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

	test('filters out attachments field', () => {
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			attachments: [{ name: 'file.pdf' }]
		};

		const result = sanitizeForStorage(formData);

		expect(result.attachments).toBeUndefined();
		expect(result.name).toBe('John Doe');
		expect(result.email).toBe('john@example.com');
	});

	test('filters out category field', () => {
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			category: 'contact'
		};

		const result = sanitizeForStorage(formData);

		expect(result.category).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out File instances', () => {
		const formData = {
			name: 'John Doe',
			file: new File(['content'], 'test.txt')
		};

		const result = sanitizeForStorage(formData);

		expect(result.file).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out FileList instances', () => {
		// Create a mock FileList
		const mockFileList = {
			length: 1,
			item: (index: number) => new File(['content'], 'test.txt')
		};
		Object.setPrototypeOf(mockFileList, FileList.prototype);

		const formData = {
			name: 'John Doe',
			files: mockFileList
		};

		const result = sanitizeForStorage(formData);

		expect(result.files).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out functions', () => {
		const formData = {
			name: 'John Doe',
			callback: () => console.log('test')
		};

		const result = sanitizeForStorage(formData);

		expect(result.callback).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out null values', () => {
		const formData = {
			name: 'John Doe',
			phone: null
		};

		const result = sanitizeForStorage(formData);

		expect(result.phone).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out undefined values', () => {
		const formData = {
			name: 'John Doe',
			email: undefined
		};

		const result = sanitizeForStorage(formData);

		expect(result.email).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('filters out empty strings', () => {
		const formData = {
			name: 'John Doe',
			phone: '',
			message: ''
		};

		const result = sanitizeForStorage(formData);

		expect(result.phone).toBeUndefined();
		expect(result.message).toBeUndefined();
		expect(result.name).toBe('John Doe');
	});

	test('keeps valid string values', () => {
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			message: 'Hello world'
		};

		const result = sanitizeForStorage(formData);

		expect(result.name).toBe('John Doe');
		expect(result.email).toBe('john@example.com');
		expect(result.message).toBe('Hello world');
	});

	test('keeps valid number values', () => {
		const formData = {
			name: 'John Doe',
			age: 30,
			score: 95,
			zero: 0
		};

		const result = sanitizeForStorage(formData);

		expect(result.age).toBe(30);
		expect(result.score).toBe(95);
		expect(result.zero).toBe(0);
	});

	test('keeps valid boolean values', () => {
		const formData = {
			name: 'John Doe',
			subscribe: true,
			verified: false
		};

		const result = sanitizeForStorage(formData);

		expect(result.subscribe).toBe(true);
		expect(result.verified).toBe(false);
	});

	test('keeps arrays of primitives', () => {
		const formData = {
			name: 'John Doe',
			tags: ['customer', 'premium'],
			scores: [90, 85, 95]
		};

		const result = sanitizeForStorage(formData);

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

	test('handles circular references gracefully', () => {
		const formData: any = {
			name: 'John Doe'
		};
		formData.self = formData; // Create circular reference

		const result = sanitizeForStorage(formData);

		expect(result.name).toBe('John Doe');
		expect(result.self).toBeUndefined();
	});

	test('handles non-serializable values', () => {
		const formData = {
			name: 'John Doe',
			symbol: Symbol('test'),
			bigint: BigInt(9007199254740991)
		};

		const result = sanitizeForStorage(formData);

		expect(result.name).toBe('John Doe');
		// Symbol and BigInt will either be filtered or handled by JSON.stringify
	});

	test('returns empty object for non-object input', () => {
		const result1 = sanitizeForStorage(null);
		const result2 = sanitizeForStorage(undefined);
		const result3 = sanitizeForStorage('string');
		const result4 = sanitizeForStorage(123);
		const result5 = sanitizeForStorage([1, 2, 3]);

		expect(result1).toEqual({});
		expect(result2).toEqual({});
		expect(result3).toEqual({});
		expect(result4).toEqual({});
		expect(result5).toEqual({});
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

	test('save → load → same data retrieved', () => {
		const formData = { name: 'John Doe', email: 'john@example.com' };

		// Save
		const saved = saveFormData(formData, 'contact');
		expect(saved).toBe(true);

		// Load - should retrieve same data
		const loaded = loadFormData('contact');
		expect(loaded).toEqual({ name: 'John Doe', email: 'john@example.com' });
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

	test('save → clear → load returns null', () => {
		const formData = { name: 'John Doe', email: 'john@example.com' };

		// Save
		saveFormData(formData, 'contact');

		// Clear
		clearFormData('contact');

		// Load
		const loaded = loadFormData('contact');
		expect(loaded).toBeNull();
	});

	test('save → clearAll → hasSavedData = false', () => {
		const formData = { name: 'John Doe', email: 'john@example.com' };

		// Save
		saveFormData(formData, 'contact');

		// Clear all
		clearAllFormData();

		// Check
		const hasData = hasSavedData();
		expect(hasData).toBe(false);
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

	test('multiple save operations update data', () => {
		// First save
		const formData1 = { name: 'John Doe', email: 'john@example.com' };
		saveFormData(formData1, 'contact');

		// Second save (update)
		const formData2 = { name: 'John Doe', email: 'newemail@example.com', phone: '555-1234' };
		saveFormData(formData2, 'contact');

		// Load
		const loaded = loadFormData('contact');
		expect(loaded?.email).toBe('newemail@example.com');
		expect(loaded?.phone).toBe('555-1234');
	});

	test('getSavedCategories returns all saved categories', () => {
		// Save multiple categories
		saveFormData({ name: 'John' }, 'contact');
		saveFormData({ issue: 'Bug' }, 'support');
		saveFormData({ rating: 5 }, 'feedback');

		// Get categories
		const categories = getSavedCategories();
		expect(categories).toContain('contact');
		expect(categories).toContain('support');
		expect(categories).toContain('feedback');
		expect(categories).toHaveLength(3);
	});

	test('data persistence across operations', () => {
		// Save data
		const formData = { name: 'John Doe', email: 'john@example.com' };
		saveFormData(formData, 'contact');

		// Check hasSavedData
		expect(hasSavedData()).toBe(true);

		// Check getSavedCategories
		expect(getSavedCategories()).toContain('contact');

		// Load data
		const loaded = loadFormData('contact');
		expect(loaded).toEqual({ name: 'John Doe', email: 'john@example.com' });
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

	test('save with sanitization → load clean data', () => {
		// Save data with fields that should be filtered
		const formData = {
			name: 'John Doe',
			email: 'john@example.com',
			category: 'contact',
			attachments: [{ name: 'file.pdf' }],
			empty: '',
			nullValue: null
		};

		saveFormData(formData, 'contact');

		// Load and verify only valid fields are present
		const loaded = loadFormData('contact');
		// Note: category is NOT filtered by saveFormData, only attachments and empty values
		expect(loaded).toHaveProperty('name', 'John Doe');
		expect(loaded).toHaveProperty('email', 'john@example.com');
		expect(loaded).toHaveProperty('category', 'contact');
		expect(loaded).not.toHaveProperty('attachments');
		expect(loaded).not.toHaveProperty('empty');
		expect(loaded).not.toHaveProperty('nullValue');
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
