<script lang="ts">
	import type { Snippet } from 'svelte';

	/**
	 * FormLabel - Generic form field wrapper component
	 *
	 * Wraps form inputs with label, help text, and error/success messages
	 * using Svelte 5 Snippet pattern for flexible composition.
	 *
	 * @example
	 * <FormLabel label="Email" id="email" required error="Invalid email">
	 *   <Input id="email" type="email" hasError={true} describedBy="email-error" />
	 * </FormLabel>
	 */
	interface Props {
		/** Label text for the field */
		label?: string;
		/** Field ID (links label to input) */
		id?: string;
		/** Whether field is required */
		required?: boolean;
		/** Whether field is optional (shows optional indicator) */
		optional?: boolean;
		/** Help text shown below the input */
		helpText?: string;
		/** Error message (takes precedence over success) */
		error?: string;
		/** Success message */
		success?: string;
		/** Display label and input inline (horizontal layout) */
		inline?: boolean;
		/** Snippet containing the form input */
		children: Snippet;
		/** Additional CSS class names */
		class?: string;
		/** Optional indicator text (default: "(optional)") */
		optionalText?: string;
	}

	const {
		label,
		id,
		required = false,
		optional = false,
		helpText,
		error,
		success,
		inline = false,
		children,
		class: className = '',
		optionalText = '(optional)'
	}: Props = $props();

	// Combine CSS classes using BEM methodology
	const fieldClasses = $derived([
		'form-label',
		inline && 'form-label--inline',
		className
	].filter(Boolean).join(' '));

	// Label classes
	const labelClasses = $derived([
		'form-label__text',
		required && 'form-label__text--required',
		optional && 'form-label__text--optional'
	].filter(Boolean).join(' '));
</script>

<div class={fieldClasses}>
	{#if label}
		<label for={id} class={labelClasses}>
			{label}{#if optional}<span class="form-label__optional">{optionalText}</span>{/if}
		</label>
	{/if}

	{@render children()}

	{#if helpText && !error && !success}
		<div class="form-label__help" id="{id}-help">
			{helpText}
		</div>
	{/if}

	{#if error}
		<div class="form-label__error" role="alert" id="{id}-error">
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="currentColor"
				aria-hidden="true"
				class="form-label__icon"
			>
				<path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 4a1 1 0 112 0v3a1 1 0 11-2 0V4zm1 8a1 1 0 100-2 1 1 0 000 2z"/>
			</svg>
			{error}
		</div>
	{/if}

	{#if success && !error}
		<div class="form-label__success" id="{id}-success">
			<svg
				width="16"
				height="16"
				viewBox="0 0 16 16"
				fill="currentColor"
				aria-hidden="true"
				class="form-label__icon"
			>
				<path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
			</svg>
			{success}
		</div>
	{/if}
</div>

<style>
	/* Field wrapper */
	.form-label {
		display: flex;
		flex-direction: column;
		gap: var(--space-1, 0.25rem);
	}

	.form-label--inline {
		flex-direction: row;
		align-items: center;
		gap: var(--space-3, 0.75rem);
	}

	/* Label */
	.form-label__text {
		display: block;
		font-size: var(--font-size-sm, 14px);
		font-weight: var(--font-weight-medium, 500);
		color: var(--color-text-primary, #1f2937);
		line-height: var(--line-height-tight, 1.25);
	}

	.form-label__text--required::after {
		content: ' *';
		color: var(--color-error-500, #ef4444);
	}

	.form-label__optional {
		color: var(--color-text-tertiary, #9ca3af);
		font-weight: var(--font-weight-normal, 400);
		margin-left: 0.25rem;
	}

	/* Help text */
	.form-label__help {
		font-size: var(--font-size-sm, 14px);
		color: var(--color-text-secondary, #6b7280);
		line-height: var(--line-height-tight, 1.25);
	}

	/* Error message */
	.form-label__error {
		font-size: var(--font-size-sm, 14px);
		color: var(--color-error-600, #dc2626);
		line-height: var(--line-height-tight, 1.25);
		display: flex;
		align-items: center;
		gap: var(--space-1, 0.25rem);
	}

	/* Success message */
	.form-label__success {
		font-size: var(--font-size-sm, 14px);
		color: var(--color-success-600, #16a34a);
		line-height: var(--line-height-tight, 1.25);
		display: flex;
		align-items: center;
		gap: var(--space-1, 0.25rem);
	}

	/* Icons */
	.form-label__icon {
		flex-shrink: 0;
	}

	/* High contrast mode adjustments */
	@media (prefers-contrast: high) {
		.form-label__error {
			color: var(--color-error-900, #7f1d1d);
		}

		.form-label__success {
			color: var(--color-success-900, #14532d);
		}

		.form-label__text--required::after {
			color: var(--color-error-900, #7f1d1d);
		}
	}
</style>
