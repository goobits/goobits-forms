<script lang="ts">
	/**
	 * DateRangePicker Component
	 *
	 * A date range picker for selecting start and end dates
	 * with visual range highlighting in the calendar.
	 */

	import { Calendar, X, ArrowRight } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import CalendarComponent from './Calendar.svelte';
	import Portal from './Portal.svelte';
	import FormLabel from './FormLabel.svelte';
	import {
		formatDate,
		parseDate,
		startOfDay,
		isSameDay,
		compareDate
	} from '../utils/date-utils';

	/**
	 * Props interface for the DateRangePicker component
	 */
	interface Props {
		/** The start date value */
		startDate?: Date;
		/** The end date value */
		endDate?: Date;
		/** Minimum selectable date */
		min?: Date;
		/** Maximum selectable date */
		max?: Date;
		/** Whether the input is disabled */
		disabled?: boolean;
		/** Label text */
		label?: string;
		/** Placeholder for start date */
		placeholderStart?: string;
		/** Placeholder for end date */
		placeholderEnd?: string;
		/** Error message */
		error?: string;
		/** Date format string */
		format?: string;
		/** Locale for formatting */
		locale?: string;
		/** Show week numbers */
		showWeekNumbers?: boolean;
		/** Highlight today's date */
		highlightToday?: boolean;
		/** Size variant */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS class */
		class?: string;
		/** Input ID */
		id?: string;
		/** Input name prefix */
		name?: string;
		/** Whether the field is required */
		required?: boolean;
		/** Test ID for testing */
		'data-testid'?: string;
		/** Callback when dates change */
		onchange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
		/** Callback when dates are cleared */
		onclear?: () => void;
		/** First day of week (0=Sunday, 1=Monday) */
		startDay?: number;
	}

	let {
		startDate = $bindable(),
		endDate = $bindable(),
		min,
		max,
		disabled = false,
		label,
		placeholderStart = 'Start date',
		placeholderEnd = 'End date',
		error,
		format = 'MM/DD/YYYY',
		locale = 'en-US',
		showWeekNumbers = false,
		highlightToday = true,
		size = 'md',
		class: className = '',
		id,
		name,
		required = false,
		'data-testid': dataTestId,
		onchange,
		onclear,
		startDay = 0
	}: Props = $props();

	let isOpen = $state(false);
	let activeInput: 'start' | 'end' = $state('start');
	let startInputRef: HTMLInputElement | undefined = $state();
	let endInputRef: HTMLInputElement | undefined = $state();
	let triggerRef: HTMLDivElement | undefined = $state();
	let calendarPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let currentMonth = $state(startDate ? new Date(startDate) : new Date());
	let startInputValue = $state('');
	let endInputValue = $state('');
	let hoveredDate: Date | undefined = $state();

	// Unique IDs for accessibility
	const uniqueId = id || `daterangepicker-${Math.random().toString(36).substr(2, 9)}`;
	const calendarId = `${uniqueId}-calendar`;
	const errorId = error ? `${uniqueId}-error` : undefined;

	// Update input values when date props change
	$effect(() => {
		if (startDate) {
			startInputValue = formatDate(startDate, format, locale);
		} else {
			startInputValue = '';
		}

		if (endDate) {
			endInputValue = formatDate(endDate, format, locale);
		} else {
			endInputValue = '';
		}
	});

	// Update current month when start date changes
	$effect(() => {
		if (startDate) {
			currentMonth = new Date(startDate);
		}
	});

	/**
	 * Calculate calendar position
	 */
	function updateCalendarPosition(): void {
		if (!triggerRef || !browser) return;

		const rect = triggerRef.getBoundingClientRect();
		const spaceBelow = window.innerHeight - rect.bottom;
		const spaceAbove = rect.top;
		const calendarHeight = 400;

		if (spaceBelow >= calendarHeight || spaceBelow > spaceAbove) {
			calendarPosition = {
				x: rect.left,
				y: rect.bottom + 4
			};
		} else {
			calendarPosition = {
				x: rect.left,
				y: rect.top - calendarHeight - 4
			};
		}
	}

	/**
	 * Open the calendar
	 */
	function openCalendar(input: 'start' | 'end'): void {
		if (disabled) return;
		activeInput = input;
		updateCalendarPosition();
		isOpen = true;
	}

	/**
	 * Close the calendar
	 */
	function closeCalendar(): void {
		isOpen = false;
		hoveredDate = undefined;
	}

	/**
	 * Handle date selection from calendar
	 */
	function handleDateSelect(date: Date): void {
		const selectedDate = startOfDay(date);

		if (activeInput === 'start') {
			startDate = selectedDate;
			startInputValue = formatDate(date, format, locale);

			// If end date is before start date, clear it
			if (endDate && compareDate(selectedDate, endDate) > 0) {
				endDate = undefined;
				endInputValue = '';
			}

			// Switch to end date input
			activeInput = 'end';
			endInputRef?.focus();
		} else {
			// Selecting end date
			if (startDate && compareDate(selectedDate, startDate) < 0) {
				// If selected date is before start date, swap them
				endDate = startDate;
				startDate = selectedDate;
				startInputValue = formatDate(selectedDate, format, locale);
				endInputValue = formatDate(endDate, format, locale);
			} else {
				endDate = selectedDate;
				endInputValue = formatDate(date, format, locale);
			}

			closeCalendar();
			onchange?.(startDate, endDate);
		}
	}

	/**
	 * Handle input change (manual typing)
	 */
	function handleInputChange(event: Event, input: 'start' | 'end'): void {
		const target = event.target as HTMLInputElement;
		const inputValue = target.value;

		if (input === 'start') {
			startInputValue = inputValue;
			const parsed = parseDate(inputValue, format);
			if (parsed && !isNaN(parsed.getTime())) {
				startDate = startOfDay(parsed);
				currentMonth = new Date(parsed);
				onchange?.(startDate, endDate);
			} else if (inputValue === '') {
				startDate = undefined;
				onchange?.(startDate, endDate);
			}
		} else {
			endInputValue = inputValue;
			const parsed = parseDate(inputValue, format);
			if (parsed && !isNaN(parsed.getTime())) {
				endDate = startOfDay(parsed);
				onchange?.(startDate, endDate);
			} else if (inputValue === '') {
				endDate = undefined;
				onchange?.(startDate, endDate);
			}
		}
	}

	/**
	 * Clear the selected dates
	 */
	function handleClear(): void {
		startDate = undefined;
		endDate = undefined;
		startInputValue = '';
		endInputValue = '';
		onchange?.(undefined, undefined);
		onclear?.();
		startInputRef?.focus();
	}

	/**
	 * Handle input keydown
	 */
	function handleInputKeydown(event: KeyboardEvent, input: 'start' | 'end'): void {
		if (event.key === 'Escape' && isOpen) {
			event.preventDefault();
			closeCalendar();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (!isOpen) {
				openCalendar(input);
			}
		} else if (event.key === 'ArrowDown' && !isOpen) {
			event.preventDefault();
			openCalendar(input);
		} else if (event.key === 'Tab' && input === 'start') {
			closeCalendar();
		}
	}

	/**
	 * Check if a date is in the selected range
	 */
	function isDateInRange(date: Date): boolean {
		if (!startDate || !endDate) return false;
		const time = date.getTime();
		return time >= startDate.getTime() && time <= endDate.getTime();
	}

	/**
	 * Check if a date is in the preview range (while hovering)
	 */
	function isDateInPreviewRange(date: Date): boolean {
		if (!startDate || !hoveredDate || endDate) return false;
		const dateTime = date.getTime();
		const startTime = startDate.getTime();
		const hoverTime = hoveredDate.getTime();

		if (hoverTime >= startTime) {
			return dateTime >= startTime && dateTime <= hoverTime;
		} else {
			return dateTime >= hoverTime && dateTime <= startTime;
		}
	}

	/**
	 * Handle click outside to close calendar
	 */
	$effect(() => {
		if (isOpen && browser) {
			const handleClickOutside = (event: MouseEvent) => {
				const target = event.target as Node;
				if (
					triggerRef &&
					!triggerRef.contains(target) &&
					!document.getElementById(calendarId)?.contains(target)
				) {
					closeCalendar();
				}
			};

			const timeoutId = setTimeout(() => {
				document.addEventListener('mousedown', handleClickOutside);
			}, 0);

			return () => {
				clearTimeout(timeoutId);
				document.removeEventListener('mousedown', handleClickOutside);
			};
		}
	});

	/**
	 * Handle Escape key globally when calendar is open
	 */
	$effect(() => {
		if (isOpen && browser) {
			const handleEscape = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					closeCalendar();
					if (activeInput === 'start') {
						startInputRef?.focus();
					} else {
						endInputRef?.focus();
					}
				}
			};

			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	});

	// CSS classes
	const containerClasses = $derived(
		['daterangepicker', error && 'daterangepicker--error', className].filter(Boolean).join(' ')
	);

	const inputClasses = (input: 'start' | 'end') =>
		[
			'daterangepicker__input',
			`daterangepicker__input--${size}`,
			`daterangepicker__input--${input}`,
			error && 'daterangepicker__input--error',
			disabled && 'daterangepicker__input--disabled'
		]
			.filter(Boolean)
			.join(' ');
</script>

<div class={containerClasses} bind:this={triggerRef}>
	{#if label}
		<FormLabel for={`${uniqueId}-start`} {required}>
			{label}
		</FormLabel>
	{/if}

	<div class="daterangepicker__inputs">
		<div class="daterangepicker__input-wrapper">
			<input
				bind:this={startInputRef}
				bind:value={startInputValue}
				type="text"
				class={inputClasses('start')}
				id={`${uniqueId}-start`}
				name={name ? `${name}-start` : undefined}
				placeholder={placeholderStart}
				{disabled}
				{required}
				autocomplete="off"
				role="combobox"
				aria-expanded={isOpen && activeInput === 'start'}
				aria-controls={calendarId}
				aria-haspopup="dialog"
				aria-invalid={!!error}
				aria-describedby={errorId}
				data-testid={dataTestId ? `${dataTestId}-start` : undefined}
				oninput={(e) => handleInputChange(e, 'start')}
				onfocus={() => openCalendar('start')}
				onkeydown={(e) => handleInputKeydown(e, 'start')}
			/>
		</div>

		<div class="daterangepicker__separator">
			<ArrowRight size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
		</div>

		<div class="daterangepicker__input-wrapper">
			<input
				bind:this={endInputRef}
				bind:value={endInputValue}
				type="text"
				class={inputClasses('end')}
				id={`${uniqueId}-end`}
				name={name ? `${name}-end` : undefined}
				placeholder={placeholderEnd}
				{disabled}
				{required}
				autocomplete="off"
				role="combobox"
				aria-expanded={isOpen && activeInput === 'end'}
				aria-controls={calendarId}
				aria-haspopup="dialog"
				aria-invalid={!!error}
				aria-describedby={errorId}
				data-testid={dataTestId ? `${dataTestId}-end` : undefined}
				oninput={(e) => handleInputChange(e, 'end')}
				onfocus={() => openCalendar('end')}
				onkeydown={(e) => handleInputKeydown(e, 'end')}
			/>
		</div>

		{#if (startDate || endDate) && !disabled}
			<button
				type="button"
				class="daterangepicker__clear-button"
				onclick={handleClear}
				aria-label="Clear dates"
			>
				<X size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
			</button>
		{/if}
	</div>

	{#if error}
		<div class="daterangepicker__error" id={errorId} role="alert">
			{error}
		</div>
	{/if}
</div>

{#if isOpen}
	<Portal enabled={true}>
		<div
			class="daterangepicker__calendar-wrapper"
			id={calendarId}
			style="position: fixed; left: {calendarPosition.x}px; top: {calendarPosition.y}px; z-index: 10001;"
		>
			<div
				class="daterangepicker__calendar"
				role="dialog"
				aria-modal="false"
				aria-label="Choose date range"
			>
				<CalendarComponent
					selectedDate={activeInput === 'start' ? startDate : endDate}
					bind:currentMonth
					min={activeInput === 'start' ? min : startDate || min}
					{max}
					{locale}
					{showWeekNumbers}
					{highlightToday}
					{startDay}
					onSelectDate={handleDateSelect}
				/>
			</div>
		</div>
	</Portal>
{/if}

<style>
	.daterangepicker {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 100%;
	}

	.daterangepicker__inputs {
		position: relative;
		display: flex;
		align-items: center;
		gap: var(--space-2);
		width: 100%;
	}

	.daterangepicker__input-wrapper {
		flex: 1;
		position: relative;
	}

	.daterangepicker__separator {
		display: flex;
		align-items: center;
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	/* Input */
	.daterangepicker__input {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base, 16px);
		font-family: var(--font-family-base);
		line-height: var(--line-height-normal);
		color: var(--color-text-primary);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition: var(--transition-base);
		box-shadow: var(--shadow-sm);
	}

	.daterangepicker__input::placeholder {
		color: var(--color-text-tertiary);
	}

	.daterangepicker__input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.daterangepicker__input:disabled {
		background-color: var(--color-background-secondary);
		color: var(--color-text-disabled);
		cursor: not-allowed;
	}

	/* Size variants */
	.daterangepicker__input--sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-small);
	}

	.daterangepicker__input--lg {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-medium);
	}

	/* Error state */
	.daterangepicker__input--error {
		border-color: var(--color-error-500);
	}

	.daterangepicker__input--error:focus {
		border-color: var(--color-error-600);
		box-shadow: 0 0 0 3px var(--color-error-100);
	}

	/* Clear button */
	.daterangepicker__clear-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: transparent;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-base);
		flex-shrink: 0;
	}

	.daterangepicker__clear-button:hover {
		color: var(--color-text-primary);
		background: var(--color-background-secondary);
		border-color: var(--color-border-strong);
	}

	.daterangepicker__clear-button:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	/* Error message */
	.daterangepicker__error {
		font-size: var(--font-size-small);
		color: var(--color-error-500);
		margin-top: var(--space-1);
	}

	/* Calendar wrapper */
	.daterangepicker__calendar-wrapper {
		position: fixed;
		z-index: 10001;
	}

	.daterangepicker__calendar {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: daterangepicker-fade-in 0.15s ease-out;
	}

	@keyframes daterangepicker-fade-in {
		from {
			opacity: 0;
			transform: translateY(-4px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* High contrast mode */
	@media (prefers-contrast: high) {
		.daterangepicker__input {
			border-width: 2px;
		}

		.daterangepicker__input:focus {
			box-shadow: 0 0 0 3px var(--color-text-primary);
		}

		.daterangepicker__input--error:focus {
			box-shadow: 0 0 0 3px var(--color-error-800);
		}

		.daterangepicker__calendar {
			border-width: 2px;
		}
	}
</style>
