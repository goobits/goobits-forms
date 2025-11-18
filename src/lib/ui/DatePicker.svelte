<script lang="ts">
	/**
	 * DatePicker Component
	 *
	 * A production-ready date picker with calendar popup,
	 * keyboard navigation, and accessibility support.
	 */

	import { Calendar, X } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import CalendarComponent from './Calendar.svelte';
	import Portal from './Portal.svelte';
	import { formatDate, parseDate, startOfDay } from '../utils/date-utils';

	/**
	 * Props interface for the DatePicker component
	 */
	interface Props {
		/** The selected date value */
		value?: Date;
		/** Minimum selectable date */
		min?: Date;
		/** Maximum selectable date */
		max?: Date;
		/** Whether the input is disabled */
		disabled?: boolean;
		/** Label text */
		label?: string;
		/** Placeholder text */
		placeholder?: string;
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
		/** Input name */
		name?: string;
		/** Whether the field is required */
		required?: boolean;
		/** Test ID for testing */
		'data-testid'?: string;
		/** Callback when date changes */
		onchange?: (date: Date | undefined) => void;
		/** Callback when date is cleared */
		onclear?: () => void;
		/** First day of week (0=Sunday, 1=Monday) */
		startDay?: number;
	}

	let {
		value = $bindable(),
		min,
		max,
		disabled = false,
		label,
		placeholder = 'Select date',
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
	let inputRef: HTMLInputElement | undefined = $state();
	let triggerRef: HTMLDivElement | undefined = $state();
	let calendarPosition = $state<{ x: number; y: number }>({ x: 0, y: 0 });
	let currentMonth = $state(value ? new Date(value) : new Date());
	let inputValue = $state('');
	let isProgrammaticFocus = $state(false);

	// Unique ID for accessibility
	const uniqueId = id || `datepicker-${Math.random().toString(36).substr(2, 9)}`;
	const calendarId = `${uniqueId}-calendar`;
	const errorId = error ? `${uniqueId}-error` : undefined;

	// Update input value when value prop changes
	$effect(() => {
		if (value) {
			inputValue = formatDate(value, format, locale);
		} else {
			inputValue = '';
		}
	});

	// Update current month when value changes
	$effect(() => {
		if (value) {
			currentMonth = new Date(value);
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
		const calendarHeight = 400; // Approximate calendar height

		// Position below if there's enough space, otherwise above
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
	function openCalendar(): void {
		if (disabled) return;
		updateCalendarPosition();
		isOpen = true;
	}

	/**
	 * Close the calendar
	 */
	function closeCalendar(): void {
		isOpen = false;
	}

	/**
	 * Toggle the calendar
	 */
	function toggleCalendar(): void {
		if (isOpen) {
			closeCalendar();
		} else {
			openCalendar();
		}
	}

	/**
	 * Handle date selection from calendar
	 */
	function handleDateSelect(date: Date): void {
		value = startOfDay(date);
		inputValue = formatDate(date, format, locale);
		onchange?.(value);
		closeCalendar();

		// Set flag before programmatic focus to prevent reopening calendar
		isProgrammaticFocus = true;
		inputRef?.focus();
		// Reset flag after focus event has been processed
		setTimeout(() => {
			isProgrammaticFocus = false;
		}, 0);
	}

	/**
	 * Handle input change (manual typing)
	 */
	function handleInputChange(event: Event): void {
		const target = event.target as HTMLInputElement;
		inputValue = target.value;

		// Try to parse the input
		const parsed = parseDate(inputValue, format);
		if (parsed && !isNaN(parsed.getTime())) {
			value = startOfDay(parsed);
			currentMonth = new Date(parsed);
			onchange?.(value);
		} else if (inputValue === '') {
			value = undefined;
			onchange?.(undefined);
		}
	}

	/**
	 * Clear the selected date
	 */
	function handleClear(): void {
		value = undefined;
		inputValue = '';
		onchange?.(undefined);
		onclear?.();

		// Set flag before programmatic focus to prevent reopening calendar
		isProgrammaticFocus = true;
		inputRef?.focus();
		// Reset flag after focus event has been processed
		setTimeout(() => {
			isProgrammaticFocus = false;
		}, 0);
	}

	/**
	 * Handle input focus
	 */
	function handleInputFocus(): void {
		// Don't open calendar if this is a programmatic focus
		if (!isProgrammaticFocus) {
			openCalendar();
		}
	}

	/**
	 * Handle input keydown
	 */
	function handleInputKeydown(event: KeyboardEvent): void {
		if (event.key === 'Escape' && isOpen) {
			event.preventDefault();
			closeCalendar();
		} else if (event.key === 'Enter') {
			event.preventDefault();
			if (!isOpen) {
				openCalendar();
			}
		} else if (event.key === 'ArrowDown' && !isOpen) {
			event.preventDefault();
			openCalendar();
		}
	}

	/**
	 * Handle click outside to close calendar
	 */
	$effect(() => {
		if (isOpen && browser) {
			const handleClickOutside = (event: MouseEvent) => {
				const target = event.target as Node;
				// Check if click is outside both trigger and calendar
				if (
					triggerRef &&
					!triggerRef.contains(target) &&
					!document.getElementById(calendarId)?.contains(target)
				) {
					closeCalendar();
				}
			};

			// Use a small delay to prevent immediate closing
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
					inputRef?.focus();
				}
			};

			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	});

	// CSS classes
	const inputClasses = $derived(
		[
			'datepicker__input',
			`datepicker__input--${size}`,
			error && 'datepicker__input--error',
			disabled && 'datepicker__input--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class="datepicker" bind:this={triggerRef}>
	{#if label}
		<label for={uniqueId} class="datepicker__label">
			{label}
			{#if required}<span class="datepicker__label-required" aria-label="required">*</span>{/if}
		</label>
	{/if}

	<div class="datepicker__wrapper">
		<input
			bind:this={inputRef}
			bind:value={inputValue}
			type="text"
			class={inputClasses}
			id={uniqueId}
			{name}
			{placeholder}
			{disabled}
			{required}
			autocomplete="off"
			role="combobox"
			aria-expanded={isOpen}
			aria-controls={calendarId}
			aria-haspopup="dialog"
			aria-invalid={!!error}
			aria-describedby={errorId}
			data-testid={dataTestId}
			oninput={handleInputChange}
			onfocus={handleInputFocus}
			onkeydown={handleInputKeydown}
		/>

		<button
			type="button"
			class="datepicker__icon-button"
			onclick={toggleCalendar}
			{disabled}
			aria-label="Toggle calendar"
			tabindex={-1}
		>
			<Calendar size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
		</button>

		{#if value && !disabled}
			<button
				type="button"
				class="datepicker__clear-button"
				onclick={handleClear}
				aria-label="Clear date"
				tabindex={-1}
			>
				<X size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />
			</button>
		{/if}
	</div>

	{#if error}
		<div class="datepicker__error" id={errorId} role="alert">
			{error}
		</div>
	{/if}
</div>

{#if isOpen}
	<Portal enabled={true}>
		<div
			class="datepicker__calendar-wrapper"
			id={calendarId}
			style="position: fixed; left: {calendarPosition.x}px; top: {calendarPosition.y}px; z-index: 10001;"
		>
			<div class="datepicker__calendar" role="dialog" aria-modal="false" aria-label="Choose date">
				<CalendarComponent
					selectedDate={value}
					bind:currentMonth
					{min}
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
	.datepicker {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
		width: 100%;
	}

	.datepicker__wrapper {
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
	}

	/* Input */
	.datepicker__input {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		padding-right: calc(var(--space-10) + var(--space-10)); /* Space for both icons */
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

	.datepicker__input::placeholder {
		color: var(--color-text-tertiary);
	}

	.datepicker__input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.datepicker__input:disabled {
		background-color: var(--color-background-secondary);
		color: var(--color-text-disabled);
		cursor: not-allowed;
	}

	/* Size variants */
	.datepicker__input--sm {
		padding: var(--space-1) var(--space-2);
		padding-right: var(--space-10);
		font-size: var(--font-size-small);
	}

	.datepicker__input--lg {
		padding: var(--space-3) var(--space-4);
		padding-right: calc(var(--space-12) + var(--space-10));
		font-size: var(--font-size-medium);
	}

	/* Error state */
	.datepicker__input--error {
		border-color: var(--color-error-500);
	}

	.datepicker__input--error:focus {
		border-color: var(--color-error-600);
		box-shadow: 0 0 0 3px var(--color-error-100);
	}

	/* Icon buttons */
	.datepicker__icon-button,
	.datepicker__clear-button {
		position: absolute;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-1);
		background: transparent;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition: var(--transition-base);
		border-radius: var(--radius-md);
	}

	.datepicker__icon-button {
		right: var(--space-2);
		pointer-events: auto;
	}

	.datepicker__clear-button {
		right: calc(var(--space-8) + var(--space-2));
	}

	.datepicker__icon-button:hover,
	.datepicker__clear-button:hover {
		color: var(--color-text-primary);
		background: var(--color-background-secondary);
	}

	.datepicker__icon-button:focus-visible,
	.datepicker__clear-button:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	.datepicker__icon-button:disabled {
		color: var(--color-text-disabled);
		cursor: not-allowed;
		opacity: 0.5;
	}

	.datepicker__icon-button:disabled:hover {
		background: transparent;
	}

	/* Error message */
	.datepicker__error {
		font-size: var(--font-size-small);
		color: var(--color-error-500);
		margin-top: var(--space-1);
	}

	/* Calendar wrapper */
	.datepicker__calendar-wrapper {
		position: fixed;
		z-index: 10001;
	}

	.datepicker__calendar {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		animation: datepicker-fade-in 0.15s ease-out;
	}

	@keyframes datepicker-fade-in {
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
		.datepicker__input {
			border-width: 2px;
		}

		.datepicker__input:focus {
			box-shadow: 0 0 0 3px var(--color-text-primary);
		}

		.datepicker__input--error:focus {
			box-shadow: 0 0 0 3px var(--color-error-800);
		}

		.datepicker__calendar {
			border-width: 2px;
		}
	}

	/* Label */
	.datepicker__label {
		display: block;
		font-size: var(--font-size-sm, 14px);
		font-weight: var(--font-weight-medium, 500);
		color: var(--color-text-primary, #1f2937);
		line-height: var(--line-height-tight, 1.25);
		margin-bottom: var(--space-1, 0.25rem);
	}

	.datepicker__label-required {
		color: var(--color-error-500, #ef4444);
		margin-left: 0.125rem;
	}
</style>
