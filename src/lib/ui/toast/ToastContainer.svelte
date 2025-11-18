<script lang="ts">
	import { toastStore, type ToastPosition } from './toast-service';
	import Toast from './Toast.svelte';
	import Portal from '../Portal.svelte';

	/**
	 * ToastContainer Component
	 *
	 * Manages rendering and positioning of multiple toast notifications.
	 * Uses Portal for DOM positioning outside component hierarchy.
	 */

	interface ToastContainerProps {
		/** Default position for toasts */
		position?: ToastPosition;
		/** Maximum number of visible toasts */
		maxToasts?: number;
		/** Test ID */
		'data-testid'?: string;
	}

	const {
		position = 'top-right',
		maxToasts = 5,
		'data-testid': dataTestId
	}: ToastContainerProps = $props();

	/**
	 * Filter toasts by position and limit to maxToasts
	 */
	const visibleToasts = $derived.by(() => {
		const toasts = $toastStore;

		// Group toasts by position
		const positionGroups = toasts.reduce(
			(acc, toast) => {
				const pos = toast.position || position;
				if (!acc[pos]) acc[pos] = [];
				acc[pos].push(toast);
				return acc;
			},
			{} as Record<ToastPosition, typeof toasts>
		);

		// Limit each position group to maxToasts (newest first)
		Object.keys(positionGroups).forEach((pos) => {
			const group = positionGroups[pos as ToastPosition];
			if (group.length > maxToasts) {
				positionGroups[pos as ToastPosition] = group.slice(-maxToasts);
			}
		});

		return positionGroups;
	});

	/**
	 * Handle toast dismiss
	 */
	function handleDismiss(event: CustomEvent<{ id: string }>) {
		toastStore.remove(event.detail.id);
	}

	/**
	 * Get container class for position
	 */
	function getContainerClass(pos: ToastPosition): string {
		return ['toast-container', `toast-container--${pos}`].join(' ');
	}
</script>

<Portal enabled={true}>
	{#each Object.entries(visibleToasts) as [pos, toasts]}
		{#if toasts.length > 0}
			<div
				class={getContainerClass(pos as ToastPosition)}
				data-testid={dataTestId || `toast-container-${pos}`}
				aria-live="polite"
				aria-atomic="false"
			>
				{#each toasts as toast (toast.id)}
					<Toast
						id={toast.id}
						variant={toast.variant}
						title={toast.title}
						message={toast.message}
						duration={toast.duration}
						dismissible={toast.dismissible}
						action={toast.action}
						icon={toast.icon}
						position={toast.position}
						ondismiss={handleDismiss}
					/>
				{/each}
			</div>
		{/if}
	{/each}
</Portal>

<style>
	@import './toast.css';
</style>
