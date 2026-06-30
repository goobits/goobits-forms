import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import DateRangePicker from './DateRangePicker.svelte';

describe('DateRangePicker keyboard navigation', () => {
	test('ArrowDown moves focus into the empty start calendar grid', async () => {
		render(DateRangePicker, { props: { id: 'range-test' } });
		const input = screen.getByPlaceholderText('Start date');

		input.focus();
		await userEvent.keyboard('{ArrowDown}');

		await waitFor(() => {
			expect(document.activeElement).toHaveAttribute('data-calendar-focus', 'true');
		});
	});

	test('empty range calendar exposes one focusable date cell', async () => {
		render(DateRangePicker, { props: { id: 'range-test' } });
		const input = screen.getByPlaceholderText('Start date');

		await userEvent.click(input);
		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		const focusableDates = screen
			.getAllByRole('gridcell')
			.filter((element) => element.getAttribute('tabindex') === '0');

		expect(focusableDates).toHaveLength(1);
		expect(focusableDates[0]).toHaveAttribute('data-calendar-focus', 'true');
	});

	test('range calendar exposes a named grid without application mode', async () => {
		render(DateRangePicker, { props: { id: 'range-test' } });
		const input = screen.getByPlaceholderText('Start date');

		await userEvent.click(input);
		await waitFor(() => {
			expect(screen.queryByRole('application')).not.toBeInTheDocument();
			expect(screen.getByRole('grid', { name: /calendar dates/i })).toBeInTheDocument();
		});
	});
});
