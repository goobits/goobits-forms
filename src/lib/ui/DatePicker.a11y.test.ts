/**
 * Accessibility Tests for DatePicker Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Keyboard navigation
 * - ARIA attributes
 * - Focus management
 * - Form labels
 * - Calendar dialog accessibility
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
import DatePicker from './DatePicker.svelte';

describe('DatePicker Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'default-datepicker',
					label: 'Select Date'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'wcag-datepicker',
					label: 'Date of Birth',
					placeholder: 'MM/DD/YYYY'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'labeled-datepicker',
					label: 'Appointment Date'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});

		it('should be accessible with required field', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'required-datepicker',
					label: 'Required Date',
					required: true
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'keyboard-datepicker',
					label: 'Keyboard Test'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toBeTruthy();
			testKeyboardNavigation(input!);
		});

		it('should be focusable', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'focusable-datepicker',
					label: 'Focusable Test'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			assertFocusable(input!);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'focus-list-datepicker',
					label: 'Focus List Test'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			// Should have at least the input and calendar icon button
			expect(focusableElements.length).toBeGreaterThanOrEqual(1);
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'disabled-datepicker',
					label: 'Disabled',
					disabled: true
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('disabled');
		});
	});

	describe('ARIA Attributes', () => {
		it('should have proper ARIA role', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'aria-role-datepicker',
					label: 'Date'
				}
			});

			const input = container.querySelector('input');
			expect(input).toHaveAttribute('role', 'combobox');
		});

		it('should have aria-expanded attribute', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'aria-expanded-datepicker',
					label: 'Date'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('aria-expanded');
		});

		it('should have aria-haspopup attribute', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'aria-haspopup-datepicker',
					label: 'Date'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('aria-haspopup', 'dialog');
		});

		it('should have aria-controls attribute', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'aria-controls-datepicker',
					label: 'Date'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('aria-controls');
			const controlsId = input?.getAttribute('aria-controls');
			expect(controlsId).toContain('calendar');
		});

		it('should handle error state with ARIA', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'error-datepicker',
					label: 'Date',
					error: 'Please select a valid date'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('aria-invalid', 'true');
			expect(input).toHaveAttribute('aria-describedby');

			await testAccessibility(container);
		});

		it('should associate error message with input', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'error-message-datepicker',
					label: 'Date',
					error: 'Invalid date format'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			const describedBy = input?.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();

			const errorElement = container.querySelector(`#${describedBy}`);
			expect(errorElement).toHaveTextContent('Invalid date format');
			expect(errorElement).toHaveAttribute('role', 'alert');
		});
	});

	describe('Label Association', () => {
		it('should associate label with input', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'labeled-input',
					label: 'Event Date'
				}
			});

			const label = container.querySelector('label');
			const input = container.querySelector('input[role="combobox"]');

			expect(label).toBeTruthy();
			expect(input).toBeTruthy();
			expect(label?.getAttribute('for')).toBe(input?.getAttribute('id'));
		});

		it('should work without label', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'no-label-datepicker',
					placeholder: 'Select date'
				}
			});

			// Should still be accessible with just placeholder
			await testAccessibility(container);
		});
	});

	describe('Size Variants', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'small-datepicker',
					label: 'Small Date Picker',
					size: 'sm'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size (default)', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'medium-datepicker',
					label: 'Medium Date Picker',
					size: 'md'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'large-datepicker',
					label: 'Large Date Picker',
					size: 'lg'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('States', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'disabled-state',
					label: 'Disabled Date Picker',
					disabled: true
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible with a value', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'value-state',
					label: 'Date Picker with Value',
					value: new Date(2024, 0, 15)
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with min/max constraints', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'constrained-datepicker',
					label: 'Constrained Date',
					min: new Date(2024, 0, 1),
					max: new Date(2024, 11, 31)
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with error state', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'error-state',
					label: 'Date with Error',
					error: 'Required field',
					value: undefined
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Button Accessibility', () => {
		it('calendar icon button should have aria-label', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'icon-button-test',
					label: 'Date'
				}
			});

			const calendarButton = container.querySelector('button[aria-label="Toggle calendar"]');
			expect(calendarButton).toBeTruthy();
		});

		it('clear button should have aria-label', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'clear-button-test',
					label: 'Date',
					value: new Date(2024, 0, 15)
				}
			});

			const clearButton = container.querySelector('button[aria-label="Clear date"]');
			expect(clearButton).toBeTruthy();
		});

		it('buttons should be keyboard accessible', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'button-keyboard-test',
					label: 'Date',
					value: new Date(2024, 0, 15)
				}
			});

			const buttons = container.querySelectorAll('button');
			buttons.forEach((button) => {
				// Buttons should be focusable or have tabindex -1 (for helper buttons)
				const tabindex = button.getAttribute('tabindex');
				expect(tabindex === null || tabindex === '-1' || tabindex === '0').toBe(true);
			});
		});
	});

	describe('Format Variants', () => {
		it('should be accessible with MM/DD/YYYY format', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'format-mdy',
					label: 'Date',
					format: 'MM/DD/YYYY'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with YYYY-MM-DD format', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'format-ymd',
					label: 'Date',
					format: 'YYYY-MM-DD'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with DD/MM/YYYY format', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'format-dmy',
					label: 'Date',
					format: 'DD/MM/YYYY'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Focus Management', () => {
		it('should maintain focus order', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'focus-order-test',
					label: 'Date',
					value: new Date(2024, 0, 15)
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);

			// Input should be first focusable element
			expect(focusableElements[0].getAttribute('role')).toBe('combobox');
		});

		it('should handle focus with required field', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'required-focus-test',
					label: 'Required Date',
					required: true
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('required');
			assertFocusable(input!);
		});
	});

	describe('Locale Support', () => {
		it('should be accessible with different locale', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'locale-test',
					label: 'Date',
					locale: 'fr-FR'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with en-GB locale', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'locale-gb-test',
					label: 'Date',
					locale: 'en-GB',
					format: 'DD/MM/YYYY'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Additional Features', () => {
		it('should be accessible with week numbers enabled', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'week-numbers-test',
					label: 'Date',
					showWeekNumbers: true
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with today highlighting', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'highlight-today-test',
					label: 'Date',
					highlightToday: true
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with custom placeholder', async () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'custom-placeholder-test',
					label: 'Date',
					placeholder: 'Choose your date'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Autocomplete', () => {
		it('should have autocomplete="off" for date picker', () => {
			const { container } = render(DatePicker, {
				props: {
					id: 'autocomplete-test',
					label: 'Date'
				}
			});

			const input = container.querySelector('input[role="combobox"]');
			expect(input).toHaveAttribute('autocomplete', 'off');
		});
	});
});
