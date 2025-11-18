/**
 * Accessibility Tests for Input Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Form labels
 * - Disabled/readonly states
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testKeyboardNavigation,
	testFormLabels,
	assertFocusable
} from '../utils/a11y-test-utils';
import Input from './Input.svelte';

describe('Input Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(Input, {
				props: {
					id: 'default-input',
					name: 'default',
					'aria-label': 'Default input'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Input, {
				props: {
					id: 'wcag-input',
					name: 'wcag',
					type: 'text',
					placeholder: 'Enter text',
					'aria-label': 'WCAG test input'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(Input, {
				props: {
					id: 'labeled-input',
					name: 'username',
					'aria-label': 'Username'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Input, {
				props: {
					id: 'keyboard-input',
					'aria-label': 'Keyboard test'
				}
			});

			const input = container.querySelector('input');
			expect(input).toBeTruthy();
			testKeyboardNavigation(input!);
		});

		it('should be focusable', () => {
			const { container } = render(Input, {
				props: {
					id: 'focusable-input',
					'aria-label': 'Focusable test'
				}
			});

			const input = container.querySelector('input');
			assertFocusable(input!);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(Input, {
				props: {
					id: 'focus-list-input',
					'aria-label': 'Focus list test'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			expect(focusableElements[0].tagName).toBe('INPUT');
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(Input, {
				props: {
					id: 'disabled-input',
					disabled: true,
					'aria-label': 'Disabled input'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});
	});

	describe('ARIA Attributes', () => {
		it('should have proper ARIA label', async () => {
			const { container } = render(Input, {
				props: {
					id: 'aria-label-input',
					'aria-label': 'Email address'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('aria-label', 'Email address');

			await testAccessibility(container);
		});

		it('should support aria-describedby', async () => {
			const { container } = render(Input, {
				props: {
					id: 'described-input',
					describedBy: 'help-text',
					'aria-label': 'Input with description'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('aria-describedby', 'help-text');

			await testAccessibility(container);
		});

		it('should handle error state with ARIA', async () => {
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
			expect(input).toHaveAttribute('aria-describedby', 'error-message');

			await testAccessibility(container);
		});

		it('should indicate required fields', async () => {
			const { container } = render(Input, {
				props: {
					id: 'required-input',
					required: true,
					'aria-label': 'Required field'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('required');

			await testAccessibility(container);
		});
	});

	describe('Input Types', () => {
		it('should be accessible with type="email"', async () => {
			const { container } = render(Input, {
				props: {
					id: 'email-input',
					type: 'email',
					'aria-label': 'Email address'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('type', 'email');

			await testAccessibility(container);
		});

		it('should be accessible with type="password"', async () => {
			const { container } = render(Input, {
				props: {
					id: 'password-input',
					type: 'password',
					'aria-label': 'Password'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with type="tel"', async () => {
			const { container } = render(Input, {
				props: {
					id: 'tel-input',
					type: 'tel',
					'aria-label': 'Phone number'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with type="url"', async () => {
			const { container } = render(Input, {
				props: {
					id: 'url-input',
					type: 'url',
					'aria-label': 'Website URL'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with type="number"', async () => {
			const { container } = render(Input, {
				props: {
					id: 'number-input',
					type: 'number',
					min: 0,
					max: 100,
					'aria-label': 'Number input'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('States', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(Input, {
				props: {
					id: 'disabled-state',
					disabled: true,
					'aria-label': 'Disabled input'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible when readonly', async () => {
			const { container } = render(Input, {
				props: {
					id: 'readonly-state',
					readonly: true,
					'aria-label': 'Readonly input'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('readonly');

			await testAccessibility(container);
		});

		it('should be accessible in success state', async () => {
			const { container } = render(Input, {
				props: {
					id: 'success-state',
					variant: 'success',
					'aria-label': 'Success input'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with prefix', async () => {
			const { container } = render(Input, {
				props: {
					id: 'prefix-input',
					prefix: '$',
					'aria-label': 'Price input'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with suffix', async () => {
			const { container } = render(Input, {
				props: {
					id: 'suffix-input',
					suffix: 'USD',
					'aria-label': 'Amount input'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with both prefix and suffix', async () => {
			const { container } = render(Input, {
				props: {
					id: 'prefix-suffix-input',
					prefix: '$',
					suffix: 'USD',
					'aria-label': 'Currency input'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Sizes', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Input, {
				props: {
					id: 'small-input',
					size: 'sm',
					'aria-label': 'Small input'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size (default)', async () => {
			const { container } = render(Input, {
				props: {
					id: 'medium-input',
					size: 'md',
					'aria-label': 'Medium input'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(Input, {
				props: {
					id: 'large-input',
					size: 'lg',
					'aria-label': 'Large input'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Autocomplete', () => {
		it('should support autocomplete attribute', async () => {
			const { container } = render(Input, {
				props: {
					id: 'autocomplete-input',
					autocomplete: 'email',
					'aria-label': 'Email with autocomplete'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('autocomplete', 'email');

			await testAccessibility(container);
		});
	});

	describe('Pattern Validation', () => {
		it('should support pattern attribute', async () => {
			const { container } = render(Input, {
				props: {
					id: 'pattern-input',
					pattern: '[0-9]{3}-[0-9]{3}-[0-9]{4}',
					'aria-label': 'Phone number pattern'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('pattern', '[0-9]{3}-[0-9]{3}-[0-9]{4}');

			await testAccessibility(container);
		});
	});
});
