<script lang="ts">
	interface Props {
		/**
		 * The size of the input
		 */
		size?: 'sm' | 'md' | 'lg';

		/**
		 * The validation state of the input
		 */
		variant?: 'default' | 'error' | 'success';

		/**
		 * Text to display before the input value
		 */
		prefix?: string;

		/**
		 * Text to display after the input value
		 */
		suffix?: string;

		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * The input value (for two-way binding)
		 */
		value?: string | number;

		/**
		 * Input type
		 */
		type?: string;

		/**
		 * Placeholder text
		 */
		placeholder?: string;

		/**
		 * Whether the input is disabled
		 */
		disabled?: boolean;

		/**
		 * Whether the input is readonly
		 */
		readonly?: boolean;

		/**
		 * Input ID
		 */
		id?: string;

		/**
		 * Input name
		 */
		name?: string;

		/**
		 * Whether the input is required
		 */
		required?: boolean;

		/**
		 * Maximum length for text inputs
		 */
		maxlength?: number;

		/**
		 * Minimum value for number inputs
		 */
		min?: number;

		/**
		 * Maximum value for number inputs
		 */
		max?: number;

		/**
		 * Step value for number inputs
		 */
		step?: number;

		/**
		 * Pattern for input validation
		 */
		pattern?: string;

		/**
		 * Autocomplete attribute
		 */
		autocomplete?: string;
	}

	let {
		size = 'md',
		variant = 'default',
		prefix,
		suffix,
		class: className = '',
		value = $bindable(),
		type = 'text',
		placeholder,
		disabled = false,
		readonly = false,
		id,
		name,
		required = false,
		maxlength,
		min,
		max,
		step,
		pattern,
		autocomplete,
		...restProps
	}: Props = $props();

	// Input element reference
	let inputElement = $state<HTMLInputElement>();
	
	// Ensure value is never undefined for binding
	let internalValue = $state(value ?? '');
	
	// Keep internal value in sync with prop
	$effect(() => {
		if (value !== undefined && value !== internalValue) {
			internalValue = value;
		}
	});
	
	// Update external value when internal value changes
	$effect(() => {
		if (value !== internalValue) {
			value = internalValue;
		}
	});

	// Combine CSS classes
	const inputClasses = $derived([
		'input',
		`input-${size}`,
		variant === 'error' && 'input-error',
		variant === 'success' && 'input-success',
		prefix && 'input-with-prefix',
		suffix && 'input-with-suffix',
		className
	].filter(Boolean).join(' '));

	// Expose the input element for binding
	export { inputElement as element };
</script>

{#if prefix || suffix}
	<div class="input-group">
		{#if prefix}
			<span class="input-group-prefix">
				{prefix}
			</span>
		{/if}
		{#if type === 'checkbox'}
			<input
				bind:this={inputElement}
				bind:checked={internalValue}
				class="{inputClasses} input-group-input"
				type="checkbox"
				{placeholder}
				{disabled}
				{readonly}
				{id}
				{name}
				{required}
				{maxlength}
				{min}
				{max}
				{step}
				{pattern}
				{autocomplete}
				{...restProps}
			/>
		{:else}
			<input
				bind:this={inputElement}
				bind:value={internalValue}
				class="{inputClasses} input-group-input"
				{type}
				{placeholder}
				{disabled}
				{readonly}
				{id}
				{name}
				{required}
				{maxlength}
				{min}
				{max}
				{step}
				{pattern}
				{autocomplete}
				{...restProps}
			/>
		{/if}
		{#if suffix}
			<span class="input-group-suffix">
				{suffix}
			</span>
		{/if}
	</div>
{:else}
	{#if type === 'checkbox'}
		<input
			bind:this={inputElement}
			bind:checked={internalValue}
			class={inputClasses}
			type="checkbox"
			{placeholder}
			{disabled}
			{readonly}
			{id}
			{name}
			{required}
			{maxlength}
			{min}
			{max}
			{step}
			{pattern}
			{autocomplete}
			{...restProps}
		/>
	{:else}
		<input
			bind:this={inputElement}
			bind:value={internalValue}
			class={inputClasses}
			{type}
			{placeholder}
			{disabled}
			{readonly}
			{id}
			{name}
			{required}
			{maxlength}
			{min}
			{max}
			{step}
			{pattern}
			{autocomplete}
			{...restProps}
		/>
	{/if}
{/if}

<style>
	/* Input base styles */
	.input {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base, 16px);
		font-family: var(--font-family-sans, system-ui, sans-serif);
		line-height: var(--line-height-normal, 1.5);
		color: var(--color-text-primary);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		transition: var(--transition-base, all 0.15s ease);
		box-shadow: var(--shadow-sm);
	}

	.input::placeholder {
		color: var(--color-text-tertiary);
	}

	.input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.input:disabled {
		background-color: var(--color-background-secondary);
		color: var(--color-text-disabled);
		cursor: not-allowed;
	}

	/* Input size variants */
	.input-sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-sm, 14px);
	}

	.input-lg {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-lg, 18px);
	}

	/* Input state variants */
	.input-error {
		border-color: var(--color-error-500);
		box-shadow: 0 0 0 3px var(--color-error-100);
	}

	.input-error:focus {
		border-color: var(--color-error-600);
		box-shadow: 0 0 0 3px var(--color-error-200);
	}

	.input-success {
		border-color: var(--color-success-500);
		box-shadow: 0 0 0 3px var(--color-success-100);
	}

	.input-success:focus {
		border-color: var(--color-success-600);
		box-shadow: 0 0 0 3px var(--color-success-200);
	}

	/* Input group (for inputs with prefix/suffix) */
	.input-group {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-group-input {
		flex: 1;
	}

	.input-group-prefix {
		position: absolute;
		left: var(--space-3);
		color: var(--color-text-tertiary);
		pointer-events: none;
		font-size: var(--font-size-sm, 14px);
		z-index: 1;
	}

	.input-group-suffix {
		position: absolute;
		right: var(--space-3);
		color: var(--color-text-tertiary);
		pointer-events: none;
		font-size: var(--font-size-sm, 14px);
		z-index: 1;
	}

	.input-with-prefix {
		padding-left: var(--space-10);
	}

	.input-with-suffix {
		padding-right: var(--space-10);
	}

	/* High contrast mode adjustments */
	@media (prefers-contrast: high) {
		.input {
			border-width: 2px;
		}

		.input:focus {
			box-shadow: 0 0 0 3px var(--color-text-primary);
		}

		.input-error:focus {
			box-shadow: 0 0 0 3px var(--color-error-800);
		}

		.input-success:focus {
			box-shadow: 0 0 0 3px var(--color-success-800);
		}
	}
</style>