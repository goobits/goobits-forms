/**
 * Test utilities for Svelte UI components
 *
 * This module provides custom render functions and test helpers for testing
 * Svelte components with Testing Library.
 */

import { render as testingLibraryRender, type RenderOptions } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { vi } from 'vitest';

/**
 * Custom render function that wraps Testing Library's render
 *
 * This function can be extended to add global providers, contexts,
 * or other common setup for all component tests.
 *
 * @example
 * ```ts
 * import { render } from './test-utils'
 * import MyComponent from './MyComponent.svelte'
 *
 * render(MyComponent, { props: { name: 'World' } })
 * ```
 */
export function render<T extends Component>(
	component: T,
	options?: RenderOptions<T>
) {
	// Add any global providers/context here in the future
	// For example: wrapping with modal provider, theme provider, etc.

	return testingLibraryRender(component, options);
}

/**
 * Creates a mock function for form submission handlers
 */
export function createSubmitHandler() {
	return vi.fn((event?: Event) => {
		event?.preventDefault();
	});
}

/**
 * Creates a mock function for event handlers
 */
export function createEventHandler() {
	return vi.fn();
}

/**
 * Helper to wait for async operations to complete
 */
export async function waitForAsync() {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Mock reCAPTCHA token for testing
 */
export const MOCK_RECAPTCHA_TOKEN = 'mock-recaptcha-token';

/**
 * Helper to mock window.matchMedia for responsive testing
 *
 * @example
 * ```ts
 * mockMatchMedia({ matches: true, media: '(min-width: 768px)' })
 * ```
 */
export function mockMatchMedia(options: { matches?: boolean; media?: string } = {}) {
	const { matches = false, media = '' } = options;

	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches,
			media: media || query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
}

/**
 * Helper to create test form data
 */
export function createFormData(data: Record<string, string | Blob>) {
	const formData = new FormData();
	Object.entries(data).forEach(([key, value]) => {
		formData.append(key, value);
	});
	return formData;
}

/**
 * Helper to get form validation errors from the DOM
 */
export function getValidationErrors(container: HTMLElement) {
	const errorElements = container.querySelectorAll('[data-testid*="error"], .error, [role="alert"]');
	return Array.from(errorElements).map((el) => el.textContent?.trim() || '');
}

/**
 * Helper to check if an element has accessible name
 */
export function hasAccessibleName(element: HTMLElement) {
	const ariaLabel = element.getAttribute('aria-label');
	const ariaLabelledBy = element.getAttribute('aria-labelledby');
	const hasLabelElement = !!element.closest('label') || !!document.querySelector(`label[for="${element.id}"]`);

	return !!(ariaLabel || ariaLabelledBy || hasLabelElement || element.textContent?.trim());
}

/**
 * Helper to check if an element is accessible
 */
export function checkAccessibility(element: HTMLElement) {
	const checks = {
		hasRole: !!element.getAttribute('role') || !!element.tagName.match(/^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/),
		hasAccessibleName: hasAccessibleName(element),
		isKeyboardAccessible: element.tabIndex >= 0 || ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
	};

	return {
		...checks,
		isAccessible: Object.values(checks).every(Boolean)
	};
}

/**
 * Common test IDs used across components
 */
export const testIds = {
	form: 'contact-form',
	input: (name: string) => `input-${name}`,
	error: (name: string) => `error-${name}`,
	submitButton: 'submit-button',
	successMessage: 'success-message',
	loadingIndicator: 'loading-indicator'
} as const;

/**
 * Mock implementations for common services
 */
export const mocks = {
	fetch: (response?: unknown, status = 200) => {
		return vi.fn().mockResolvedValue({
			ok: status >= 200 && status < 300,
			status,
			json: async () => response || {},
			text: async () => JSON.stringify(response || {})
		});
	},

	localStorage: {
		getItem: vi.fn((_key: string) => null),
		setItem: vi.fn((_key: string, _value: string) => {}),
		removeItem: vi.fn((_key: string) => {}),
		clear: vi.fn(() => {})
	},

	grecaptcha: {
		ready: vi.fn((callback: () => void) => callback()),
		execute: vi.fn(() => Promise.resolve(MOCK_RECAPTCHA_TOKEN)),
		reset: vi.fn(),
		getResponse: vi.fn(() => MOCK_RECAPTCHA_TOKEN),
		render: vi.fn(() => 0)
	}
};

/**
 * Helper to get all focusable elements within a container
 * Useful for testing keyboard navigation and focus management
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
	const focusableSelectors = [
		'a[href]',
		'button:not([disabled])',
		'textarea:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'[tabindex]:not([tabindex="-1"])'
	].join(', ');

	return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
}

/**
 * Helper to test keyboard navigation through elements
 * Simulates Tab key navigation and verifies focus order
 */
export function testTabOrder(elements: HTMLElement[]) {
	elements.forEach((element, index) => {
		element.focus();
		if (document.activeElement !== element) {
			throw new Error(`Element at index ${index} is not focusable: ${element.outerHTML}`);
		}
	});
}

/**
 * Helper to simulate keyboard events for accessibility testing
 */
export async function pressKey(
	element: HTMLElement,
	key: string,
	options: { shiftKey?: boolean; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean } = {}
): Promise<void> {
	element.dispatchEvent(
		new KeyboardEvent('keydown', {
			key,
			bubbles: true,
			cancelable: true,
			...options
		})
	);

	element.dispatchEvent(
		new KeyboardEvent('keyup', {
			key,
			bubbles: true,
			cancelable: true,
			...options
		})
	);

	await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Helper to check ARIA attributes on an element
 */
export function assertARIAAttributes(
	element: HTMLElement,
	attributes: Record<string, string>
): void {
	Object.entries(attributes).forEach(([attr, value]) => {
		const actualValue = element.getAttribute(attr);
		if (actualValue !== value) {
			throw new Error(
				`Expected ${attr} to be "${value}" but got "${actualValue}" on element: ${element.outerHTML}`
			);
		}
	});
}

/**
 * Helper to check if an element is visible (not hidden via CSS or attributes)
 */
export function isVisible(element: HTMLElement): boolean {
	if (!element) return false;

	const style = window.getComputedStyle(element);
	if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
		return false;
	}

	if (element.hasAttribute('hidden') || element.getAttribute('aria-hidden') === 'true') {
		return false;
	}

	return true;
}

/**
 * Helper to create mock file for upload testing
 */
export function createMockFile(name: string, size: number, type: string): File {
	const blob = new Blob(['a'.repeat(size)], { type });
	return new File([blob], name, { type });
}

// Re-export common testing utilities from Testing Library
export * from '@testing-library/svelte';
export { default as userEvent } from '@testing-library/user-event';
export { vi, expect, describe, it, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
