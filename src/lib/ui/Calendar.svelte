<script lang="ts">
	/**
	 * Calendar Component
	 *
	 * Internal component for DatePicker that displays a month grid
	 * with navigation and date selection capabilities.
	 */

	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import {
		getMonthCalendarDates,
		getDayNames,
		getMonthNames,
		isSameDay,
		isSameMonth,
		isToday,
		isDateInRange,
		addMonths
	} from '../utils/date-utils';

	/**
	 * Props interface for the Calendar component
	 */
	interface Props {
		/** Currently selected date */
		selectedDate?: Date;
		/** Month being displayed */
		currentMonth: Date;
		/** Minimum selectable date */
		min?: Date;
		/** Maximum selectable date */
		max?: Date;
		/** Locale for formatting */
		locale?: string;
		/** Show week numbers */
		showWeekNumbers?: boolean;
		/** Highlight today's date */
		highlightToday?: boolean;
		/** Callback when date is selected */
		onSelectDate?: (date: Date) => void;
		/** Callback when month changes */
		onMonthChange?: (date: Date) => void;
		/** ID for accessibility */
		id?: string;
		/** First day of week (0=Sunday, 1=Monday) */
		startDay?: number;
	}

	let {
		selectedDate,
		currentMonth = $bindable(new Date()),
		min,
		max,
		locale = 'en-US',
		showWeekNumbers = false,
		highlightToday = true,
		onSelectDate,
		onMonthChange,
		id = `calendar-${Math.random().toString(36).substr(2, 9)}`,
		startDay = 0
	}: Props = $props();

	// Get localized names
	const dayNames = $derived(getDayNames(locale, 'short', startDay));
	const monthNames = $derived(getMonthNames(locale, 'long'));

	// Get calendar dates for the current month
	const calendarDates = $derived(
		getMonthCalendarDates(currentMonth.getFullYear(), currentMonth.getMonth(), startDay)
	);

	// Current year and month
	const currentYear = $derived(currentMonth.getFullYear());
	const currentMonthIndex = $derived(currentMonth.getMonth());

	// Generate year options (current year ± 100 years)
	const yearOptions = $derived(
		Array.from({ length: 201 }, (_, i) => currentYear - 100 + i)
	);

	/**
	 * Navigate to previous month
	 */
	function previousMonth(): void {
		const newMonth = addMonths(currentMonth, -1);
		currentMonth = newMonth;
		onMonthChange?.(newMonth);
	}

	/**
	 * Navigate to next month
	 */
	function nextMonth(): void {
		const newMonth = addMonths(currentMonth, 1);
		currentMonth = newMonth;
		onMonthChange?.(newMonth);
	}

	/**
	 * Navigate to specific month
	 */
	function selectMonth(month: number): void {
		const newMonth = new Date(currentYear, month, 1);
		currentMonth = newMonth;
		onMonthChange?.(newMonth);
	}

	/**
	 * Navigate to specific year
	 */
	function selectYear(year: number): void {
		const newMonth = new Date(year, currentMonthIndex, 1);
		currentMonth = newMonth;
		onMonthChange?.(newMonth);
	}

	/**
	 * Navigate to today
	 */
	function goToToday(): void {
		const today = new Date();
		currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
		onMonthChange?.(currentMonth);
	}

	/**
	 * Handle date selection
	 */
	function handleDateClick(date: Date): void {
		if (isDateDisabled(date)) return;
		onSelectDate?.(date);
	}

	/**
	 * Check if a date is disabled
	 */
	function isDateDisabled(date: Date): boolean {
		return !isDateInRange(date, min, max);
	}

	/**
	 * Get CSS classes for a date cell
	 */
	function getDateClasses(date: Date): string {
		const classes = ['calendar__day'];

		if (!isSameMonth(date, currentMonth)) {
			classes.push('calendar__day--other-month');
		}

		if (selectedDate && isSameDay(date, selectedDate)) {
			classes.push('calendar__day--selected');
		}

		if (highlightToday && isToday(date)) {
			classes.push('calendar__day--today');
		}

		if (isDateDisabled(date)) {
			classes.push('calendar__day--disabled');
		}

		return classes.join(' ');
	}

	/**
	 * Handle keyboard navigation
	 */
	function handleKeydown(event: KeyboardEvent, date: Date): void {
		const dateIndex = calendarDates.findIndex((d) => isSameDay(d, date));
		if (dateIndex === -1) return;

		let newIndex = dateIndex;

		switch (event.key) {
			case 'ArrowLeft':
				event.preventDefault();
				newIndex = Math.max(0, dateIndex - 1);
				break;
			case 'ArrowRight':
				event.preventDefault();
				newIndex = Math.min(calendarDates.length - 1, dateIndex + 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				newIndex = Math.max(0, dateIndex - 7);
				break;
			case 'ArrowDown':
				event.preventDefault();
				newIndex = Math.min(calendarDates.length - 1, dateIndex + 7);
				break;
			case 'Home':
				event.preventDefault();
				// Go to first day of week
				newIndex = Math.floor(dateIndex / 7) * 7;
				break;
			case 'End':
				event.preventDefault();
				// Go to last day of week
				newIndex = Math.min(calendarDates.length - 1, Math.floor(dateIndex / 7) * 7 + 6);
				break;
			case 'PageUp':
				event.preventDefault();
				previousMonth();
				return;
			case 'PageDown':
				event.preventDefault();
				nextMonth();
				return;
			case 'Enter':
			case ' ':
				event.preventDefault();
				handleDateClick(date);
				return;
		}

		// Focus the new date
		if (newIndex !== dateIndex) {
			const newDate = calendarDates[newIndex];
			const button = document.querySelector(
				`button[data-date="${newDate.getTime()}"]`
			) as HTMLButtonElement;
			button?.focus();
		}
	}
</script>

<div class="calendar" {id} role="application" aria-label="Calendar">
	<div class="calendar__header">
		<button
			type="button"
			class="calendar__nav-button"
			onclick={previousMonth}
			aria-label="Previous month"
		>
			<ChevronLeft size={20} />
		</button>

		<div class="calendar__controls">
			<select
				class="calendar__select"
				value={currentMonthIndex}
				onchange={(e) => selectMonth(parseInt(e.currentTarget.value, 10))}
				aria-label="Select month"
			>
				{#each monthNames as monthName, index (index)}
					<option value={index}>{monthName}</option>
				{/each}
			</select>

			<select
				class="calendar__select"
				value={currentYear}
				onchange={(e) => selectYear(parseInt(e.currentTarget.value, 10))}
				aria-label="Select year"
			>
				{#each yearOptions as year (year)}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>

		<button
			type="button"
			class="calendar__nav-button"
			onclick={nextMonth}
			aria-label="Next month"
		>
			<ChevronRight size={20} />
		</button>
	</div>

	<div class="calendar__grid" role="grid">
		<!-- Day names header -->
		<div class="calendar__weekdays" role="row">
			{#if showWeekNumbers}
				<div class="calendar__weekday calendar__weekday--week-number" role="columnheader">
					Wk
				</div>
			{/if}
			{#each dayNames as dayName (dayName)}
				<div class="calendar__weekday" role="columnheader">
					{dayName}
				</div>
			{/each}
		</div>

		<!-- Date grid (6 weeks × 7 days) -->
		{#each Array(6) as _, weekIndex (weekIndex)}
			<div class="calendar__week" role="row">
				{#if showWeekNumbers}
					<div class="calendar__week-number">
						{calendarDates[weekIndex * 7]?.getWeek?.() || ''}
					</div>
				{/if}
				{#each Array(7) as _, dayIndex (dayIndex)}
					{@const date = calendarDates[weekIndex * 7 + dayIndex]}
					{#if date}
						<button
							type="button"
							class={getDateClasses(date)}
							data-date={date.getTime()}
							onclick={() => handleDateClick(date)}
							onkeydown={(e) => handleKeydown(e, date)}
							disabled={isDateDisabled(date)}
							aria-label={date.toLocaleDateString(locale, {
								year: 'numeric',
								month: 'long',
								day: 'numeric'
							})}
							aria-selected={selectedDate && isSameDay(date, selectedDate)}
							role="gridcell"
							tabindex={selectedDate && isSameDay(date, selectedDate) ? 0 : -1}
						>
							{date.getDate()}
						</button>
					{/if}
				{/each}
			</div>
		{/each}
	</div>

	<div class="calendar__footer">
		<button type="button" class="calendar__today-button" onclick={goToToday}>
			Today
		</button>
	</div>
</div>

<style>
	.calendar {
		width: 100%;
		max-width: 320px;
		padding: var(--space-3);
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		font-family: var(--font-family-base);
		user-select: none;
	}

	/* Header */
	.calendar__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
		gap: var(--space-2);
	}

	.calendar__controls {
		display: flex;
		gap: var(--space-2);
		flex: 1;
		justify-content: center;
	}

	.calendar__nav-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-base);
	}

	.calendar__nav-button:hover {
		background: var(--color-background-secondary);
		border-color: var(--color-border-strong);
		color: var(--color-text-primary);
	}

	.calendar__nav-button:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	.calendar__select {
		padding: var(--space-1) var(--space-2);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--font-size-small);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: var(--transition-base);
	}

	.calendar__select:hover {
		border-color: var(--color-border-strong);
	}

	.calendar__select:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 2px var(--color-primary-100);
	}

	/* Grid */
	.calendar__grid {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.calendar__weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
		margin-bottom: var(--space-2);
	}

	.calendar__weekdays--with-week-numbers {
		grid-template-columns: 32px repeat(7, 1fr);
	}

	.calendar__weekday {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		font-size: var(--font-size-small);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-secondary);
		text-align: center;
	}

	.calendar__weekday--week-number {
		font-size: 0.75rem;
	}

	.calendar__week {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 2px;
	}

	.calendar__week-number {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		color: var(--color-text-tertiary);
	}

	/* Date cells */
	.calendar__day {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 1;
		padding: 0;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-size: var(--font-size-small);
		color: var(--color-text-primary);
		cursor: pointer;
		transition: var(--transition-base);
		position: relative;
	}

	.calendar__day:hover:not(.calendar__day--disabled) {
		background: var(--color-background-secondary);
		border-color: var(--color-border);
	}

	.calendar__day:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: -2px;
		z-index: 1;
	}

	.calendar__day--other-month {
		color: var(--color-text-tertiary);
		opacity: 0.5;
	}

	.calendar__day--today {
		font-weight: var(--font-weight-bold);
		border-color: var(--color-primary-500);
	}

	.calendar__day--selected {
		background: var(--color-primary-500);
		color: var(--color-text-on-primary);
		border-color: var(--color-primary-600);
		font-weight: var(--font-weight-semibold);
	}

	.calendar__day--selected:hover {
		background: var(--color-primary-600);
	}

	.calendar__day--disabled {
		color: var(--color-text-disabled);
		cursor: not-allowed;
		opacity: 0.4;
	}

	.calendar__day--disabled:hover {
		background: transparent;
		border-color: transparent;
	}

	/* Footer */
	.calendar__footer {
		display: flex;
		justify-content: center;
		margin-top: var(--space-3);
		padding-top: var(--space-3);
		border-top: 1px solid var(--color-border);
	}

	.calendar__today-button {
		padding: var(--space-1) var(--space-3);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		font-size: var(--font-size-small);
		color: var(--color-primary-500);
		cursor: pointer;
		transition: var(--transition-base);
		font-weight: var(--font-weight-medium);
	}

	.calendar__today-button:hover {
		background: var(--color-primary-50);
		border-color: var(--color-primary-500);
	}

	.calendar__today-button:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.calendar__nav-button,
		.calendar__select,
		.calendar__day,
		.calendar__today-button {
			border-width: 2px;
		}

		.calendar__day--selected {
			outline: 2px solid var(--color-primary-800);
		}
	}
</style>
