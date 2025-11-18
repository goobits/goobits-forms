<script lang="ts">
	import { tick } from 'svelte';

	/**
	 * Props interface for the Textarea component
	 */
	interface Props {
		/** The size of the textarea */
		size?: 'sm' | 'md' | 'lg';
		/** The validation state of the textarea */
		variant?: 'default' | 'error' | 'success';
		/** Whether the textarea should auto-resize based on content */
		autoResize?: boolean;
		/** Maximum number of characters allowed */
		maxLength?: number;
		/** Whether to show character counter */
		showCharCount?: boolean;
		/** Additional CSS class names */
		class?: string;
		/** The textarea value (for two-way binding) */
		value?: string;
		/** Placeholder text */
		placeholder?: string;
		/** Whether the textarea is disabled */
		disabled?: boolean;
		/** Whether the textarea is readonly */
		readonly?: boolean;
		/** Textarea ID */
		id?: string;
		/** Textarea name */
		name?: string;
		/** Whether the textarea is required */
		required?: boolean;
		/** Number of rows */
		rows?: number;
		/** Number of columns */
		cols?: number;
		/** Wrap attribute */
		wrap?: 'hard' | 'soft' | 'off';
		/** Whether the textarea has an error (for ARIA) */
		hasError?: boolean;
		/** ID of the element describing this textarea (for ARIA) */
		describedBy?: string;
	}
	let {
		size = 'md',
		variant = 'default',
		autoResize = false,
		maxLength,
		showCharCount = false,
		class: className = '',
		value = $bindable(),
		placeholder,
		disabled = false,
		readonly = false,
		id,
		name,
		required = false,
		rows = 4,
		cols,
		wrap,
		hasError = false,
		describedBy,
		...restProps
	}: Props = $props();

	// Textarea element reference
	let textareaElement: HTMLTextAreaElement | undefined;

	// Auto-resize functionality
	async function adjustHeight(): Promise<void> {
		if (autoResize && textareaElement) {
			await tick();
			textareaElement.style.height = 'auto';
			textareaElement.style.height = `${textareaElement.scrollHeight}px`;
		}
	}

	// Handle input changes
	async function handleInput(e: Event): Promise<void> {
		const target = e.target as HTMLTextAreaElement;
		value = target.value;

		if (autoResize) {
			await adjustHeight();
		}
	}

	// Adjust height when value changes externally
	$effect(() => {
		if (value !== undefined) {
			adjustHeight();
		}
	});

	// Combine CSS classes using BEM methodology
	const textareaClasses = $derived(
		[
			'textarea',
			'textarea__input',
			`textarea__input--${size}`,
			variant === 'error' && 'textarea__input--error',
			variant === 'success' && 'textarea__input--success',
			autoResize && 'textarea--auto-resize',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Character count
	const currentLength = $derived(value?.toString().length || 0);
	const isOverLimit = $derived(maxLength ? currentLength > maxLength : false);

	// Expose the textarea element for binding
	export { textareaElement as element };
</script>

<div>
	<textarea
		bind:this={textareaElement}
		bind:value
		oninput={handleInput}
		class={textareaClasses}
		{placeholder}
		{disabled}
		{readonly}
		{id}
		{name}
		{required}
		{rows}
		{cols}
		{wrap}
		maxlength={maxLength}
		aria-invalid={hasError || variant === 'error'}
		aria-describedby={describedBy}
		{...restProps}
	></textarea>
	{#if showCharCount && maxLength}
		<div class="textarea__char-counter {isOverLimit ? 'textarea__char-counter--error' : ''}">
			{currentLength}/{maxLength}
		</div>
	{/if}
</div>

<style>
	/* Textarea input base styles */
	.textarea__input {
		display: block;
		width: 100%;
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base, 16px);
		font-family: var(--font-family-base, system-ui, sans-serif);
		line-height: var(--line-height-normal, 1.5);
		color: var(--color-text-primary);
		background-color: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md, 8px);
		transition: var(--transition-base, all 0.15s ease);
		box-shadow: var(--shadow-sm);
	}

	.textarea__input::placeholder {
		color: var(--color-text-tertiary);
	}

	.textarea__input:focus {
		outline: none;
		border-color: var(--color-primary-500);
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	.textarea__input:disabled {
		background-color: var(--color-background-secondary);
		color: var(--color-text-disabled);
		cursor: not-allowed;
	}

	/* Input size variants */
	.textarea__input--sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-sm, 14px);
	}

	.textarea__input--lg {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-lg, 18px);
	}

	/* Input state variants */
	.textarea__input--error {
		border-color: var(--color-error-500);
		box-shadow: 0 0 0 3px var(--color-error-100);
	}

	.textarea__input--error:focus {
		border-color: var(--color-error-600);
		box-shadow: 0 0 0 3px var(--color-error-200);
	}

	.textarea__input--success {
		border-color: var(--color-success-500);
		box-shadow: 0 0 0 3px var(--color-success-100);
	}

	.textarea__input--success:focus {
		border-color: var(--color-success-600);
		box-shadow: 0 0 0 3px var(--color-success-200);
	}

	/* Textarea specific styles */
	.textarea {
		resize: vertical;
		min-height: 80px;
	}

	.textarea--auto-resize {
		resize: none;
		overflow: hidden;
	}

	/* Character counter */
	.textarea__char-counter {
		font-size: var(--font-size-xs, 12px);
		color: var(--color-text-tertiary);
		text-align: right;
		margin-top: var(--space-1);
	}

	.textarea__char-counter--error {
		color: var(--color-error-600);
	}

	/* High contrast mode adjustments */
	@media (prefers-contrast: high) {
		.textarea__input {
			border-width: 2px;
		}

		.textarea__input:focus {
			box-shadow: 0 0 0 3px var(--color-text-primary);
		}

		.textarea__input--error:focus {
			box-shadow: 0 0 0 3px var(--color-error-800);
		}

		.textarea__input--success:focus {
			box-shadow: 0 0 0 3px var(--color-success-800);
		}

		.textarea__char-counter--error {
			color: var(--color-error-800);
		}
	}
</style>
