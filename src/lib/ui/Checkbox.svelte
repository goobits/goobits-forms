<script lang="ts">
	/**
	 * Props interface for the Checkbox component
	 */
	interface Props {
		/** Whether the checkbox is checked */
		checked?: boolean;
		/** Whether the checkbox is in an indeterminate state */
		indeterminate?: boolean;
		/** Whether the checkbox is disabled */
		disabled?: boolean;
		/** Input name attribute */
		name?: string;
		/** Input value attribute */
		value?: string | number;
		/** Label text */
		label?: string;
		/** Error message */
		error?: string;
		/** Size of the checkbox */
		size?: 'sm' | 'md' | 'lg';
		/** Input ID */
		id?: string;
		/** Additional CSS class names */
		class?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
		/** Callback when checked state changes */
		onchange?: (checked: boolean) => void;
	}

	let {
		checked = $bindable(false),
		indeterminate = false,
		disabled = false,
		name,
		value,
		label,
		error,
		size = 'md',
		id,
		class: className = '',
		'data-testid': dataTestId,
		onchange,
		children,
		...restProps
	}: Props = $props();

	// Auto-generate ID if not provided
	const checkboxId = $derived(id || `checkbox-${Math.random().toString(36).substr(2, 9)}`);
	const errorId = $derived(`${checkboxId}-error`);

	// Checkbox element reference
	let checkboxElement: HTMLInputElement | undefined = $state();

	// Update indeterminate state on the DOM element
	$effect(() => {
		if (checkboxElement) {
			checkboxElement.indeterminate = indeterminate;
		}
	});

	// Combine CSS classes using BEM methodology
	const checkboxClasses = $derived(
		[
			'checkbox',
			`checkbox--${size}`,
			error && 'checkbox--error',
			disabled && 'checkbox--disabled',
			indeterminate && 'checkbox--indeterminate',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Handle change event
	function handleChange(event: Event) {
		const target = event.target as HTMLInputElement;
		checked = target.checked;
		if (onchange) {
			onchange(target.checked);
		}
	}

	// Expose the checkbox element for binding
	export { checkboxElement as element };
</script>

<div class={checkboxClasses}>
	<input
		bind:this={checkboxElement}
		bind:checked
		type="checkbox"
		class="checkbox__input"
		id={checkboxId}
		{name}
		{value}
		{disabled}
		aria-invalid={!!error}
		aria-describedby={error ? errorId : undefined}
		aria-checked={indeterminate ? 'mixed' : checked}
		data-testid={dataTestId}
		onchange={handleChange}
		{...restProps}
	/>
	<span class="checkbox__box" aria-hidden="true">
		{#if indeterminate}
			<svg class="checkbox__icon checkbox__icon--indeterminate" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
			</svg>
		{:else if checked}
			<svg class="checkbox__icon checkbox__icon--checked" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		{/if}
	</span>
	{#if label || children}
		<label class="checkbox__label" for={checkboxId}>
			{#if children}
				{@render children()}
			{:else}
				{label}
			{/if}
		</label>
	{/if}
</div>
{#if error}
	<div class="checkbox__error" id={errorId} role="alert">
		{error}
	</div>
{/if}

<style>
	@import './Checkbox.css';
</style>
