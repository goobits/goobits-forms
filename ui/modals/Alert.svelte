<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { AlertTriangle, Info, CheckCircle } from '@lucide/svelte';
	import Modal from './Modal.svelte';

	interface Props {
		isVisible?: boolean;
		title?: string;
		message?: string;
		variant?: 'primary' | 'danger' | 'warning' | 'success';
		button?: import('svelte').Snippet<[{ handleClose: () => void; config: any }]>;
	}

	const {
		isVisible = false,
		title = 'Alert',
		message = '',
		variant = 'primary',
		button
	}: Props = $props();

	const dispatch = createEventDispatcher<{
		close: void;
	}>();

	function handleClose() {
		dispatch('close');
	}

	// Icon and color based on variant
	const variantConfig = {
		primary: {
			icon: Info,
			iconClass: 'alert-modal__icon--primary',
			buttonVariant: 'primary' as const
		},
		danger: {
			icon: AlertTriangle,
			iconClass: 'alert-modal__icon--danger',
			buttonVariant: 'danger' as const
		},
		warning: {
			icon: AlertTriangle,
			iconClass: 'alert-modal__icon--warning',
			buttonVariant: 'warning' as const
		},
		success: {
			icon: CheckCircle,
			iconClass: 'alert-modal__icon--success',
			buttonVariant: 'primary' as const
		}
	};

	const config = variantConfig[variant];
	const IconComponent = config.icon;
</script>

<Modal {isVisible} onClose={handleClose} {title} size="sm" showCloseButton={false}>
	<!-- Content -->
	<div class="alert-modal__content">
		<div class="alert-modal__header">
			<div class="alert-modal__icon {config.iconClass}">
				<IconComponent class="alert-modal__icon-svg" />
			</div>
			<p class="alert-modal__message">
				{message}
			</p>
		</div>

		<!-- Actions -->
		<div class="alert-modal__actions">
			{#if button}
				{@render button({ handleClose, config })}
			{:else}
				<button
					class="alert-modal__button alert-modal__button--{config.buttonVariant}"
					onclick={handleClose}
					type="button"
				>
					OK
				</button>
			{/if}
		</div>
	</div>
</Modal>

<style>
	/**
   * Alert Modal Styles - Now using base Modal component
   * Consistent with design tokens and app theme
   */

	.alert-modal__content {
		padding: var(--space-6);
		display: flex;
		flex-direction: column;
		gap: var(--space-6);
	}

	.alert-modal__header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-4);
	}

	.alert-modal__icon {
		flex-shrink: 0;
		padding: var(--space-3);
		border-radius: var(--radius-full);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.alert-modal__icon-svg {
		width: var(--space-5);
		height: var(--space-5);
	}

	.alert-modal__message {
		color: var(--color-text-secondary);
		font-size: var(--font-size-base);
		line-height: var(--line-height-relaxed);
		margin: 0;
	}

	.alert-modal__actions {
		display: flex;
		justify-content: flex-end;
		padding-top: var(--space-4);
		border-top: 1px solid var(--color-border);
	}

	.alert-modal__button {
		min-width: var(--space-20); /* 80px - button min-width */
		padding: var(--space-3) var(--space-4);
		border-radius: var(--radius-md);
		font-weight: var(--font-weight-medium);
		cursor: pointer;
		border: 1px solid transparent;
		transition: all var(--duration-200) ease;
	}

	.alert-modal__button--primary {
		background: var(--color-primary-500);
		color: white;
	}

	.alert-modal__button--primary:hover {
		background: var(--color-primary-600);
	}

	.alert-modal__button--danger {
		background: var(--color-danger-500);
		color: white;
	}

	.alert-modal__button--danger:hover {
		background: var(--color-danger-600);
	}

	.alert-modal__button--warning {
		background: var(--color-warning-500);
		color: white;
	}

	.alert-modal__button--warning:hover {
		background: var(--color-warning-600);
	}

	.alert-modal__button--success {
		background: var(--color-success-500);
		color: white;
	}

	.alert-modal__button--success:hover {
		background: var(--color-success-600);
	}

	/* Variant-specific icon styling */
	.alert-modal__icon--primary {
		background-color: var(--color-primary-100);
	}

	.alert-modal__icon--primary .alert-modal__icon-svg {
		color: var(--color-primary-600);
	}

	.alert-modal__icon--danger {
		background-color: var(--color-error-100);
	}

	.alert-modal__icon--danger .alert-modal__icon-svg {
		color: var(--color-error-600);
	}

	.alert-modal__icon--warning {
		background-color: var(--warning-bg);
	}

	.alert-modal__icon--warning .alert-modal__icon-svg {
		color: var(--color-warning-800);
	}

	.alert-modal__icon--success {
		background-color: var(--color-success-100);
	}

	.alert-modal__icon--success .alert-modal__icon-svg {
		color: var(--color-success-600);
	}

	/* Dark theme overrides */
	:global(.theme-dark) .alert-modal__icon--primary,
	:global(.theme-system-dark) .alert-modal__icon--primary {
		background-color: rgba(var(--color-primary-900-rgb), 0.2);
	}

	:global(.theme-dark) .alert-modal__icon--primary .alert-modal__icon-svg,
	:global(.theme-system-dark) .alert-modal__icon--primary .alert-modal__icon-svg {
		color: var(--color-primary-400);
	}

	:global(.theme-dark) .alert-modal__icon--danger,
	:global(.theme-system-dark) .alert-modal__icon--danger {
		background-color: rgba(var(--color-error-900-rgb), 0.2);
	}

	:global(.theme-dark) .alert-modal__icon--danger .alert-modal__icon-svg,
	:global(.theme-system-dark) .alert-modal__icon--danger .alert-modal__icon-svg {
		color: var(--color-error-400);
	}

	:global(.theme-dark) .alert-modal__icon--warning,
	:global(.theme-system-dark) .alert-modal__icon--warning {
		background-color: rgba(var(--color-warning-900-rgb), 0.2);
	}

	:global(.theme-dark) .alert-modal__icon--warning .alert-modal__icon-svg,
	:global(.theme-system-dark) .alert-modal__icon--warning .alert-modal__icon-svg {
		color: var(--color-warning-400);
	}

	:global(.theme-dark) .alert-modal__icon--success,
	:global(.theme-system-dark) .alert-modal__icon--success {
		background-color: rgba(var(--color-success-900-rgb), 0.2);
	}

	:global(.theme-dark) .alert-modal__icon--success .alert-modal__icon-svg,
	:global(.theme-system-dark) .alert-modal__icon--success .alert-modal__icon-svg {
		color: var(--color-success-400);
	}

	/* Responsive adjustments */
	@media (max-width: var(--breakpoint-xs)) {
		.alert-modal__content {
			padding: var(--space-4);
			gap: var(--space-4);
		}

		.alert-modal__actions {
			padding-top: var(--space-3);
		}
	}
</style>
