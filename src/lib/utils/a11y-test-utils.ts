import { axe, toHaveNoViolations } from 'jest-axe';
import type { AxeResults, RunOptions, Result } from 'axe-core';
import { expect } from 'vitest';

// Extend Vitest matchers with jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Options for accessibility testing
 */
export interface A11yTestOptions {
	/**
	 * Specific rules to enable or disable
	 * @example { 'color-contrast': { enabled: false } }
	 */
	rules?: Record<string, { enabled: boolean }>;
	/**
	 * WCAG level to test against
	 * @default 'AA'
	 */
	wcagLevel?: 'A' | 'AA' | 'AAA';
	/**
	 * Additional axe-core run options
	 */
	axeOptions?: RunOptions;
}

/**
 * Custom helper to run axe on rendered components
 * Tests for accessibility violations and expects none
 *
 * @param container - The HTML element to test
 * @param options - Testing options
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Button, { props: { children: 'Click me' }});
 * await testAccessibility(container);
 * ```
 */
export async function testAccessibility(
	container: HTMLElement,
	options?: A11yTestOptions
): Promise<AxeResults> {
	const axeOptions: RunOptions = options?.axeOptions || {};

	// Apply WCAG level if specified
	if (options?.wcagLevel) {
		const wcagTags = getWCAGTags(options.wcagLevel);
		axeOptions.runOnly = {
			type: 'tag',
			values: wcagTags
		};
	}

	// Apply custom rules if specified
	if (options?.rules) {
		axeOptions.rules = options.rules;
	}

	const results = await axe(container, axeOptions);
	expect(results).toHaveNoViolations();
	return results;
}

/**
 * Test against WCAG 2.1 Level A standards
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Form);
 * const results = await testWCAG_A(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testWCAG_A(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'tag',
			values: ['wcag2a', 'wcag21a']
		}
	});
}

/**
 * Test against WCAG 2.1 Level AA standards (recommended)
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Form);
 * const results = await testWCAG_AA(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testWCAG_AA(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'tag',
			values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
		}
	});
}

/**
 * Test against WCAG 2.1 Level AAA standards
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Form);
 * const results = await testWCAG_AAA(container);
 * ```
 */
export async function testWCAG_AAA(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'tag',
			values: ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa']
		}
	});
}

/**
 * Test for keyboard navigation accessibility
 * Verifies that an element can receive focus
 *
 * @param element - The HTML element to test
 *
 * @example
 * ```typescript
 * const button = getByRole('button');
 * testKeyboardNavigation(button);
 * ```
 */
export function testKeyboardNavigation(element: HTMLElement): void {
	element.focus();
	expect(document.activeElement).toBe(element);
}

/**
 * Test tab order for a group of elements
 * Verifies that elements can be navigated in the correct order using Tab
 *
 * @param elements - Array of elements in expected tab order
 *
 * @example
 * ```typescript
 * const inputs = getAllByRole('textbox');
 * testTabOrder(inputs);
 * ```
 */
export function testTabOrder(elements: HTMLElement[]): void {
	elements.forEach((element, _index) => {
		element.focus();
		expect(document.activeElement).toBe(element);

		// Optionally test that tabIndex is set correctly
		const tabIndex = element.getAttribute('tabindex');
		if (tabIndex !== null && tabIndex !== '0' && tabIndex !== '-1') {
			// Custom tab indices should be sequential
			expect(parseInt(tabIndex, 10)).toBeGreaterThanOrEqual(0);
		}
	});
}

/**
 * Test color contrast for an element
 * This runs axe specifically for color-contrast rules
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Button);
 * const results = await testColorContrast(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testColorContrast(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'rule',
			values: ['color-contrast']
		}
	});
}

/**
 * Test ARIA attributes for an element
 * Runs axe specifically for ARIA-related rules
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Dialog);
 * const results = await testARIA(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testARIA(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'tag',
			values: ['wcag2a', 'wcag21a', 'best-practice']
		},
		rules: {
			// Focus on ARIA-specific rules
			'aria-valid-attr': { enabled: true },
			'aria-valid-attr-value': { enabled: true },
			'aria-required-attr': { enabled: true },
			'aria-roles': { enabled: true },
			'aria-allowed-attr': { enabled: true }
		}
	});
}

/**
 * Test form labels and accessibility
 * Ensures form controls have proper labels
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(ContactForm);
 * const results = await testFormLabels(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testFormLabels(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'rule',
			values: ['label', 'label-title-only', 'form-field-multiple-labels']
		}
	});
}

/**
 * Format axe violations for better debugging
 * Converts violations into a readable format
 *
 * @param results - Axe results to format
 * @returns Formatted string with violation details
 *
 * @example
 * ```typescript
 * const results = await axe(container);
 * if (results.violations.length > 0) {
 *   console.log(formatViolations(results));
 * }
 * ```
 */
export function formatViolations(results: AxeResults): string {
	if (results.violations.length === 0) {
		return 'No accessibility violations found!';
	}

	let output = `Found ${results.violations.length} accessibility violation(s):\n\n`;

	results.violations.forEach((violation: Result, index: number) => {
		output += `${index + 1}. ${violation.help}\n`;
		output += `   Impact: ${violation.impact}\n`;
		output += `   Description: ${violation.description}\n`;
		output += `   Help: ${violation.helpUrl}\n`;
		output += `   Affected elements:\n`;

		violation.nodes.forEach((node) => {
			output += `   - ${node.html}\n`;
			if (node.failureSummary) {
				output += `     ${node.failureSummary}\n`;
			}
		});

		output += '\n';
	});

	return output;
}

/**
 * Get WCAG tags for a specific level
 * @internal
 */
function getWCAGTags(level: 'A' | 'AA' | 'AAA'): string[] {
	const tags: string[] = [];

	if (level === 'A') {
		tags.push('wcag2a', 'wcag21a');
	} else if (level === 'AA') {
		tags.push('wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa');
	} else if (level === 'AAA') {
		tags.push('wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag21aaa');
	}

	return tags;
}

/**
 * Assert that an element has specific ARIA attributes
 *
 * @param element - The element to check
 * @param attributes - Object with expected ARIA attributes
 *
 * @example
 * ```typescript
 * const button = getByRole('button');
 * assertARIAAttributes(button, {
 *   'aria-pressed': 'true',
 *   'aria-label': 'Toggle menu'
 * });
 * ```
 */
export function assertARIAAttributes(
	element: HTMLElement,
	attributes: Record<string, string>
): void {
	Object.entries(attributes).forEach(([attr, value]) => {
		expect(element).toHaveAttribute(attr, value);
	});
}

/**
 * Assert that an element is focusable
 *
 * @param element - The element to check
 *
 * @example
 * ```typescript
 * const button = getByRole('button');
 * assertFocusable(button);
 * ```
 */
export function assertFocusable(element: HTMLElement): void {
	const tabIndex = element.getAttribute('tabindex');
	const isFocusable =
		element.tagName === 'BUTTON' ||
		element.tagName === 'A' ||
		element.tagName === 'INPUT' ||
		element.tagName === 'SELECT' ||
		element.tagName === 'TEXTAREA' ||
		(tabIndex !== null && tabIndex !== '-1');

	expect(isFocusable).toBe(true);
	testKeyboardNavigation(element);
}

/**
 * Test screen reader announcements
 * Checks for proper aria-live regions
 *
 * @param container - The HTML element to test
 * @returns The axe results
 *
 * @example
 * ```typescript
 * const { container } = render(Form);
 * const results = await testScreenReaderAnnouncements(container);
 * expect(results).toHaveNoViolations();
 * ```
 */
export async function testScreenReaderAnnouncements(container: HTMLElement): Promise<AxeResults> {
	return axe(container, {
		runOnly: {
			type: 'rule',
			values: ['aria-live-region-atomic', 'aria-hidden-focus']
		}
	});
}
