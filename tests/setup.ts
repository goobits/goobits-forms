import '@testing-library/jest-dom/vitest';
import { vi, expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

// Extend Vitest matchers with axe-core accessibility matchers
expect.extend(toHaveNoViolations);

// Mock localStorage API
const localStorageMock = {
	getItem: vi.fn((_key: string) => null),
	setItem: vi.fn((_key: string, _value: string) => {}),
	removeItem: vi.fn((_key: string) => {}),
	clear: vi.fn(() => {}),
	length: 0,
	key: vi.fn((_index: number) => null)
};

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
	writable: true
});

// Mock sessionStorage API
const sessionStorageMock = {
	getItem: vi.fn((_key: string) => null),
	setItem: vi.fn((_key: string, _value: string) => {}),
	removeItem: vi.fn((_key: string) => {}),
	clear: vi.fn(() => {}),
	length: 0,
	key: vi.fn((_index: number) => null)
};

Object.defineProperty(window, 'sessionStorage', {
	value: sessionStorageMock,
	writable: true
});

// Mock fetch API
global.fetch = vi.fn((_url: string | Request, _init?: RequestInit) =>
	Promise.resolve(
		new Response(JSON.stringify({}), {
			status: 200,
			statusText: 'OK',
			headers: {
				'Content-Type': 'application/json'
			}
		})
	)
);

// Mock grecaptcha for reCAPTCHA
declare global {
	interface Window {
		grecaptcha?: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options: { action: string }) => Promise<string>;
			reset: (widgetId?: number) => void;
			getResponse: (widgetId?: number) => string;
			render: (container: string | Element, options: Record<string, unknown>) => number;
		};
	}
}

global.grecaptcha = {
	ready: vi.fn((_callback: () => void) => {
		_callback();
	}),
	execute: vi.fn(() => Promise.resolve('mock-recaptcha-token')),
	reset: vi.fn(),
	getResponse: vi.fn(() => 'mock-recaptcha-token'),
	render: vi.fn(() => 0)
};

Object.defineProperty(window, 'grecaptcha', {
	value: global.grecaptcha,
	writable: true
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	takeRecords() {
		return [];
	}
	unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
	constructor() {}
	disconnect() {}
	observe() {}
	unobserve() {}
} as any;

// Suppress console errors during tests (optional, can be disabled if needed)
const originalError = console.error;
beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === 'string' &&
			(args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
				args[0].includes('Not implemented: navigation'))
		) {
			return;
		}
		originalError.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
});

// Reset all mocks before each test
beforeEach(() => {
	vi.clearAllMocks();
});
