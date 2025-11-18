/**
 * Comprehensive tests for Checkbox component
 *
 * Tests focus on rendering, states, events, and accessibility.
 */

import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import Checkbox from './Checkbox.svelte';
import CheckboxGroup from './CheckboxGroup.svelte';

describe('Checkbox Component', () => {
	describe('Basic Rendering', () => {
		test('renders checkbox with default props', () => {
			render(Checkbox, { props: { label: 'Accept terms' } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toBeInTheDocument();
			expect(screen.getByText('Accept terms')).toBeInTheDocument();
		});

		test('renders without label', () => {
			render(Checkbox, { props: { 'aria-label': 'Checkbox' } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toBeInTheDocument();
		});

		test('applies default size class', () => {
			const { container } = render(Checkbox, { props: { label: 'Checkbox' } });
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--md');
		});

		test('applies custom className', () => {
			const { container } = render(Checkbox, {
				props: { label: 'Checkbox', class: 'custom-class' }
			});
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('custom-class');
		});

		test('applies data-testid attribute', () => {
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					'data-testid': 'terms-checkbox'
				}
			});
			expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
		});
	});

	describe('Checked State', () => {
		test('renders unchecked by default', () => {
			render(Checkbox, { props: { label: 'Checkbox' } });
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
			expect(checkbox.checked).toBe(false);
		});

		test('renders checked when checked prop is true', () => {
			render(Checkbox, { props: { label: 'Checkbox', checked: true } });
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
			expect(checkbox.checked).toBe(true);
		});

		test('toggles checked state on click', async () => {
			render(Checkbox, { props: { label: 'Checkbox' } });
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

			expect(checkbox.checked).toBe(false);

			await userEvent.click(checkbox);
			expect(checkbox.checked).toBe(true);

			await userEvent.click(checkbox);
			expect(checkbox.checked).toBe(false);
		});

		test('shows checkmark icon when checked', () => {
			const { container } = render(Checkbox, { props: { label: 'Checkbox', checked: true } });
			const icon = container.querySelector('.checkbox__icon--checked');
			expect(icon).toBeInTheDocument();
		});
	});

	describe('Indeterminate State', () => {
		test('applies indeterminate class when indeterminate is true', () => {
			const { container } = render(Checkbox, {
				props: { label: 'Checkbox', indeterminate: true }
			});
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--indeterminate');
		});

		test('shows indeterminate icon when indeterminate', () => {
			const { container } = render(Checkbox, {
				props: { label: 'Checkbox', indeterminate: true }
			});
			const icon = container.querySelector('.checkbox__icon--indeterminate');
			expect(icon).toBeInTheDocument();
		});

		test('has aria-checked="mixed" when indeterminate', () => {
			render(Checkbox, { props: { label: 'Checkbox', indeterminate: true } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAttribute('aria-checked', 'mixed');
		});

		test('indeterminate state can be toggled', async () => {
			const { container } = render(Checkbox, {
				props: { label: 'Checkbox', indeterminate: true }
			});
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

			// Indeterminate checkboxes can be clicked
			await userEvent.click(checkbox);
			expect(checkbox.checked).toBe(true);
		});
	});

	describe('Disabled State', () => {
		test('renders disabled checkbox', () => {
			render(Checkbox, { props: { label: 'Checkbox', disabled: true } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toBeDisabled();
		});

		test('applies disabled class', () => {
			const { container } = render(Checkbox, {
				props: { label: 'Checkbox', disabled: true }
			});
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--disabled');
		});

		test('disabled checkbox does not respond to clicks', async () => {
			const handleChange = vi.fn();
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					disabled: true,
					onchange: handleChange
				}
			});

			const checkbox = screen.getByRole('checkbox');
			await userEvent.click(checkbox);
			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe('Error State', () => {
		test('renders error message', () => {
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					error: 'This field is required'
				}
			});
			expect(screen.getByText('This field is required')).toBeInTheDocument();
		});

		test('applies error class', () => {
			const { container } = render(Checkbox, {
				props: {
					label: 'Checkbox',
					error: 'Error message'
				}
			});
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--error');
		});

		test('has aria-invalid when error is present', () => {
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					error: 'Error message'
				}
			});
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAttribute('aria-invalid', 'true');
		});

		test('has aria-describedby pointing to error', () => {
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					error: 'Error message'
				}
			});
			const checkbox = screen.getByRole('checkbox');
			const describedBy = checkbox.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();

			const errorElement = document.getElementById(describedBy!);
			expect(errorElement).toHaveTextContent('Error message');
		});

		test('error element has role="alert"', () => {
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					error: 'Error message'
				}
			});
			const alert = screen.getByRole('alert');
			expect(alert).toHaveTextContent('Error message');
		});
	});

	describe('Size Variants', () => {
		test('renders small size', () => {
			const { container } = render(Checkbox, { props: { label: 'Small', size: 'sm' } });
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--sm');
		});

		test('renders medium size (default)', () => {
			const { container } = render(Checkbox, { props: { label: 'Medium', size: 'md' } });
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--md');
		});

		test('renders large size', () => {
			const { container } = render(Checkbox, { props: { label: 'Large', size: 'lg' } });
			const wrapper = container.querySelector('.checkbox');
			expect(wrapper).toHaveClass('checkbox--lg');
		});
	});

	describe('Label Association', () => {
		test('associates label with checkbox via for/id', () => {
			render(Checkbox, { props: { label: 'Click me', id: 'test-checkbox' } });
			const label = screen.getByText('Click me');
			expect(label).toHaveAttribute('for', 'test-checkbox');
		});

		test('auto-generates ID when not provided', () => {
			render(Checkbox, { props: { label: 'Click me' } });
			const checkbox = screen.getByRole('checkbox');
			const id = checkbox.getAttribute('id');
			expect(id).toBeTruthy();
			expect(id).toMatch(/^checkbox-/);
		});

		test('clicking label toggles checkbox', async () => {
			render(Checkbox, { props: { label: 'Click me' } });
			const label = screen.getByText('Click me');
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

			expect(checkbox.checked).toBe(false);
			await userEvent.click(label);
			expect(checkbox.checked).toBe(true);
		});
	});

	describe('Change Handler', () => {
		test('calls onchange handler when clicked', async () => {
			const handleChange = vi.fn();
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					onchange: handleChange
				}
			});

			const checkbox = screen.getByRole('checkbox');
			await userEvent.click(checkbox);

			expect(handleChange).toHaveBeenCalledTimes(1);
			expect(handleChange).toHaveBeenCalledWith(true);
		});

		test('passes correct checked state to handler', async () => {
			const handleChange = vi.fn();
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					checked: true,
					onchange: handleChange
				}
			});

			const checkbox = screen.getByRole('checkbox');
			await userEvent.click(checkbox);

			expect(handleChange).toHaveBeenCalledWith(false);
		});

		test('does not call onchange when disabled', async () => {
			const handleChange = vi.fn();
			render(Checkbox, {
				props: {
					label: 'Checkbox',
					disabled: true,
					onchange: handleChange
				}
			});

			const checkbox = screen.getByRole('checkbox');
			await userEvent.click(checkbox);

			expect(handleChange).not.toHaveBeenCalled();
		});
	});

	describe('Keyboard Navigation', () => {
		test('can be focused with keyboard', () => {
			render(Checkbox, { props: { label: 'Checkbox' } });
			const checkbox = screen.getByRole('checkbox');

			checkbox.focus();
			expect(document.activeElement).toBe(checkbox);
		});

		test('toggles on Space key', async () => {
			render(Checkbox, { props: { label: 'Checkbox' } });
			const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

			checkbox.focus();
			expect(checkbox.checked).toBe(false);

			await userEvent.keyboard(' ');
			expect(checkbox.checked).toBe(true);

			await userEvent.keyboard(' ');
			expect(checkbox.checked).toBe(false);
		});
	});

	describe('Form Integration', () => {
		test('includes name attribute', () => {
			render(Checkbox, { props: { label: 'Checkbox', name: 'terms' } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAttribute('name', 'terms');
		});

		test('includes value attribute', () => {
			render(Checkbox, { props: { label: 'Checkbox', value: 'accepted' } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAttribute('value', 'accepted');
		});

		test('works with numeric value', () => {
			render(Checkbox, { props: { label: 'Checkbox', value: 123 } });
			const checkbox = screen.getByRole('checkbox');
			expect(checkbox).toHaveAttribute('value', '123');
		});
	});
});

describe('CheckboxGroup Component', () => {
	const defaultOptions = [
		{ value: 'sports', label: 'Sports' },
		{ value: 'music', label: 'Music' },
		{ value: 'art', label: 'Art' }
	];

	describe('Basic Rendering', () => {
		test('renders checkbox group with options', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests'
				}
			});

			expect(screen.getByText('Sports')).toBeInTheDocument();
			expect(screen.getByText('Music')).toBeInTheDocument();
			expect(screen.getByText('Art')).toBeInTheDocument();
		});

		test('renders as fieldset', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toBeInTheDocument();
		});

		test('renders group label as legend', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					label: 'Select your interests'
				}
			});

			const legend = screen.getByText('Select your interests');
			expect(legend.tagName).toBe('LEGEND');
		});

		test('renders without group label', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests'
				}
			});

			const legend = container.querySelector('legend');
			expect(legend).not.toBeInTheDocument();
		});
	});

	describe('Selection State', () => {
		test('renders with no items selected by default', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests'
				}
			});

			const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
			checkboxes.forEach((checkbox) => {
				expect(checkbox.checked).toBe(false);
			});
		});

		test('renders with pre-selected values', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: ['sports', 'music']
				}
			});

			const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
			expect(checkboxes[0].checked).toBe(true); // Sports
			expect(checkboxes[1].checked).toBe(true); // Music
			expect(checkboxes[2].checked).toBe(false); // Art
		});

		test('updates selection on checkbox click', async () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: []
				}
			});

			const sportsCheckbox = screen.getByRole('checkbox', { name: 'Sports' });
			await userEvent.click(sportsCheckbox);

			expect(sportsCheckbox).toBeChecked();
		});

		test('allows multiple selections', async () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: []
				}
			});

			const sportsCheckbox = screen.getByRole('checkbox', { name: 'Sports' });
			const musicCheckbox = screen.getByRole('checkbox', { name: 'Music' });

			await userEvent.click(sportsCheckbox);
			await userEvent.click(musicCheckbox);

			expect(sportsCheckbox).toBeChecked();
			expect(musicCheckbox).toBeChecked();
		});

		test('deselects checkbox on second click', async () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: ['sports']
				}
			});

			const sportsCheckbox = screen.getByRole('checkbox', { name: 'Sports' });
			expect(sportsCheckbox).toBeChecked();

			await userEvent.click(sportsCheckbox);
			expect(sportsCheckbox).not.toBeChecked();
		});
	});

	describe('Orientation', () => {
		test('applies vertical orientation by default', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveClass('checkbox-group--vertical');
		});

		test('applies horizontal orientation', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					orientation: 'horizontal'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveClass('checkbox-group--horizontal');
		});
	});

	describe('Disabled State', () => {
		test('disables all checkboxes when group is disabled', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					disabled: true
				}
			});

			const checkboxes = screen.getAllByRole('checkbox');
			checkboxes.forEach((checkbox) => {
				expect(checkbox).toBeDisabled();
			});
		});

		test('applies disabled class', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					disabled: true
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveClass('checkbox-group--disabled');
		});

		test('disables individual checkbox when option is disabled', () => {
			render(CheckboxGroup, {
				props: {
					options: [
						{ value: 'sports', label: 'Sports' },
						{ value: 'music', label: 'Music', disabled: true },
						{ value: 'art', label: 'Art' }
					],
					name: 'interests'
				}
			});

			const musicCheckbox = screen.getByRole('checkbox', { name: 'Music' });
			expect(musicCheckbox).toBeDisabled();

			const sportsCheckbox = screen.getByRole('checkbox', { name: 'Sports' });
			expect(sportsCheckbox).not.toBeDisabled();
		});
	});

	describe('Error State', () => {
		test('renders error message', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					error: 'Please select at least one option'
				}
			});

			expect(screen.getByText('Please select at least one option')).toBeInTheDocument();
		});

		test('applies error class', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					error: 'Error message'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveClass('checkbox-group--error');
		});

		test('marks fieldset with error state when error is present', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					error: 'Error message'
				}
			});

			const fieldset = container.querySelector('fieldset');
			expect(fieldset).toHaveAttribute('data-invalid', 'true');
		});

		test('error element has role="alert"', () => {
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					error: 'Error message'
				}
			});

			const alert = screen.getByRole('alert');
			expect(alert).toHaveTextContent('Error message');
		});
	});

	describe('Change Handler', () => {
		test('calls onchange handler when checkbox is clicked', async () => {
			const handleChange = vi.fn();
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: [],
					onchange: handleChange
				}
			});

			const sportsCheckbox = screen.getByRole('checkbox', { name: 'Sports' });
			await userEvent.click(sportsCheckbox);

			expect(handleChange).toHaveBeenCalledTimes(1);
			expect(handleChange).toHaveBeenCalledWith(['sports']);
		});

		test('passes updated array when multiple checkboxes selected', async () => {
			const handleChange = vi.fn();
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: [],
					onchange: handleChange
				}
			});

			await userEvent.click(screen.getByRole('checkbox', { name: 'Sports' }));
			await userEvent.click(screen.getByRole('checkbox', { name: 'Music' }));

			expect(handleChange).toHaveBeenCalledWith(['sports', 'music']);
		});

		test('removes value from array when checkbox is deselected', async () => {
			const handleChange = vi.fn();
			render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					value: ['sports', 'music'],
					onchange: handleChange
				}
			});

			await userEvent.click(screen.getByRole('checkbox', { name: 'Music' }));

			expect(handleChange).toHaveBeenCalledWith(['sports']);
		});
	});

	describe('Size Variants', () => {
		test('passes size to child checkboxes', () => {
			const { container } = render(CheckboxGroup, {
				props: {
					options: defaultOptions,
					name: 'interests',
					size: 'lg'
				}
			});

			const checkboxWrappers = container.querySelectorAll('.checkbox');
			checkboxWrappers.forEach((wrapper) => {
				expect(wrapper).toHaveClass('checkbox--lg');
			});
		});
	});
});
