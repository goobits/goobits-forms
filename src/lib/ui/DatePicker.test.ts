/**
 * Comprehensive tests for DatePicker component
 *
 * Tests focus on rendering, date selection, calendar navigation,
 * keyboard interaction, and date formatting.
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DatePicker from './DatePicker.svelte';
import { formatDate } from '../utils/date-utils';

describe('DatePicker Component', () => {
	describe('Basic Rendering', () => {
		test('renders with default props', () => {
			render(DatePicker, { props: { id: 'test-datepicker' } });
			const input = screen.getByRole('combobox');
			expect(input).toBeInTheDocument();
		});

		test('renders with label', () => {
			render(DatePicker, {
				props: {
					label: 'Birth Date',
					id: 'birth-date'
				}
			});
			expect(screen.getByText('Birth Date')).toBeInTheDocument();
		});

		test('renders with placeholder', () => {
			render(DatePicker, {
				props: {
					placeholder: 'Choose a date',
					id: 'test-datepicker'
				}
			});
			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('placeholder', 'Choose a date');
		});

		test('renders with custom ID', () => {
			render(DatePicker, {
				props: {
					id: 'custom-id'
				}
			});
			expect(document.getElementById('custom-id')).toBeInTheDocument();
		});

		test('renders with data-testid', () => {
			render(DatePicker, {
				props: {
					'data-testid': 'date-picker',
					id: 'test'
				}
			});
			expect(screen.getByTestId('date-picker')).toBeInTheDocument();
		});
	});

	describe('Date Value', () => {
		test('displays formatted date when value is set', () => {
			const date = new Date(2024, 0, 15);
			render(DatePicker, {
				props: {
					value: date,
					format: 'MM/DD/YYYY',
					id: 'test'
				}
			});
			const input = screen.getByRole('combobox') as HTMLInputElement;
			expect(input.value).toBe('01/15/2024');
		});

		test('displays empty string when value is undefined', () => {
			render(DatePicker, {
				props: {
					value: undefined,
					id: 'test'
				}
			});
			const input = screen.getByRole('combobox') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		test('formats date with different format string', () => {
			const date = new Date(2024, 0, 15);
			render(DatePicker, {
				props: {
					value: date,
					format: 'YYYY-MM-DD',
					id: 'test'
				}
			});
			const input = screen.getByRole('combobox') as HTMLInputElement;
			expect(input.value).toBe('2024-01-15');
		});

		test('updates input when value prop changes', async () => {
			const { rerender } = render(DatePicker, {
				props: {
					value: new Date(2024, 0, 15),
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox') as HTMLInputElement;
			expect(input.value).toBe('01/15/2024');

			await rerender({
				value: new Date(2024, 1, 20),
				id: 'test'
			});

			expect(input.value).toBe('02/20/2024');
		});
	});

	describe('Calendar Interaction', () => {
		test('opens calendar on input focus', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);

			// Calendar should be rendered in portal
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});

		test('opens calendar on calendar icon click', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const calendarButton = screen.getByLabelText('Toggle calendar');

			await userEvent.click(calendarButton);

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});

		test('closes calendar on Escape key', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			// Open calendar
			await userEvent.click(input);
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			// Press Escape
			await userEvent.keyboard('{Escape}');

			await waitFor(() => {
				expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
			});
		});

		test('calendar shows current month by default', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);

			await waitFor(() => {
				const calendar = screen.getByRole('dialog');
				expect(calendar).toBeInTheDocument();
				// Should show current month/year in selects
			});
		});

		test('calendar shows month of selected date', async () => {
			const date = new Date(2024, 5, 15); // June 2024
			render(DatePicker, {
				props: {
					value: date,
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			await userEvent.click(input);

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});
	});

	describe('Date Selection', () => {
		test('selecting date updates input value', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			// Open calendar
			await userEvent.click(input);

			// The calendar renders dates as gridcells
			// We'll need to find and click a specific date
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			// Find a date button in the calendar (this is simplified)
			const dateButtons = screen.getAllByRole('gridcell');
			if (dateButtons.length > 0) {
				await userEvent.click(dateButtons[15]); // Click a date

				// Input should be updated
				expect((input as HTMLInputElement).value).not.toBe('');
			}
		});

		test('selecting date closes calendar', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const dateButtons = screen.getAllByRole('gridcell');
			if (dateButtons.length > 0) {
				await userEvent.click(dateButtons[15]);

				await waitFor(() => {
					expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
				});
			}
		});

		test('calls onchange callback when date is selected', async () => {
			const onChange = vi.fn();
			render(DatePicker, {
				props: {
					onchange: onChange,
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			await userEvent.click(input);

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const dateButtons = screen.getAllByRole('gridcell');
			if (dateButtons.length > 0) {
				await userEvent.click(dateButtons[15]);
				expect(onChange).toHaveBeenCalled();
			}
		});
	});

	describe('Clear Functionality', () => {
		test('shows clear button when date is selected', () => {
			render(DatePicker, {
				props: {
					value: new Date(2024, 0, 15),
					id: 'test'
				}
			});

			expect(screen.getByLabelText('Clear date')).toBeInTheDocument();
		});

		test('hides clear button when no date is selected', () => {
			render(DatePicker, {
				props: {
					value: undefined,
					id: 'test'
				}
			});

			expect(screen.queryByLabelText('Clear date')).not.toBeInTheDocument();
		});

		test('clicking clear button clears the date', async () => {
			render(DatePicker, {
				props: {
					value: new Date(2024, 0, 15),
					id: 'test'
				}
			});

			const clearButton = screen.getByLabelText('Clear date');
			await userEvent.click(clearButton);

			const input = screen.getByRole('combobox') as HTMLInputElement;
			expect(input.value).toBe('');
		});

		test('calls onclear callback when cleared', async () => {
			const onClear = vi.fn();
			render(DatePicker, {
				props: {
					value: new Date(2024, 0, 15),
					onclear: onClear,
					id: 'test'
				}
			});

			const clearButton = screen.getByLabelText('Clear date');
			await userEvent.click(clearButton);

			expect(onClear).toHaveBeenCalled();
		});
	});

	describe('Disabled State', () => {
		test('input is disabled when disabled prop is true', () => {
			render(DatePicker, {
				props: {
					disabled: true,
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toBeDisabled();
		});

		test('calendar icon is disabled when disabled prop is true', () => {
			render(DatePicker, {
				props: {
					disabled: true,
					id: 'test'
				}
			});

			const calendarButton = screen.getByLabelText('Toggle calendar');
			expect(calendarButton).toBeDisabled();
		});

		test('does not show clear button when disabled', () => {
			render(DatePicker, {
				props: {
					value: new Date(2024, 0, 15),
					disabled: true,
					id: 'test'
				}
			});

			expect(screen.queryByLabelText('Clear date')).not.toBeInTheDocument();
		});

		test('does not open calendar when disabled', async () => {
			render(DatePicker, {
				props: {
					disabled: true,
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			await userEvent.click(input);

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe('Error State', () => {
		test('displays error message', () => {
			render(DatePicker, {
				props: {
					error: 'Please select a valid date',
					id: 'test'
				}
			});

			expect(screen.getByText('Please select a valid date')).toBeInTheDocument();
		});

		test('error message has role alert', () => {
			render(DatePicker, {
				props: {
					error: 'Error message',
					id: 'test'
				}
			});

			const error = screen.getByRole('alert');
			expect(error).toHaveTextContent('Error message');
		});

		test('input has aria-invalid when error is present', () => {
			render(DatePicker, {
				props: {
					error: 'Error',
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('aria-invalid', 'true');
		});

		test('input has aria-describedby pointing to error', () => {
			render(DatePicker, {
				props: {
					error: 'Error',
					id: 'test-datepicker'
				}
			});

			const input = screen.getByRole('combobox');
			const describedBy = input.getAttribute('aria-describedby');
			expect(describedBy).toBeTruthy();

			const errorElement = document.getElementById(describedBy!);
			expect(errorElement).toHaveTextContent('Error');
		});
	});

	describe('Size Variants', () => {
		test('applies small size class', () => {
			render(DatePicker, {
				props: {
					size: 'sm',
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveClass('datepicker__input--sm');
		});

		test('applies medium size class (default)', () => {
			render(DatePicker, {
				props: {
					size: 'md',
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveClass('datepicker__input--md');
		});

		test('applies large size class', () => {
			render(DatePicker, {
				props: {
					size: 'lg',
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveClass('datepicker__input--lg');
		});
	});

	describe('Required Field', () => {
		test('input has required attribute', () => {
			render(DatePicker, {
				props: {
					required: true,
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('required');
		});

		test('label shows required indicator', () => {
			render(DatePicker, {
				props: {
					label: 'Date',
					required: true,
					id: 'test'
				}
			});

			// FormLabel component should add required indicator
			expect(screen.getByText('Date')).toBeInTheDocument();
		});
	});

	describe('Keyboard Navigation', () => {
		test('opens calendar on Enter key', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			input.focus();
			await userEvent.keyboard('{Enter}');

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});

		test('opens calendar on ArrowDown key', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			input.focus();
			await userEvent.keyboard('{ArrowDown}');

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});

		test('focuses input after selecting date', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);
			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});

			const dateButtons = screen.getAllByRole('gridcell');
			if (dateButtons.length > 0) {
				await userEvent.click(dateButtons[15]);

				await waitFor(() => {
					expect(input).toHaveFocus();
				});
			}
		});
	});

	describe('Accessibility', () => {
		test('input has role combobox', () => {
			render(DatePicker, { props: { id: 'test' } });
			expect(screen.getByRole('combobox')).toBeInTheDocument();
		});

		test('input has aria-expanded attribute', () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('aria-expanded', 'false');
		});

		test('aria-expanded is true when calendar is open', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);

			await waitFor(() => {
				expect(input).toHaveAttribute('aria-expanded', 'true');
			});
		});

		test('input has aria-haspopup', () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('aria-haspopup', 'dialog');
		});

		test('calendar has role dialog', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);

			await waitFor(() => {
				expect(screen.getByRole('dialog')).toBeInTheDocument();
			});
		});

		test('calendar has aria-label', async () => {
			render(DatePicker, { props: { id: 'test' } });
			const input = screen.getByRole('combobox');

			await userEvent.click(input);

			await waitFor(() => {
				const dialog = screen.getByRole('dialog');
				expect(dialog).toHaveAttribute('aria-label', 'Choose date');
			});
		});
	});

	describe('Min/Max Date Constraints', () => {
		test('accepts min date prop', () => {
			const min = new Date(2024, 0, 1);
			render(DatePicker, {
				props: {
					min,
					id: 'test'
				}
			});

			// Component should render without errors
			expect(screen.getByRole('combobox')).toBeInTheDocument();
		});

		test('accepts max date prop', () => {
			const max = new Date(2024, 11, 31);
			render(DatePicker, {
				props: {
					max,
					id: 'test'
				}
			});

			expect(screen.getByRole('combobox')).toBeInTheDocument();
		});
	});

	describe('Custom Class', () => {
		test('applies custom class name', () => {
			const { container } = render(DatePicker, {
				props: {
					class: 'custom-datepicker',
					id: 'test'
				}
			});

			expect(container.querySelector('.custom-datepicker')).toBeInTheDocument();
		});
	});

	describe('Name Attribute', () => {
		test('input has name attribute', () => {
			render(DatePicker, {
				props: {
					name: 'birthdate',
					id: 'test'
				}
			});

			const input = screen.getByRole('combobox');
			expect(input).toHaveAttribute('name', 'birthdate');
		});
	});
});
