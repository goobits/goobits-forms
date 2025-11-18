/**
 * Accessibility Tests for Radio and RadioGroup Components
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Fieldset and legend for groups
 * - Label associations
 * - Keyboard navigation (Arrow keys, Tab)
 * - Focus management
 * - ARIA attributes
 * - Error announcements
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements, fireEvent } from './test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testKeyboardNavigation,
	testFormLabels,
	assertFocusable,
	assertARIAAttributes
} from '../utils/a11y-test-utils';
import Radio from './Radio.svelte';
import RadioGroup from './RadioGroup.svelte';
import type { RadioOption } from './RadioGroup.svelte';

describe('Radio Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					'aria-label': 'Test option'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			testKeyboardNavigation(radio);
		});

		it('should be focusable', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			assertFocusable(radio);
		});

		it('should be included in focusable elements', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
			expect(focusableElements[0].tagName).toBe('INPUT');
			expect(focusableElements[0]).toHaveAttribute('type', 'radio');
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					disabled: true
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBe(0);
		});
	});

	describe('ARIA Attributes', () => {
		it('should have proper ARIA label when provided', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					'aria-label': 'Custom ARIA label'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			expect(radio).toHaveAttribute('aria-label', 'Custom ARIA label');

			await testAccessibility(container);
		});

		it('should support aria-describedby', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					'aria-describedby': 'help-text'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			expect(radio).toHaveAttribute('aria-describedby');
			expect(radio.getAttribute('aria-describedby')).toContain('help-text');

			await testAccessibility(container);
		});

		it('should handle error state with ARIA', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					error: 'This field is required'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			const error = container.querySelector('.radio__error') as HTMLElement;

			// Radio inputs communicate errors via aria-describedby and role="alert"
			// Note: aria-invalid is not supported on radio role per ARIA spec
			expect(radio).toHaveAttribute('aria-describedby');
			expect(error).toHaveAttribute('role', 'alert');

			await testAccessibility(container);
		});

		it('should combine aria-describedby with error ID', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					error: 'Error message',
					'aria-describedby': 'custom-desc',
					id: 'test-radio'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			const describedBy = radio.getAttribute('aria-describedby');

			expect(describedBy).toContain('custom-desc');
			expect(describedBy).toContain('test-radio-error');
		});
	});

	describe('Label Association', () => {
		it('should properly associate label with input', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					id: 'test-radio'
				}
			});

			const label = container.querySelector('label') as HTMLElement;
			const radio = container.querySelector('input[type="radio"]') as HTMLElement;

			expect(label).toHaveAttribute('for', 'test-radio');
			expect(radio).toHaveAttribute('id', 'test-radio');

			await testAccessibility(container);
		});

		it('should be accessible without visual label but with aria-label', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					'aria-label': 'Accessible label'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('States', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					disabled: true
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLElement;
			expect(radio).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible when checked', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					checked: true
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			expect(radio.checked).toBe(true);

			await testAccessibility(container);
		});

		it('should be accessible in error state', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					error: 'This field is required'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Sizes', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					size: 'sm'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with medium size (default)', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					size: 'md'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible with large size', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					size: 'lg'
				}
			});

			await testAccessibility(container);
		});
	});
});

describe('RadioGroup Component - Accessibility', () => {
	const defaultOptions: RadioOption[] = [
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' }
	];

	describe('WCAG Compliance', () => {
		it('should have no accessibility violations with default props', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			await testAccessibility(container);
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const results = await testWCAG_AA(container);
			expect(results).toHaveNoViolations();
		});

		it('should have proper form labels', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const results = await testFormLabels(container);
			expect(results).toHaveNoViolations();
		});
	});

	describe('Fieldset and Legend', () => {
		it('should use fieldset and legend for grouping', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const fieldset = container.querySelector('fieldset');
			const legend = container.querySelector('legend');

			expect(fieldset).toBeTruthy();
			expect(legend).toBeTruthy();
			expect(legend?.textContent).toContain('Choose an option');

			await testAccessibility(container);
		});

		it('should have role="radiogroup" on fieldset', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('role', 'radiogroup');

			await testAccessibility(container);
		});
	});

	describe('Keyboard Navigation', () => {
		it('should navigate with Arrow keys', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			firstRadio.focus();
			expect(document.activeElement).toBe(firstRadio);

			await fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });
			expect(secondRadio.checked).toBe(true);

			await testAccessibility(container);
		});

		it('should wrap navigation at boundaries', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					value: 'option3'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const lastRadio = radios[2] as HTMLInputElement;

			// Test wrapping from last to first
			lastRadio.focus();
			await fireEvent.keyDown(lastRadio, { key: 'ArrowDown' });
			expect(firstRadio.checked).toBe(true);

			// Test wrapping from first to last
			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowUp' });
			expect(lastRadio.checked).toBe(true);

			await testAccessibility(container);
		});

		it('should skip disabled options during keyboard navigation', async () => {
			const optionsWithDisabled: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2', disabled: true },
				{ value: 'opt3', label: 'Option 3' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDisabled,
					label: 'Choose an option'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const thirdRadio = radios[2] as HTMLInputElement;

			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });

			// Should skip the disabled second option and go to third
			expect(thirdRadio.checked).toBe(true);

			await testAccessibility(container);
		});

		it('should be tabbable as a group', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const focusableElements = getFocusableElements(container);

			// All radio buttons should be in the tab order
			const radioElements = focusableElements.filter(
				(el) => el.tagName === 'INPUT' && el.getAttribute('type') === 'radio'
			);
			expect(radioElements.length).toBe(3);
		});
	});

	describe('ARIA Attributes', () => {
		it('should have role="radiogroup"', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const fieldset = container.querySelector('fieldset');
			assertARIAAttributes(fieldset as HTMLElement, {
				role: 'radiogroup'
			});

			await testAccessibility(container);
		});

		it('should have aria-required when required', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					required: true
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('aria-required', 'true');

			await testAccessibility(container);
		});

		it('should have aria-invalid when error is present', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					error: 'Please select an option'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('aria-invalid', 'true');

			await testAccessibility(container);
		});

		it('should link error with aria-describedby', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					error: 'Please select an option',
					id: 'test-group'
				}
			});

			const fieldset = container.querySelector('fieldset');
			const error = container.querySelector('.radio-group__error');

			expect(fieldset).toHaveAttribute('aria-describedby', 'test-group-error');
			expect(error).toHaveAttribute('id', 'test-group-error');

			await testAccessibility(container);
		});

		it('should link descriptions to options', async () => {
			const optionsWithDesc: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1', description: 'Description 1' },
				{ value: 'opt2', label: 'Option 2', description: 'Description 2' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDesc,
					label: 'Choose an option',
					id: 'test-group'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLElement;
			const firstDesc = container.querySelectorAll('.radio__description')[0];

			expect(firstRadio).toHaveAttribute('aria-describedby', 'test-group-opt1-desc');
			expect(firstDesc).toHaveAttribute('id', 'test-group-opt1-desc');

			await testAccessibility(container);
		});
	});

	describe('Focus Management', () => {
		it('should maintain focus during keyboard navigation', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			firstRadio.focus();
			expect(document.activeElement).toBe(firstRadio);

			await fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });
			expect(document.activeElement).toBe(secondRadio);
		});

		it('should not be focusable when disabled', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					disabled: true
				}
			});

			const focusableElements = getFocusableElements(container);
			const radioElements = focusableElements.filter(
				(el) => el.tagName === 'INPUT' && el.getAttribute('type') === 'radio'
			);
			expect(radioElements.length).toBe(0);
		});
	});

	describe('Error Announcements', () => {
		it('should announce errors with role="alert"', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					error: 'Please select an option'
				}
			});

			const error = container.querySelector('.radio-group__error');
			expect(error).toHaveAttribute('role', 'alert');

			await testAccessibility(container);
		});
	});

	describe('Orientation', () => {
		it('should be accessible in vertical orientation', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					orientation: 'vertical'
				}
			});

			await testAccessibility(container);
		});

		it('should be accessible in horizontal orientation', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					orientation: 'horizontal'
				}
			});

			await testAccessibility(container);
		});
	});

	describe('Required Field', () => {
		it('should indicate required fields visually and programmatically', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					required: true
				}
			});

			const required = container.querySelector('.radio-group__required');
			const fieldset = container.querySelector('fieldset');

			expect(required).toBeTruthy();
			expect(required?.textContent).toBe('*');
			expect(required).toHaveAttribute('aria-label', 'required');
			expect(fieldset).toHaveAttribute('aria-required', 'true');

			await testAccessibility(container);
		});
	});

	describe('Disabled State', () => {
		it('should be accessible when disabled', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					disabled: true
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('disabled');

			await testAccessibility(container);
		});

		it('should be accessible with individually disabled options', async () => {
			const optionsWithDisabled: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2', disabled: true },
				{ value: 'opt3', label: 'Option 3' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDisabled,
					label: 'Choose an option'
				}
			});

			await testAccessibility(container);
		});
	});
});
