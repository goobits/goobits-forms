<script lang="ts">
	import Checkbox from './Checkbox.svelte';

	/**
	 * Interface for checkbox options
	 */
	interface CheckboxOption {
		value: string | number;
		label: string;
		disabled?: boolean;
	}

	/**
	 * Props interface for the CheckboxGroup component
	 */
	interface Props {
		/** Array of checkbox options */
		options: CheckboxOption[];
		/** Array of selected values */
		value?: (string | number)[];
		/** Name attribute for all checkboxes in the group */
		name: string;
		/** Label for the checkbox group */
		label?: string;
		/** Error message */
		error?: string;
		/** Whether all checkboxes are disabled */
		disabled?: boolean;
		/** Orientation of the checkbox group */
		orientation?: 'vertical' | 'horizontal';
		/** Size of the checkboxes */
		size?: 'sm' | 'md' | 'lg';
		/** Additional CSS class names */
		class?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
		/** Callback when selection changes */
		onchange?: (values: (string | number)[]) => void;
	}

	let {
		options,
		value = $bindable([]),
		name,
		label,
		error,
		disabled = false,
		orientation = 'vertical',
		size = 'md',
		class: className = '',
		'data-testid': dataTestId,
		onchange,
		...restProps
	}: Props = $props();

	// Auto-generate ID for the fieldset
	const groupId = $derived(`checkbox-group-${Math.random().toString(36).substr(2, 9)}`);
	const errorId = $derived(`${groupId}-error`);

	// Combine CSS classes using BEM methodology
	const groupClasses = $derived(
		[
			'checkbox-group',
			`checkbox-group--${orientation}`,
			error && 'checkbox-group--error',
			disabled && 'checkbox-group--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Handle individual checkbox change
	function handleCheckboxChange(optionValue: string | number, checked: boolean) {
		const newValue = checked
			? [...value, optionValue]
			: value.filter((v) => v !== optionValue);

		value = newValue;

		if (onchange) {
			onchange(newValue);
		}
	}

	// Check if a value is selected
	function isChecked(optionValue: string | number): boolean {
		return value.includes(optionValue);
	}
</script>

<fieldset
	class={groupClasses}
	data-invalid={!!error}
	aria-describedby={error ? errorId : undefined}
	data-testid={dataTestId}
	{...restProps}
>
	{#if label}
		<legend class="checkbox-group__label">{label}</legend>
	{/if}
	<div class="checkbox-group__options">
		{#each options as option}
			<Checkbox
				checked={isChecked(option.value)}
				onchange={(checked) => handleCheckboxChange(option.value, checked)}
				name={name}
				value={option.value}
				label={option.label}
				disabled={disabled || option.disabled}
				{size}
			/>
		{/each}
	</div>
	{#if error}
		<div class="checkbox-group__error" id={errorId} role="alert">
			{error}
		</div>
	{/if}
</fieldset>

<style>
	/* Base CheckboxGroup Styles */
	.checkbox-group {
		border: none;
		padding: 0;
		margin: 0;
		min-width: 0;
	}

	.checkbox-group__label {
		font-family: var(--font-family-base);
		font-size: var(--font-size-base);
		font-weight: var(--font-weight-semibold);
		color: var(--color-text-primary);
		margin-bottom: var(--space-3);
		display: block;
		line-height: var(--line-height-normal);
	}

	.checkbox-group__options {
		display: flex;
		gap: var(--space-3);
	}

	/* Orientation Variants */
	.checkbox-group--vertical .checkbox-group__options {
		flex-direction: column;
		align-items: flex-start;
	}

	.checkbox-group--horizontal .checkbox-group__options {
		flex-direction: row;
		flex-wrap: wrap;
		align-items: center;
	}

	/* Error State */
	.checkbox-group--error .checkbox-group__label {
		color: var(--color-error-600);
	}

	.checkbox-group__error {
		color: var(--color-error-600);
		font-size: var(--font-size-small);
		margin-top: var(--space-2);
	}

	/* Disabled State */
	.checkbox-group--disabled {
		opacity: 0.5;
	}

	.checkbox-group--disabled .checkbox-group__label {
		color: var(--color-text-disabled);
	}

	/* ========================================
	 * ACCESSIBILITY
	 * ======================================== */

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.checkbox-group__label {
			font-weight: var(--font-weight-bold);
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.checkbox-group * {
			transition: none;
		}
	}
</style>
