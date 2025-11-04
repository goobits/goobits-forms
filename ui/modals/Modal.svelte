<script lang="ts">
	import { onDestroy } from 'svelte';

	/**
	 * Size variants for the modal
	 */
	type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

	/**
	 * Style variants for the modal
	 */
	type ModalVariant = 'default' | 'form';

	interface ModalProps {
		/** Whether the modal is visible */
		isVisible: boolean;

		/** Callback when the modal should be closed */
		onClose: () => void;

		/** Title displayed in the modal header */
		title?: string;

		/** Size of the modal */
		size?: ModalSize;

		/** Style variant of the modal */
		variant?: ModalVariant;

		/** Whether to show the close button in header */
		showCloseButton?: boolean;

		/** Custom callback for backdrop clicks (overrides default onClose) */
		onBackdropClick?: () => void;

		/** Whether clicking backdrop should close modal */
		closeOnEscape?: boolean;

		/** Whether to disable animations */
		disableAnimation?: boolean;

		/** Additional CSS class name */
		class?: string;

		/** Additional CSS class name for modal content */
		contentClass?: string;

		/** Whether the modal is in a closing state */
		isClosing?: boolean;

		/** Test ID for testing */
		'data-testid'?: string;

		/** Enable smooth height transitions */
		smoothTransitions?: boolean;

		/** Modal content (render prop pattern) */
		children?: import('svelte').Snippet;

		/** Close button slot */
		closeButton?: import('svelte').Snippet;

		/** Footer content that sits outside scrollable area */
		footer?: import('svelte').Snippet;
	}

	const {
		isVisible,
		onClose,
		title,
		size = 'md',
		variant = 'default',
		showCloseButton = true,
		onBackdropClick,
		closeOnEscape = true,
		disableAnimation = false,
		class: className = '',
		contentClass = '',
		isClosing = false,
		'data-testid': dataTestId,
		smoothTransitions = true,
		children,
		closeButton,
		footer
	}: ModalProps = $props();

	let mouseDownTarget: EventTarget | null = null;
	let modalRef = $state<HTMLDivElement | null>(null);
	let contentRef = $state<HTMLDivElement | null>(null);
	let isTransitioning = $state(false);
	let contentHeight = $state<number | null>(null);
	let internalIsClosing = $state(false);
	let fadeTimeout = $state<number | null>(null);

	// Handle modal close with fade-out animation
	function handleClose() {
		if (internalIsClosing) return; // Prevent multiple close calls

		internalIsClosing = true;

		// Fade out over 200ms then actually close
		fadeTimeout = window.setTimeout(() => {
			internalIsClosing = false;
			// Safety check: ensure onClose is still a function before calling
			if (typeof onClose === 'function') {
				onClose(); // Call the parent's close handler after animation
			}
		}, 200);
	}

	// Handle escape key
	function handleEscapeKey(event: KeyboardEvent) {
		if (event.key === 'Escape' && closeOnEscape && isVisible) {
			handleClose();
		}
	}

	// Set up escape key listener
	$effect(() => {
		if (isVisible) {
			document.addEventListener('keydown', handleEscapeKey);
			return () => document.removeEventListener('keydown', handleEscapeKey);
		} else {
			// Clear fade timeout when modal becomes invisible
			internalIsClosing = false;
			if (fadeTimeout) {
				clearTimeout(fadeTimeout);
				fadeTimeout = null;
			}
		}
	});

	// Focus management - focus the modal when it opens
	$effect(() => {
		if (isVisible && modalRef) {
			modalRef.focus();
		}
	});

	// Prevent body scroll when modal is open
	$effect(() => {
		if (isVisible) {
			const originalStyle = window.getComputedStyle(document.body).overflow;
			document.body.style.overflow = 'hidden';
			return () => {
				document.body.style.overflow = originalStyle;
			};
		}
	});

	// Smooth height transitions
	$effect(() => {
		if (smoothTransitions && contentRef && isVisible) {
			// Use ResizeObserver to detect content height changes
			const resizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const newHeight = entry.contentRect.height;

					if (contentHeight !== null && Math.abs(newHeight - contentHeight) > 1) {
						// Height changed significantly, trigger transition
						isTransitioning = true;

						// Reset transition flag after animation completes
						setTimeout(() => {
							isTransitioning = false;
						}, 300); // Match CSS transition duration (--duration-300)
					}

					contentHeight = newHeight;
				}
			});

			resizeObserver.observe(contentRef);

			return () => {
				resizeObserver.disconnect();
			};
		}
	});

	// Handle backdrop click with sophisticated mouse down/up detection
	function handleBackdropMouseDown(e: MouseEvent) {
		mouseDownTarget = e.target;
	}

	function handleBackdropMouseUp(e: MouseEvent) {
		if (e.target === e.currentTarget && mouseDownTarget === e.currentTarget) {
			if (onBackdropClick) {
				onBackdropClick();
			} else {
				handleClose();
			}
		}
		mouseDownTarget = null;
	}

	// Properly typed click handler for preventing event propagation
	function handleContentClick(e: MouseEvent) {
		e.stopPropagation();
	}

	const modalClasses = $derived(
		[
			'modal-dialog',
			`modal-dialog--variant-${variant}`,
			size === 'fullscreen' && 'modal-dialog--fullscreen',
			(isClosing || internalIsClosing) && !disableAnimation && 'modal-dialog--closing',
			isTransitioning && 'modal-dialog--transitioning',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	const contentClasses = $derived(
		[
			'modal-dialog__content',
			`modal-dialog__content--variant-${variant}`,
			`modal-dialog__content--size-${size}`,
			(isClosing || internalIsClosing) && !disableAnimation && 'modal-dialog__content--closing',
			isTransitioning && 'modal-dialog__content--transitioning',
			smoothTransitions && 'modal-dialog__content--smooth',
			contentClass
		]
			.filter(Boolean)
			.join(' ')
	);

	// Cleanup on component destruction
	onDestroy(() => {
		if (fadeTimeout) {
			clearTimeout(fadeTimeout);
			fadeTimeout = null;
		}
	});
</script>

<!-- Keep in DOM during fade-out animation -->
{#if isVisible || internalIsClosing}
	<div
		class={modalClasses}
		onmousedown={handleBackdropMouseDown}
		onmouseup={handleBackdropMouseUp}
		onkeydown={handleEscapeKey}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		data-testid={dataTestId}
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={modalRef}
			class={contentClasses}
			onclick={handleContentClick}
			onkeydown={(e) => e.stopPropagation()}
			role="document"
		>
			<div bind:this={contentRef} class="modal-dialog__inner">
				{#if title || showCloseButton}
					<div class="modal-dialog__header">
						<div class="modal-dialog__header-content">
							{#if title}
								<h2 id="modal-title" class="modal-dialog__title">
									{title}
								</h2>
							{/if}
							{#if showCloseButton}
								{#if closeButton}
									{@render closeButton()}
								{:else}
									<button
										class="modal-dialog__close-button close-button"
										onclick={handleClose}
										aria-label="Close modal"
										type="button"
									>
										<svg
											width="20"
											height="20"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M6 18L18 6M6 6l12 12"
											/>
										</svg>
									</button>
								{/if}
							{/if}
						</div>
					</div>
				{/if}

				<div class="modal-dialog__content-area">
					{@render children?.()}
				</div>

				{#if footer}
					{@render footer()}
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	/**
   * Modal Component Styles
   *
   * Extracted and adapted from PromptForm's superior modal design.
   * Uses design tokens for consistency and includes responsive behavior.
   */

	/* ========================================
   * MODAL BACKDROP & CONTAINER
   * ======================================== */

	.modal-dialog {
		position: fixed;
		inset: 0;
		background-color: var(--color-overlay-dark); /* 50% opacity black */
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: var(--z-modal);
		transition: opacity var(--duration-200) var(--ease-in-out);
	}

	.modal {
		position: fixed;
		inset: 0;
		background-color: var(--color-overlay-dark); /* 50% opacity black */
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-4);
		z-index: var(--z-modal);
		transition: opacity var(--duration-200) var(--ease-in-out);
	}

	.modal-dialog--fullscreen {
		padding: 0; /* Reset for fullscreen */
		background-color: var(--color-background-secondary);
		z-index: var(--z-modal);
	}

	.modal-dialog--closing {
		opacity: 0;
	}

	.modal.fullscreen {
		padding: 0; /* Reset for fullscreen */
		background-color: var(--color-background-secondary);
		z-index: var(--z-modal);
	}

	/* Ensure fullscreen modal content fills viewport */
	.modal.fullscreen .modal-content {
		max-height: 100vh; /* Full viewport - intentional */
		height: 100vh; /* Full viewport - intentional */
		max-width: 100%;
		width: 100%;
	}

	.modal.closing {
		opacity: 0;
	}

	/* ========================================
   * MODAL CONTENT CONTAINER
   * ======================================== */

	.modal-dialog__content {
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-2xl);
		width: 100%;
		max-height: 90vh; /* Viewport-relative - intentional */
		overflow: hidden;
		border: 1px solid var(--color-border);
		animation: slideIn var(--duration-300) ease;
		display: flex;
		flex-direction: column;
	}

	/* Smooth height transitions */
	.modal-dialog__content--smooth {
		transition:
			opacity var(--duration-200) var(--ease-in-out),
			height var(--duration-300) var(--ease-in-out);
	}

	/* Inner wrapper for measuring content */
	.modal-dialog__inner {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		position: relative;
	}

	/* During transition, prevent scrollbar flicker */
	.modal-dialog__content--transitioning {
		overflow: hidden !important;
	}

	.modal-dialog__content--transitioning .modal-dialog__content-area {
		overflow: hidden !important;
	}

	/* Smooth backdrop during transitions */
	.modal-dialog--transitioning {
		transition: background-color var(--duration-300) var(--ease-in-out);
	}

	.modal-dialog__content--closing {
		transform: scale(0.95) translateY(20px);
		opacity: 0;
		transition:
			transform var(--duration-200) var(--ease-in-out),
			opacity var(--duration-200) var(--ease-in-out);
	}

	/* Animations */
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-content {
		background-color: var(--color-surface);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-2xl);
		width: 100%;
		max-height: 90vh; /* Viewport-relative - intentional */
		overflow: hidden;
		border: 1px solid var(--color-border);
		transition: all var(--duration-200) var(--ease-in-out);
		display: flex;
		flex-direction: column;
	}

	.modal-content.closing {
		transform: scale(0.95);
		opacity: 0;
	}

	/* ========================================
   * SIZE VARIANTS
   * ======================================== */

	.modal-dialog__content--size-sm {
		max-width: 32rem; /* 512px - modal-specific width */
	}

	.modal-dialog__content--size-md {
		max-width: 48rem; /* 768px - modal-specific width */
	}

	.modal-dialog__content--size-lg {
		max-width: 56rem; /* 896px - modal-specific width */
	}

	.modal-dialog__content--size-xl {
		max-width: 64rem; /* 1024px - modal-specific width */
	}

	.modal-dialog__content--size-fullscreen {
		max-width: 100%;
		max-height: 100vh; /* Full viewport - intentional */
		height: 100vh; /* Full viewport - intentional */
		border-radius: 0;
	}

	.modal-content.size-sm {
		max-width: 32rem; /* 512px - modal-specific width */
	}

	.modal-content.size-md {
		max-width: 48rem; /* 768px - modal-specific width */
	}

	.modal-content.size-lg {
		max-width: 56rem; /* 896px - modal-specific width */
	}

	.modal-content.size-xl {
		max-width: 64rem; /* 1024px - modal-specific width */
	}

	.modal-content.size-fullscreen {
		max-width: 100%;
		max-height: 100vh; /* Full viewport - intentional */
		height: 100vh; /* Full viewport - intentional */
		border-radius: 0;
	}

	.modal-content.size-fullscreen .header {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}

	/* ========================================
   * HEADER SECTION
   * ======================================== */

	.modal-dialog__header {
		background-color: var(--color-surface-elevated);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-4);
		flex-shrink: 0;
	}

	.modal-dialog__header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-dialog__title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		margin: 0; /* Reset heading default */
	}

	.modal-dialog__content-area {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding: var(--space-6);
		-webkit-overflow-scrolling: touch;
		overscroll-behavior: contain;
	}

	.header {
		background-color: var(--color-surface-elevated);
		border-top-left-radius: var(--radius-lg);
		border-top-right-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-4);
		flex-shrink: 0;
	}

	.header-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--color-text-primary);
		margin: 0; /* Reset heading default */
	}

	.modal-dialog__close-button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		transition: all var(--duration-200) var(--ease-in-out);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.modal-dialog__close-button:hover {
		background: var(--color-background-tertiary);
		color: var(--color-text-primary);
	}

	/* Additional class for compatibility */
	.close-button {
		background: none;
		border: none;
		cursor: pointer;
		color: var(--color-text-secondary);
		padding: var(--space-2);
		border-radius: var(--radius-md);
		transition: all var(--duration-200) var(--ease-in-out);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
	}

	.close-button svg {
		width: 20px;
		height: 20px;
	}

	.close-button:hover {
		background: var(--color-background-tertiary);
		color: var(--color-text-primary);
	}

	/* ========================================
   * CONTENT AREA
   * ======================================== */

	.content {
		flex: 1;
		overflow: auto;
		padding: var(--space-6);
	}

	/* ========================================
   * RESPONSIVE BEHAVIOR
   * ======================================== */

	/* Responsive animation speeds */
	@media (prefers-reduced-motion: reduce) {
		.modal-dialog__content--smooth {
			transition: none !important;
		}

		.modal-dialog--transitioning,
		.modal-dialog__content--transitioning {
			transition: none !important;
		}
	}

	@media (max-width: 768px) {
		/* Faster animations on mobile for better perceived performance */
		.modal-dialog__content--smooth {
			transition:
				opacity var(--duration-150) var(--ease-in-out),
				height var(--duration-300) var(--ease-in-out);
		}
	}

	@media (max-width: 768px) {
		.modal-dialog {
			padding: var(--space-2);
		}

		.modal-dialog__content {
			max-height: 95vh;
		}

		.modal-dialog__content--size-sm,
		.modal-dialog__content--size-md,
		.modal-dialog__content--size-lg,
		.modal-dialog__content--size-xl {
			max-width: 100%;
		}

		.modal-dialog__content--size-fullscreen {
			max-height: 100vh; /* Full viewport - intentional */
			height: 100vh; /* Full viewport - intentional */
		}

		.modal-dialog__header {
			padding: var(--space-3);
		}

		.modal-dialog__content-area {
			padding: var(--space-4);
		}

		.modal-dialog__title {
			font-size: var(--font-size-lg);
		}
	}

	@media (max-width: 480px) {
		.modal-dialog {
			padding: var(--space-1);
		}

		.modal-dialog__content {
			max-height: 98vh;
			border-radius: var(--radius-md);
		}

		.modal-dialog__header {
			padding: var(--space-3);
			border-top-left-radius: var(--radius-md);
			border-top-right-radius: var(--radius-md);
		}

		.modal-dialog__content-area {
			padding: var(--space-3);
		}
	}

	/* ========================================
   * FORM VARIANT STYLES
   * ======================================== */

	/* Form variant modal backdrop - matches PromptForm */
	.modal-dialog--variant-form {
		background-color: var(--color-overlay-dark); /* 50% opacity black */
		z-index: var(--z-modal);
	}

	/* Form variant content - dual-tone background like PromptForm */
	.modal-dialog__content--variant-form {
		background-color: var(--color-background-secondary);
		display: flex;
		flex-direction: column;
	}

	/* Enhanced header for form variant */
	.modal-dialog__content--variant-form .modal-dialog__header {
		background-color: var(--color-surface-elevated);
		box-shadow: var(--shadow-sm);
		border-bottom: 1px solid var(--color-border);
		padding: var(--space-4) var(--space-6);
	}

	/* Form variant content area */
	.modal-dialog__content--variant-form .modal-dialog__content-area {
		flex: 1;
		padding: 0; /* Reset for fullscreen */
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Fullscreen form variant specific */
	.modal-dialog__content--variant-form.modal-dialog__content--size-fullscreen {
		max-height: 100vh; /* Full viewport - intentional */
		height: 100vh; /* Full viewport - intentional */
	}

	/* ========================================
   * ACCESSIBILITY & FOCUS MANAGEMENT
   * ======================================== */

	.modal-dialog__content:focus {
		outline: none;
	}

	/* Enhanced contrast for high contrast mode */
	@media (prefers-contrast: high) {
		.modal-dialog {
			background-color: var(--color-overlay-darker); /* 70% opacity black */
		}

		.modal-dialog__content {
			border: 2px solid var(--color-border-strong);
		}

		.modal-dialog__header {
			border-bottom: 2px solid var(--color-border-strong);
		}
	}

	/* Respect reduced motion preferences */
	@media (prefers-reduced-motion: reduce) {
		.modal-dialog,
		.modal-dialog__content {
			transition: none;
		}

		.modal-dialog__content--closing {
			transform: none;
		}
	}
</style>
