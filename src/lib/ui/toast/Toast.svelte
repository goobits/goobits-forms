<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import type { ToastVariant, ToastAction, ToastPosition } from './toast-service';

	/**
	 * Toast Component
	 *
	 * Individual toast notification with auto-dismiss, progress bar, and actions.
	 */

	interface ToastProps {
		/** Unique identifier */
		id: string;
		/** Visual variant */
		variant?: ToastVariant;
		/** Toast title */
		title: string;
		/** Optional message */
		message?: string;
		/** Auto-dismiss duration in ms (0 = no auto-dismiss) */
		duration?: number;
		/** Whether toast can be manually dismissed */
		dismissible?: boolean;
		/** Optional action button */
		action?: ToastAction;
		/** Custom icon (overrides variant default) */
		icon?: string;
		/** Position on screen */
		position?: ToastPosition;
		/** Test ID */
		'data-testid'?: string;
	}

	const {
		id,
		variant = 'info',
		title,
		message,
		duration = 5000,
		dismissible = true,
		action,
		icon,
		position = 'top-right',
		'data-testid': dataTestId
	}: ToastProps = $props();

	const dispatch = createEventDispatcher<{ dismiss: { id: string } }>();

	let progressPercent = $state(100);
	let isVisible = $state(true);
	let isExiting = $state(false);
	let timeoutId: number | null = null;
	let intervalId: number | null = null;
	let startTime: number | null = null;
	let remainingTime = $state(duration);

	/**
	 * Handle dismiss
	 */
	function handleDismiss() {
		if (!dismissible) return;

		// Start exit animation
		isExiting = true;

		// Clear timers
		if (timeoutId) clearTimeout(timeoutId);
		if (intervalId) clearInterval(intervalId);

		// Wait for animation then dispatch
		setTimeout(() => {
			dispatch('dismiss', { id });
		}, 300); // Match CSS animation duration
	}

	/**
	 * Handle action button click
	 */
	function handleAction() {
		if (action) {
			action.onClick();
			handleDismiss();
		}
	}

	/**
	 * Handle escape key
	 */
	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape' && dismissible) {
			handleDismiss();
		}
	}

	/**
	 * Start auto-dismiss timer
	 */
	function startTimer() {
		if (duration === 0) return;

		startTime = Date.now();
		remainingTime = duration;

		// Update progress bar
		intervalId = window.setInterval(() => {
			if (!startTime) return;

			const elapsed = Date.now() - startTime;
			const percent = Math.max(0, ((duration - elapsed) / duration) * 100);
			progressPercent = percent;

			if (percent === 0) {
				if (intervalId) clearInterval(intervalId);
			}
		}, 16); // ~60fps

		// Auto-dismiss after duration
		timeoutId = window.setTimeout(() => {
			handleDismiss();
		}, duration);
	}

	/**
	 * Pause timer on hover
	 */
	function pauseTimer() {
		if (duration === 0) return;
		if (timeoutId) clearTimeout(timeoutId);
		if (intervalId) clearInterval(intervalId);

		// Calculate remaining time
		if (startTime) {
			const elapsed = Date.now() - startTime;
			remainingTime = Math.max(0, duration - elapsed);
		}
	}

	/**
	 * Resume timer on mouse leave
	 */
	function resumeTimer() {
		if (duration === 0 || remainingTime === 0) return;

		startTime = Date.now();
		const currentRemaining = remainingTime;

		// Update progress bar
		intervalId = window.setInterval(() => {
			if (!startTime) return;

			const elapsed = Date.now() - startTime;
			const percent = Math.max(0, ((currentRemaining - elapsed) / duration) * 100);
			progressPercent = percent;

			if (percent === 0) {
				if (intervalId) clearInterval(intervalId);
			}
		}, 16);

		// Auto-dismiss after remaining time
		timeoutId = window.setTimeout(() => {
			handleDismiss();
		}, currentRemaining);
	}

	/**
	 * Determine ARIA role based on variant
	 */
	const ariaRole = $derived(variant === 'error' || variant === 'warning' ? 'alert' : 'status');

	/**
	 * Determine ARIA live based on variant
	 */
	const ariaLive = $derived(variant === 'error' || variant === 'warning' ? 'assertive' : 'polite');

	/**
	 * CSS classes
	 */
	const toastClasses = $derived(
		[
			'toast',
			`toast--${variant}`,
			`toast--${position}`,
			isExiting && 'toast--exiting',
			!dismissible && 'toast--not-dismissible'
		]
			.filter(Boolean)
			.join(' ')
	);

	// Start timer on mount
	onMount(() => {
		startTimer();
	});

	// Cleanup on unmount
	onDestroy(() => {
		if (timeoutId) clearTimeout(timeoutId);
		if (intervalId) clearInterval(intervalId);
	});
</script>

{#if isVisible}
	<div
		class={toastClasses}
		{...{ role: ariaRole }}
		{...{ 'aria-live': ariaLive }}
		aria-atomic="true"
		data-testid={dataTestId || `toast-${id}`}
		onmouseenter={pauseTimer}
		onmouseleave={resumeTimer}
		onkeydown={handleKeyDown}
	>
		{#if icon}
			<div class="toast__icon" aria-hidden="true">
				{icon}
			</div>
		{/if}

		<div class="toast__content">
			<div class="toast__title">{title}</div>
			{#if message}
				<div class="toast__message">{message}</div>
			{/if}
		</div>

		{#if action}
			<button
				type="button"
				class="toast__action"
				onclick={handleAction}
				aria-label={action.label}
			>
				{action.label}
			</button>
		{/if}

		{#if dismissible}
			<button
				type="button"
				class="toast__close"
				onclick={handleDismiss}
				aria-label="Dismiss notification"
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 16 16"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
				>
					<path d="M4 4L12 12M4 12L12 4" />
				</svg>
			</button>
		{/if}

		{#if duration > 0}
			<div class="toast__progress" aria-hidden="true">
				<div class="toast__progress-bar" style="width: {progressPercent}%"></div>
			</div>
		{/if}
	</div>
{/if}

<style>
	@import './toast.css';
</style>
