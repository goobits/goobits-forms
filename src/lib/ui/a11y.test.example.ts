/**
 * Example Accessibility Tests
 *
 * This file demonstrates how to write accessibility tests for Svelte components
 * using axe-core and the custom a11y test utilities.
 *
 * These examples show:
 * - How to test for WCAG compliance
 * - How to test keyboard navigation
 * - How to test ARIA attributes
 * - How to test focus management
 * - How to test color contrast
 * - How to test form labels
 */

import { describe, it, expect } from 'vitest';
import { render } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testWCAG_A,
	testKeyboardNavigation,
	testFormLabels,
	testARIA,
	assertARIAAttributes,
	assertFocusable,
	formatViolations
} from '../utils/a11y-test-utils';
import Input from './Input.svelte';
import Textarea from './Textarea.svelte';

describe('Example: Input Component Accessibility', () => {
	it('should have no accessibility violations', async () => {
		const { container } = render(Input, {
			props: {
				id: 'test-input',
				name: 'test',
				placeholder: 'Enter text',
				'aria-label': 'Test input field'
			}
		});

		// Test for any accessibility violations
		await testAccessibility(container);
	});

	it('should meet WCAG 2.1 AA standards', async () => {
		const { container } = render(Input, {
			props: {
				id: 'email-input',
				name: 'email',
				type: 'email',
				required: true,
				'aria-label': 'Email address'
			}
		});

		// Test specifically for WCAG 2.1 AA compliance
		const results = await testWCAG_AA(container);
		expect(results).toHaveNoViolations();
	});

	it('should meet WCAG 2.1 A standards (minimum)', async () => {
		const { container } = render(Input, {
			props: {
				id: 'name-input',
				name: 'name',
				'aria-label': 'Your name'
			}
		});

		// Test for WCAG 2.1 Level A compliance
		const results = await testWCAG_A(container);
		expect(results).toHaveNoViolations();
	});

	it('should be keyboard accessible', () => {
		const { container } = render(Input, {
			props: {
				id: 'keyboard-test',
				'aria-label': 'Keyboard test input'
			}
		});

		const input = container.querySelector('input');
		expect(input).toBeTruthy();

		// Test that the input can receive focus
		testKeyboardNavigation(input!);
	});

	it('should be focusable', () => {
		const { container } = render(Input, {
			props: {
				id: 'focus-test',
				'aria-label': 'Focus test input'
			}
		});

		const input = container.querySelector('input');
		assertFocusable(input!);
	});

	it('should have proper ARIA attributes when disabled', async () => {
		const { container } = render(Input, {
			props: {
				id: 'disabled-input',
				disabled: true,
				'aria-label': 'Disabled input'
			}
		});

		const input = container.querySelector('input');
		expect(input).toHaveAttribute('disabled');

		// Disabled inputs should still be accessible
		await testAccessibility(container);
	});

	it('should have proper ARIA attributes when in error state', async () => {
		const { container } = render(Input, {
			props: {
				id: 'error-input',
				variant: 'error',
				hasError: true,
				describedBy: 'error-message',
				'aria-label': 'Input with error'
			}
		});

		const input = container.querySelector('input');

		// Check ARIA attributes
		expect(input).toHaveAttribute('aria-describedby', 'error-message');

		// Ensure no violations even with error state
		await testAccessibility(container);
	});

	it('should have proper ARIA attributes when required', async () => {
		const { container } = render(Input, {
			props: {
				id: 'required-input',
				required: true,
				'aria-label': 'Required input'
			}
		});

		const input = container.querySelector('input');
		expect(input).toHaveAttribute('required');

		await testAccessibility(container);
	});
});

describe('Example: Textarea Component Accessibility', () => {
	it('should have no accessibility violations', async () => {
		const { container } = render(Textarea, {
			props: {
				id: 'message',
				name: 'message',
				placeholder: 'Enter your message',
				'aria-label': 'Message textarea'
			}
		});

		await testAccessibility(container);
	});

	it('should meet WCAG 2.1 AA standards', async () => {
		const { container } = render(Textarea, {
			props: {
				id: 'description',
				name: 'description',
				'aria-label': 'Description'
			}
		});

		const results = await testWCAG_AA(container);
		expect(results).toHaveNoViolations();
	});

	it('should be keyboard accessible', () => {
		const { container } = render(Textarea, {
			props: {
				id: 'keyboard-textarea',
				'aria-label': 'Keyboard test textarea'
			}
		});

		const textarea = container.querySelector('textarea');
		expect(textarea).toBeTruthy();

		testKeyboardNavigation(textarea!);
	});

	it('should handle ARIA describedBy correctly', async () => {
		const { container } = render(Textarea, {
			props: {
				id: 'described-textarea',
				describedBy: 'helper-text',
				'aria-label': 'Textarea with description'
			}
		});

		const textarea = container.querySelector('textarea');
		expect(textarea).toHaveAttribute('aria-describedby', 'helper-text');

		await testAccessibility(container);
	});
});

describe('Example: ARIA Testing', () => {
	it('should test ARIA attributes specifically', async () => {
		const { container } = render(Input, {
			props: {
				id: 'aria-test',
				'aria-label': 'ARIA test input',
				'aria-describedby': 'help-text',
				required: true
			}
		});

		// Test ARIA-specific rules
		const results = await testARIA(container);
		expect(results).toHaveNoViolations();
	});

	it('should assert specific ARIA attributes', () => {
		const { container } = render(Input, {
			props: {
				id: 'custom-aria',
				'aria-label': 'Custom input',
				'aria-required': 'true',
				'aria-describedby': 'description'
			}
		});

		const input = container.querySelector('input');

		// Assert specific ARIA attributes exist and have correct values
		assertARIAAttributes(input!, {
			'aria-label': 'Custom input',
			'aria-required': 'true',
			'aria-describedby': 'description'
		});
	});
});

describe('Example: Form Labels Testing', () => {
	it('should test form labels are properly associated', async () => {
		const { container } = render(Input, {
			props: {
				id: 'labeled-input',
				name: 'username',
				'aria-label': 'Username'
			}
		});

		// Test that form controls have proper labels
		const results = await testFormLabels(container);
		expect(results).toHaveNoViolations();
	});
});

describe('Example: Handling Violations', () => {
	it('demonstrates how to format and debug violations', async () => {
		const { container } = render(Input, {
			props: {
				id: 'test-input',
				'aria-label': 'Test input'
			}
		});

		// Run axe and get results
		const results = await testWCAG_AA(container);

		// If there were violations, we could format them for debugging
		if (results.violations.length > 0) {
			const formattedViolations = formatViolations(results);
			console.log(formattedViolations);
		}

		// Assert no violations
		expect(results).toHaveNoViolations();
	});
});

describe('Example: Custom WCAG Level Testing', () => {
	it('should test with custom options', async () => {
		const { container } = render(Input, {
			props: {
				id: 'custom-test',
				'aria-label': 'Custom test input'
			}
		});

		// Test with custom options
		await testAccessibility(container, {
			wcagLevel: 'AA',
			rules: {
				// Disable color-contrast for this specific test
				// (useful when testing components in isolation without full styles)
				'color-contrast': { enabled: false }
			}
		});
	});
});

describe('Example: Testing with Options', () => {
	it('should allow disabling specific rules when needed', async () => {
		const { container } = render(Input, {
			props: {
				id: 'options-test',
				'aria-label': 'Options test'
			}
		});

		// Sometimes in unit tests, certain rules may need to be disabled
		// For example, color-contrast requires full CSS context
		await testAccessibility(container, {
			axeOptions: {
				rules: {
					'color-contrast': { enabled: false }
				}
			}
		});
	});
});

/**
 * NOTE: This is an example file showing how to write accessibility tests.
 * In real implementation, these tests would be in separate files:
 * - Input.a11y.test.ts
 * - Textarea.a11y.test.ts
 * - ContactForm.a11y.test.ts
 * - etc.
 *
 * Each component should have its own dedicated a11y test file.
 */
