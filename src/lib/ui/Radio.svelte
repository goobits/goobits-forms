<script lang="ts">
	/**
	 * Props interface for the Radio component
	 */
	interface Props {
		/** Whether the radio is checked */
		checked?: boolean;
		/** Whether the radio is disabled */
		disabled?: boolean;
		/** Name attribute for radio group */
		name: string;
		/** Value of this radio option */
		value: string | number;
		/** Label text for the radio */
		label?: string;
		/** Error message to display */
		error?: string;
		/** Size of the radio */
		size?: 'sm' | 'md' | 'lg';
		/** ID for the input element */
		id?: string;
		/** Additional CSS class names */
		class?: string;
		/** ARIA label for accessibility */
		'aria-label'?: string;
		/** ARIA described by for error messages */
		'aria-describedby'?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
	}

	let {
		checked = false,
		disabled = false,
		name,
		value,
		label,
		error,
		size = 'md',
		id = `radio-${Math.random().toString(36).substring(2, 9)}`,
		class: className = '',
		'aria-label': ariaLabel,
		'aria-describedby': ariaDescribedBy,
		'data-testid': dataTestId,
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Input element reference
	let inputElement: HTMLInputElement | undefined = $state();

	// Combine CSS classes using BEM methodology
	const radioClasses = $derived(
		[
			'radio',
			`radio--${size}`,
			error && 'radio--error',
			disabled && 'radio--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Handle change event
	function handleChange(event: Event) {
		if (onchange) {
			onchange(event);
		}
	}

	// Combine aria-describedby with error ID if present
	const errorId = error ? `${id}-error` : undefined;
	const describedBy = $derived(
		[ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined
	);

	// Expose the input element for binding
	export { inputElement as element };
</script>

<div class={radioClasses}>
	<input
		bind:this={inputElement}
		checked={checked}
		type="radio"
		class="radio__input"
		{id}
		{name}
		{value}
		{disabled}
		aria-describedby={describedBy}
		aria-label={ariaLabel}
		data-testid={dataTestId}
		onchange={handleChange}
		{...restProps}
	/>
	<span class="radio__button" aria-hidden="true"></span>
	{#if label || children?.label}
		<label for={id} class="radio__label">
			{#if children?.label}
				{@render children.label()}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
</div>
{#if error}
	<div class="radio__error" id={errorId} role="alert">
		{error}
	</div>
{/if}

<style>
	@import './Radio.css';
</style>
