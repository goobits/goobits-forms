<script lang="ts">
	import type svelte from 'svelte';
	/**
	 * Modal Footer Component
	 *
	 * A sophisticated footer component following the PromptForm pattern.
	 * Provides a consistent footer with optional left content and right actions.
	 */

	type FooterProps = {
		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * Footer variant
		 */
		variant?: 'default' | 'compact' | 'transparent';

		/**
		 * Whether to show the border-top
		 */
		showBorder?: boolean;

		/**
		 * Content to show on the left (status, metadata, etc)
		 */
		leftContent?: import('svelte').Snippet;

		/**
		 * Actions/buttons to show on the right
		 */
		actions?: import('svelte').Snippet;

		/**
		 * Main content (if not using left/right layout)
		 */
		children?: import('svelte').Snippet;
	} & Omit<svelte.JSX.HTMLDivAttributes, 'class'>;

	const {
		class: className = '',
		variant = 'default',
		showBorder = true,
		leftContent,
		actions,
		children,
		...restProps
	}: FooterProps = $props();

	const footerClasses = $derived(
		['modal-footer', `modal-footer--${variant}`, showBorder && 'modal-footer--bordered', className]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={footerClasses} {...restProps}>
	{#if children}
		<!-- Single content mode -->
		{@render children()}
	{:else}
		<!-- Left/Right layout mode -->
		{#if leftContent}
			<div class="modal-footer__left">
				{@render leftContent()}
			</div>
		{/if}

		{#if actions}
			<div class="modal-footer__actions">
				{@render actions()}
			</div>
		{/if}
	{/if}
</div>

<style>
	/**
   * Modal Footer Styles
   * Based on PromptForm's sophisticated footer design
   */

	.modal-footer {
		padding: var(--space-6);
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-4);
		background: var(--color-white, var(--color-surface, #ffffff));
		flex-shrink: 0;
		min-height: 72px;
	}

	/* Border variant */
	.modal-footer--bordered {
		border-top: 1px solid var(--color-border);
	}

	/* Backdrop blur for elevated feel */
	.modal-footer--default {
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
	}

	/* Compact variant for smaller modals */
	.modal-footer--compact {
		padding: var(--space-4);
		min-height: 56px;
	}

	/* Transparent variant */
	.modal-footer--transparent {
		background: transparent;
		backdrop-filter: none;
	}

	/* Left content area */
	.modal-footer__left {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}

	/* Right actions area */
	.modal-footer__actions {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		flex-shrink: 0;
	}

	/* When footer only has actions (no left content) */
	.modal-footer:not(:has(.modal-footer__left)) .modal-footer__actions {
		margin-left: auto;
	}

	/* Responsive adjustments */
	@media (max-width: 640px) {
		.modal-footer {
			padding: var(--space-4);
			gap: var(--space-3);
		}

		.modal-footer--compact {
			padding: var(--space-3);
		}

		/* Stack on very small screens if needed */
		@media (max-width: 400px) {
			.modal-footer {
				flex-direction: column;
				align-items: stretch;
			}

			.modal-footer__left {
				justify-content: center;
			}

			.modal-footer__actions {
				justify-content: center;
				width: 100%;
			}
		}
	}

	/* Dark theme adjustments */
	:global(.theme-dark) .modal-footer,
	:global(.theme-system-dark) .modal-footer {
		background: rgba(26, 26, 26, 0.98);
	}

	:global(.theme-dark) .modal-footer--bordered,
	:global(.theme-system-dark) .modal-footer--bordered {
		border-top-color: rgba(255, 255, 255, 0.1);
	}
</style>
