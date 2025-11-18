<script lang="ts">
	/**
	 * Props interface for the Badge component
	 */
	interface BadgeProps {
		/** Visual variant of the badge */
		variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
		/** Size of the badge */
		size?: 'sm' | 'md' | 'lg';
		/** Whether to use outlined style instead of filled */
		outlined?: boolean;
		/** Whether to use pill shape (fully rounded) */
		pill?: boolean;
		/** Whether to show a dismiss/close button */
		dismissible?: boolean;
		/** Whether to show a status dot indicator */
		dot?: boolean;
		/** Additional CSS class names */
		class?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
	}

	const {
		variant = 'primary',
		size = 'md',
		outlined = false,
		pill = false,
		dismissible = false,
		dot = false,
		class: className = '',
		'data-testid': dataTestId,
		...restProps
	}: BadgeProps = $props();

	// Use createEventDispatcher for events
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher<{
		dismiss: void;
		click: MouseEvent;
	}>();

	// Combine CSS classes using BEM methodology
	const badgeClasses = $derived(
		[
			'badge',
			`badge--${variant}`,
			`badge--${size}`,
			outlined && 'badge--outlined',
			pill && 'badge--pill',
			dismissible && 'badge--dismissible',
			dot && 'badge--with-dot',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	function handleDismiss(event: MouseEvent): void {
		event.stopPropagation();
		dispatch('dismiss');
	}

	function handleClick(event: MouseEvent): void {
		if (!dismissible) {
			dispatch('click', event);
		}
	}
</script>

{#if dismissible}
	<span class={badgeClasses} data-testid={dataTestId} role="status" {...restProps}>
		{#if dot}
			{#if $$slots.dot}
				<span class="badge__dot">
					<slot name="dot" />
				</span>
			{:else}
				<span class="badge__dot" aria-hidden="true"></span>
			{/if}
		{/if}
		{#if $$slots.icon}
			<span class="badge__icon">
				<slot name="icon" />
			</span>
		{/if}
		<span class="badge__content">
			<slot />
		</span>
		<button
			type="button"
			class="badge__dismiss"
			onclick={handleDismiss}
			aria-label="Dismiss"
			tabindex={0}
		>
			<svg
				width="12"
				height="12"
				viewBox="0 0 12 12"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<path
					d="M9 3L3 9M3 3L9 9"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</span>
{:else}
	<span
		class={badgeClasses}
		data-testid={dataTestId}
		role="status"
		onclick={handleClick}
		{...restProps}
	>
		{#if dot}
			{#if $$slots.dot}
				<span class="badge__dot">
					<slot name="dot" />
				</span>
			{:else}
				<span class="badge__dot" aria-hidden="true"></span>
			{/if}
		{/if}
		{#if $$slots.icon}
			<span class="badge__icon">
				<slot name="icon" />
			</span>
		{/if}
		<span class="badge__content">
			<slot />
		</span>
	</span>
{/if}

<style>
	/* Badge base styles */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-1);
		font-family: var(--font-family-base, system-ui, sans-serif);
		font-weight: var(--font-weight-medium, 500);
		line-height: var(--line-height-tight, 1.25);
		white-space: nowrap;
		border-radius: var(--border-radius-medium);
		transition: var(--transition-base, all 0.15s ease);
		cursor: default;
		border: 1px solid transparent;
	}

	/* Size variants */
	.badge--sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-small, 0.875rem);
	}

	.badge--md {
		padding: calc(var(--space-1) + 1px) var(--space-3);
		font-size: var(--font-size-small, 0.875rem);
	}

	.badge--lg {
		padding: var(--space-2) var(--space-4);
		font-size: var(--font-size-base, 1rem);
	}

	/* Pill shape */
	.badge--pill {
		border-radius: var(--border-radius-full, 9999px);
	}

	/* Primary variant - filled */
	.badge--primary {
		background-color: var(--color-primary-500);
		color: var(--color-text-on-primary, #ffffff);
	}

	.badge--primary.badge--outlined {
		background-color: transparent;
		color: var(--color-primary-700);
		border-color: var(--color-primary-500);
	}

	/* Secondary variant - filled */
	.badge--secondary {
		background-color: var(--color-text-secondary);
		color: var(--color-text-on-primary, #ffffff);
	}

	.badge--secondary.badge--outlined {
		background-color: transparent;
		color: var(--color-text-secondary);
		border-color: var(--color-text-secondary);
	}

	/* Success variant - filled */
	.badge--success {
		background-color: var(--color-success-500);
		color: var(--color-text-on-primary, #ffffff);
	}

	.badge--success.badge--outlined {
		background-color: transparent;
		color: var(--color-success-700);
		border-color: var(--color-success-500);
	}

	/* Warning variant - filled */
	.badge--warning {
		background-color: var(--color-warning-500);
		color: var(--color-text-primary);
	}

	.badge--warning.badge--outlined {
		background-color: transparent;
		color: var(--color-warning-700);
		border-color: var(--color-warning-500);
	}

	/* Error variant - filled */
	.badge--error {
		background-color: var(--color-error-500);
		color: var(--color-text-on-primary, #ffffff);
	}

	.badge--error.badge--outlined {
		background-color: transparent;
		color: var(--color-error-700);
		border-color: var(--color-error-500);
	}

	/* Info variant - filled */
	.badge--info {
		background-color: var(--color-info-500);
		color: var(--color-text-on-primary, #ffffff);
	}

	.badge--info.badge--outlined {
		background-color: transparent;
		color: var(--color-info-700);
		border-color: var(--color-info-500);
	}

	/* Badge content wrapper */
	.badge__content {
		display: inline-flex;
		align-items: center;
	}

	/* Icon slot */
	.badge__icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* Dot indicator */
	.badge__dot {
		display: inline-block;
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Dot colors for filled badges */
	.badge--primary .badge__dot {
		background-color: var(--color-primary-100);
	}

	.badge--secondary .badge__dot {
		background-color: var(--color-surface);
	}

	.badge--success .badge__dot {
		background-color: var(--color-success-100);
	}

	.badge--warning .badge__dot {
		background-color: var(--color-warning-100);
	}

	.badge--error .badge__dot {
		background-color: var(--color-error-100);
	}

	.badge--info .badge__dot {
		background-color: var(--color-info-100);
	}

	/* Dot colors for outlined badges */
	.badge--outlined.badge--primary .badge__dot {
		background-color: var(--color-primary-500);
	}

	.badge--outlined.badge--secondary .badge__dot {
		background-color: var(--color-text-secondary);
	}

	.badge--outlined.badge--success .badge__dot {
		background-color: var(--color-success-500);
	}

	.badge--outlined.badge--warning .badge__dot {
		background-color: var(--color-warning-500);
	}

	.badge--outlined.badge--error .badge__dot {
		background-color: var(--color-error-500);
	}

	.badge--outlined.badge--info .badge__dot {
		background-color: var(--color-info-500);
	}

	/* Dismiss button */
	.badge__dismiss {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0 calc(var(--space-1) * -0.5) 0 var(--space-1);
		background: none;
		border: none;
		cursor: pointer;
		color: currentColor;
		opacity: 0.7;
		transition: opacity var(--transition-fast, 0.15s);
		flex-shrink: 0;
	}

	.badge__dismiss:hover {
		opacity: 1;
	}

	.badge__dismiss:focus-visible {
		outline: none;
		opacity: 1;
		box-shadow: 0 0 0 2px currentColor;
		border-radius: var(--border-radius-small);
	}

	/* Dismissible badge hover state */
	.badge--dismissible {
		cursor: default;
	}

	/* Hover effects for outlined badges */
	.badge--outlined:hover {
		background-color: var(--color-surface-variant);
	}

	.badge--outlined.badge--primary:hover {
		background-color: var(--color-primary-50);
	}

	.badge--outlined.badge--success:hover {
		background-color: var(--color-success-50);
	}

	.badge--outlined.badge--warning:hover {
		background-color: var(--color-warning-50);
	}

	.badge--outlined.badge--error:hover {
		background-color: var(--color-error-50);
	}

	.badge--outlined.badge--info:hover {
		background-color: var(--color-info-50);
	}

	/* Focus styles for clickable badges */
	.badge:not(.badge--dismissible):focus {
		outline: none;
		box-shadow: 0 0 0 3px var(--color-primary-100);
	}

	/* High contrast mode adjustments */
	@media (prefers-contrast: high) {
		.badge {
			border-width: 2px;
		}

		.badge--outlined {
			border-width: 2px;
		}
	}

	/* Reduce motion for accessibility */
	@media (prefers-reduced-motion: reduce) {
		.badge,
		.badge__dismiss {
			transition: none;
		}
	}
</style>
