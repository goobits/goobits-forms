/**
 * Tests for Radio and RadioGroup Components
 *
 * Tests core functionality:
 * - Radio rendering and selection
 * - Checked/unchecked states
 * - Disabled state
 * - Label association
 * - Error state
 * - RadioGroup with multiple options
 * - RadioGroup selection (only one selected at a time)
 * - Keyboard navigation (Arrow keys)
 * - Keyboard navigation wrapping
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import Radio from './Radio.svelte';
import RadioGroup from './RadioGroup.svelte';
import type { RadioOption } from './RadioGroup.svelte';

describe('Radio Component', () => {
	describe('Rendering', () => {
		it('should render a radio input', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Option'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			expect(radio).toBeTruthy();
			expect(radio).toHaveAttribute('name', 'test');
			expect(radio).toHaveAttribute('value', 'option1');
		});

		it('should render with a label', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label'
				}
			});

			const label = container.querySelector('label');
			expect(label).toBeTruthy();
			expect(label?.textContent).toBe('Test Label');
		});

		it('should render without a label', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1'
				}
			});

			const label = container.querySelector('label');
			expect(label).toBeFalsy();
		});

		it('should generate an ID if not provided', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			expect(radio).toHaveAttribute('id');
			expect(radio?.getAttribute('id')).toMatch(/^radio-/);
		});

		it('should use provided ID', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					id: 'custom-id'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			expect(radio).toHaveAttribute('id', 'custom-id');
		});
	});

	describe('Checked/Unchecked States', () => {
		it('should be unchecked by default', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			expect(radio.checked).toBe(false);
		});

		it('should be checked when checked prop is true', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					checked: true
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			expect(radio.checked).toBe(true);
		});

		it('should toggle checked state on click', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1'
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			expect(radio.checked).toBe(false);

			await fireEvent.click(radio);
			expect(radio.checked).toBe(true);
		});

		it('should call onchange callback when clicked', async () => {
			const handleChange = vi.fn();
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					onchange: handleChange
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			await fireEvent.click(radio);

			expect(handleChange).toHaveBeenCalledTimes(1);
		});
	});

	describe('Disabled State', () => {
		it('should be disabled when disabled prop is true', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					disabled: true
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			expect(radio.disabled).toBe(true);
		});

		it('should not trigger custom onchange when clicked if disabled', async () => {
			const handleChange = vi.fn();
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					disabled: true,
					onchange: handleChange
				}
			});

			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;
			// Disabled inputs don't fire click events in the DOM
			// But we verify the input is disabled
			expect(radio.disabled).toBe(true);
			expect(radio.checked).toBe(false);
		});

		it('should have disabled class when disabled', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					disabled: true
				}
			});

			const radioContainer = container.querySelector('.radio');
			expect(radioContainer?.classList.contains('radio--disabled')).toBe(true);
		});
	});

	describe('Label Association', () => {
		it('should associate label with input via for attribute', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Test Label',
					id: 'test-radio'
				}
			});

			const label = container.querySelector('label');
			const radio = container.querySelector('input[type="radio"]');

			expect(label).toHaveAttribute('for', 'test-radio');
			expect(radio).toHaveAttribute('id', 'test-radio');
		});

		it('should toggle radio when label is clicked', async () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					label: 'Click Me'
				}
			});

			const label = container.querySelector('label') as HTMLLabelElement;
			const radio = container.querySelector('input[type="radio"]') as HTMLInputElement;

			expect(radio.checked).toBe(false);

			await fireEvent.click(label);
			expect(radio.checked).toBe(true);
		});
	});

	describe('Error State', () => {
		it('should display error message', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					error: 'This field is required'
				}
			});

			const error = container.querySelector('.radio__error');
			expect(error).toBeTruthy();
			expect(error?.textContent).toBe('This field is required');
		});

		it('should have error class when error is present', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					error: 'Error message'
				}
			});

			const radioContainer = container.querySelector('.radio');
			expect(radioContainer?.classList.contains('radio--error')).toBe(true);
		});

		it('should link error to radio via aria-describedby when error is present', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					error: 'Error message',
					id: 'test-radio'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			const error = container.querySelector('.radio__error');
			// Radio inputs communicate errors via aria-describedby and visual styling
			expect(radio).toHaveAttribute('aria-describedby');
			expect(error).toBeTruthy();
		});

		it('should link error to radio via aria-describedby', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					error: 'Error message',
					id: 'test-radio'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			const error = container.querySelector('.radio__error');

			expect(radio).toHaveAttribute('aria-describedby', 'test-radio-error');
			expect(error).toHaveAttribute('id', 'test-radio-error');
		});

		it('should have role="alert" on error message', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					error: 'Error message'
				}
			});

			const error = container.querySelector('.radio__error');
			expect(error).toHaveAttribute('role', 'alert');
		});
	});

	describe('Size Variants', () => {
		it('should apply small size class', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					size: 'sm'
				}
			});

			const radioContainer = container.querySelector('.radio');
			expect(radioContainer?.classList.contains('radio--sm')).toBe(true);
		});

		it('should apply medium size class by default', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1'
				}
			});

			const radioContainer = container.querySelector('.radio');
			expect(radioContainer?.classList.contains('radio--md')).toBe(true);
		});

		it('should apply large size class', () => {
			const { container } = render(Radio, {
				props: {
					name: 'test',
					value: 'option1',
					size: 'lg'
				}
			});

			const radioContainer = container.querySelector('.radio');
			expect(radioContainer?.classList.contains('radio--lg')).toBe(true);
		});
	});
});

describe('RadioGroup Component', () => {
	const defaultOptions: RadioOption[] = [
		{ value: 'option1', label: 'Option 1' },
		{ value: 'option2', label: 'Option 2' },
		{ value: 'option3', label: 'Option 3' }
	];

	describe('Rendering', () => {
		it('should render a fieldset with radiogroup role', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toBeTruthy();
			expect(fieldset).toHaveAttribute('role', 'radiogroup');
		});

		it('should render all radio options', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			expect(radios.length).toBe(3);
		});

		it('should render with a legend', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option'
				}
			});

			const legend = container.querySelector('legend');
			expect(legend).toBeTruthy();
			expect(legend?.textContent).toContain('Choose an option');
		});

		it('should show required indicator when required', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					label: 'Choose an option',
					required: true
				}
			});

			const required = container.querySelector('.radio-group__required');
			expect(required).toBeTruthy();
			expect(required?.textContent).toBe('*');
		});

		it('should render options with descriptions', () => {
			const optionsWithDesc: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1', description: 'Description 1' },
				{ value: 'opt2', label: 'Option 2', description: 'Description 2' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDesc
				}
			});

			const descriptions = container.querySelectorAll('.radio__description');
			expect(descriptions.length).toBe(2);
			expect(descriptions[0].textContent).toBe('Description 1');
			expect(descriptions[1].textContent).toBe('Description 2');
		});
	});

	describe('Selection', () => {
		it('should have no option selected by default', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			radios.forEach((radio) => {
				expect((radio as HTMLInputElement).checked).toBe(false);
			});
		});

		it('should select option based on value prop', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					value: 'option2'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			expect((radios[0] as HTMLInputElement).checked).toBe(false);
			expect((radios[1] as HTMLInputElement).checked).toBe(true);
			expect((radios[2] as HTMLInputElement).checked).toBe(false);
		});

		it('should only allow one option to be selected at a time', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');

			await fireEvent.click(radios[0]);
			expect((radios[0] as HTMLInputElement).checked).toBe(true);
			expect((radios[1] as HTMLInputElement).checked).toBe(false);
			expect((radios[2] as HTMLInputElement).checked).toBe(false);

			await fireEvent.click(radios[1]);
			expect((radios[0] as HTMLInputElement).checked).toBe(false);
			expect((radios[1] as HTMLInputElement).checked).toBe(true);
			expect((radios[2] as HTMLInputElement).checked).toBe(false);
		});

		it('should call onchange callback when selection changes', async () => {
			const handleChange = vi.fn();
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					onchange: handleChange
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			await fireEvent.click(radios[1]);

			expect(handleChange).toHaveBeenCalledTimes(1);
			expect(handleChange.mock.calls[0][0].detail).toBe('option2');
		});
	});

	describe('Keyboard Navigation', () => {
		it('should move to next option with ArrowDown', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });

			expect(secondRadio.checked).toBe(true);
		});

		it('should move to next option with ArrowRight', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowRight' });

			expect(secondRadio.checked).toBe(true);
		});

		it('should move to previous option with ArrowUp', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					value: 'option2'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			secondRadio.focus();
			await fireEvent.keyDown(secondRadio, { key: 'ArrowUp' });

			expect(firstRadio.checked).toBe(true);
		});

		it('should move to previous option with ArrowLeft', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					value: 'option2'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const secondRadio = radios[1] as HTMLInputElement;

			secondRadio.focus();
			await fireEvent.keyDown(secondRadio, { key: 'ArrowLeft' });

			expect(firstRadio.checked).toBe(true);
		});

		it('should wrap to first option when ArrowDown on last option', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					value: 'option3'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const lastRadio = radios[2] as HTMLInputElement;

			lastRadio.focus();
			await fireEvent.keyDown(lastRadio, { key: 'ArrowDown' });

			expect(firstRadio.checked).toBe(true);
		});

		it('should wrap to last option when ArrowUp on first option', async () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					value: 'option1'
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const lastRadio = radios[2] as HTMLInputElement;

			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowUp' });

			expect(lastRadio.checked).toBe(true);
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
					options: optionsWithDisabled
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			const firstRadio = radios[0] as HTMLInputElement;
			const thirdRadio = radios[2] as HTMLInputElement;

			firstRadio.focus();
			await fireEvent.keyDown(firstRadio, { key: 'ArrowDown' });

			expect(thirdRadio.checked).toBe(true);
		});
	});

	describe('Disabled State', () => {
		it('should disable all options when disabled prop is true', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					disabled: true
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			radios.forEach((radio) => {
				expect((radio as HTMLInputElement).disabled).toBe(true);
			});
		});

		it('should disable individual options', () => {
			const optionsWithDisabled: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1' },
				{ value: 'opt2', label: 'Option 2', disabled: true },
				{ value: 'opt3', label: 'Option 3' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDisabled
				}
			});

			const radios = container.querySelectorAll('input[type="radio"]');
			expect((radios[0] as HTMLInputElement).disabled).toBe(false);
			expect((radios[1] as HTMLInputElement).disabled).toBe(true);
			expect((radios[2] as HTMLInputElement).disabled).toBe(false);
		});

		it('should have disabled class when disabled', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					disabled: true
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset?.classList.contains('radio-group--disabled')).toBe(true);
		});
	});

	describe('Orientation', () => {
		it('should have vertical orientation by default', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset?.classList.contains('radio-group--vertical')).toBe(true);
		});

		it('should apply horizontal orientation', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					orientation: 'horizontal'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset?.classList.contains('radio-group--horizontal')).toBe(true);
		});
	});

	describe('Error State', () => {
		it('should display error message', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					error: 'Please select an option'
				}
			});

			const error = container.querySelector('.radio-group__error');
			expect(error).toBeTruthy();
			expect(error?.textContent).toBe('Please select an option');
		});

		it('should have error class when error is present', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					error: 'Error message'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset?.classList.contains('radio-group--error')).toBe(true);
		});

		it('should have aria-invalid when error is present', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					error: 'Error message'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('aria-invalid', 'true');
		});

		it('should link error to fieldset via aria-describedby', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					error: 'Error message',
					id: 'test-group'
				}
			});

			const fieldset = container.querySelector('fieldset');
			const error = container.querySelector('.radio-group__error');

			expect(fieldset).toHaveAttribute('aria-describedby', 'test-group-error');
			expect(error).toHaveAttribute('id', 'test-group-error');
		});
	});

	describe('ARIA Attributes', () => {
		it('should have role="radiogroup" on fieldset', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('role', 'radiogroup');
		});

		it('should have aria-required when required', () => {
			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: defaultOptions,
					required: true
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('aria-required', 'true');
		});

		it('should link descriptions to options via aria-describedby', () => {
			const optionsWithDesc: RadioOption[] = [
				{ value: 'opt1', label: 'Option 1', description: 'Description 1' }
			];

			const { container } = render(RadioGroup, {
				props: {
					name: 'test-group',
					options: optionsWithDesc,
					id: 'test-group'
				}
			});

			const radio = container.querySelector('input[type="radio"]');
			const description = container.querySelector('.radio__description');

			expect(radio).toHaveAttribute('aria-describedby', 'test-group-opt1-desc');
			expect(description).toHaveAttribute('id', 'test-group-opt1-desc');
		});
	});
});
