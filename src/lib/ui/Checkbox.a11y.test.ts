/**
 * Accessibility Tests for Checkbox Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Form labels
 * - Disabled/indeterminate states
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testKeyboardNavigation,
	testFormLabels,
	assertFocusable,
	assertARIAAttributes
} from '../utils/a11y-test-utils';
import Checkbox from './Checkbox.svelte';
import CheckboxGroup from './CheckboxGroup.svelte';

describe('Checkbox Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'default-checkbox',
					name: 'default',
					label: 'Default checkbox'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'wcag-checkbox',
					name: 'wcag',
					label: 'WCAG test checkbox'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'labeled-checkbox',
					name: 'terms',
					label: 'I agree to terms and conditions'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});

		it('should be accessible without visual label if aria-label provided', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'aria-checkbox',
					'aria-label': 'Accept terms'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'keyboard-checkbox',
					label: 'Keyboard test'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toBeTruthy();
			testKeyboardNavigation(checkbox!);
		});

		it('should be focusable', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'focusable-checkbox',
					label: 'Focusable test'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			assertFocusable(checkbox!);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'focus-list-checkbox',
					label: 'Focus list test'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			expect(focusableElements[0].type).toBe('checkbox');
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'disabled-checkbox',
					disabled: true,
					label: 'Disabled checkbox'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});
	});

	describe('ARIA Attributes', () => {
		it('should have proper role', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'role-checkbox',
					label: 'Role test'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('type', 'checkbox');
			// Native checkboxes have implicit checkbox role
		});

		it('should have aria-checked attribute matching checked state', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'checked-checkbox',
					label: 'Checked test',
					checked: true
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('aria-checked', 'true');
		});

		it('should have aria-checked="mixed" when indeterminate', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'indeterminate-checkbox',
					label: 'Indeterminate test',
					indeterminate: true
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('aria-checked', 'mixed');

			await testAccessibility(container);
		});

		it('should support aria-describedby for errors', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'error-checkbox',
					label: 'Error test',
					error: 'This field is required'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('aria-describedby');

			const describedBy = checkbox!.getAttribute('aria-describedby');
			const errorElement = container.querySelector(`#${describedBy}`);
			expect(errorElement).toHaveTextContent('This field is required');

			await testAccessibility(container);
		});

		it('should have aria-invalid when error is present', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'invalid-checkbox',
					label: 'Invalid test',
					error: 'Error message'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('aria-invalid', 'true');

			await testAccessibility(container);
		});

		it('should not have aria-invalid when no error', () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'valid-checkbox',
					label: 'Valid test'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('aria-invalid', 'false');
		});
	});

	describe('Label Association', () => {
		it('should associate label with checkbox via for/id', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'associated-checkbox',
					label: 'Click me'
				}
			});

			const label = container.querySelector('label');
			expect(label).toHaveAttribute('for', 'associated-checkbox');

			await testAccessibility(container);
		});

		it('should generate unique ID when not provided', () => {
			const { container: container1 } = render(Checkbox, {
				props: { label: 'Checkbox 1' }
			});

			const { container: container2 } = render(Checkbox, {
				props: { label: 'Checkbox 2' }
			});

			const checkbox1 = container1.querySelector('input[type="checkbox"]');
			const checkbox2 = container2.querySelector('input[type="checkbox"]');

			const id1 = checkbox1!.getAttribute('id');
			const id2 = checkbox2!.getAttribute('id');

			expect(id1).toBeTruthy();
			expect(id2).toBeTruthy();
			expect(id1).not.toBe(id2);
		});
	});

	describe('States', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'disabled-state',
					disabled: true,
					label: 'Disabled checkbox'
				}
			});

			const checkbox = container.querySelector('input[type="checkbox"]');
			expect(checkbox).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible in checked state', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'checked-state',
					checked: true,
					label: 'Checked checkbox'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible in indeterminate state', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'indeterminate-state',
					indeterminate: true,
					label: 'Indeterminate checkbox'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible in error state', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'error-state',
					error: 'Required field',
					label: 'Error checkbox'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Sizes', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'small-checkbox',
					size: 'sm',
					label: 'Small checkbox'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size (default)', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'medium-checkbox',
					size: 'md',
					label: 'Medium checkbox'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'large-checkbox',
					size: 'lg',
					label: 'Large checkbox'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Error Announcements', () => {
		it('should announce errors to screen readers', async () => {
			const { container } = render(Checkbox, {
				props: {
					id: 'announce-checkbox',
					label: 'Test checkbox',
					error: 'This field is required'
				}
			});

			const alert = container.querySelector('[role="alert"]');
			expect(alert).toBeInTheDocument();
			expect(alert).toHaveTextContent('This field is required');

			await testAccessibility(container);
		});
	});
});

describe('CheckboxGroup Component - Accessibility', () => {
	const defaultOptions = [
		{ value: 'sports', label: 'Sports' },
		{ value: 'music', label: 'Music' },
		{ value: 'art', label: 'Art' }
	];

	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Select your interests'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Select interests'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});
	});

	describe('Semantic Structure', () => {
		it('should use fieldset element', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toBeInTheDocument();

			await testAccessibility(container);
		});

		it('should use legend for group label', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Select your interests'
				}
			});

			const legend = container.querySelector('legend');
			expect(legend).toBeInTheDocument();
			expect(legend).toHaveTextContent('Select your interests');

			await testAccessibility(container);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should allow keyboard navigation through checkboxes', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(defaultOptions.length);

			focusableElements.forEach((element) => {
				expect(element.type).toBe('checkbox');
				assertFocusable(element);
			});
		});

		it('should skip disabled checkboxes in tab order', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: [
						{ value: 'sports', label: 'Sports' },
						{ value: 'music', label: 'Music', disabled: true },
						{ value: 'art', label: 'Art' }
					],
					name: 'interests',
					label: 'Your interests'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(2); // Only non-disabled checkboxes
		});

		it('should have no focusable elements when group is disabled', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					disabled: true
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});
	});

	describe('ARIA Attributes', () => {
		it('should mark fieldset with error state', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					error: 'Please select at least one option'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('data-invalid', 'true');

			await testAccessibility(container);
		});

		it('should support aria-describedby for errors', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					error: 'Error message'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('aria-describedby');

			const describedBy = fieldset!.getAttribute('aria-describedby');
			const errorElement = container.querySelector(`#${describedBy}`);
			expect(errorElement).toHaveTextContent('Error message');

			await testAccessibility(container);
		});
	});

	describe('Error Announcements', () => {
		it('should announce errors to screen readers', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					error: 'Please select at least one option'
				}
			});

			const alert = container.querySelector('[role="alert"]');
			expect(alert).toBeInTheDocument();
			expect(alert).toHaveTextContent('Please select at least one option');

			await testAccessibility(container);
		});
	});

	describe('Disabled State', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					disabled: true
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with individually disabled options', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: [
						{ value: 'sports', label: 'Sports' },
						{ value: 'music', label: 'Music', disabled: true },
						{ value: 'art', label: 'Art' }
					],
					name: 'interests',
					label: 'Your interests'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Orientation', () => {
		it('should be accessible with vertical orientation', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					orientation: 'vertical'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with horizontal orientation', async () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Your interests',
					orientation: 'horizontal'
				}
			});

			await testAccessibility(container);
		});
	});
});
