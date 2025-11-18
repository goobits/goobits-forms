<script lang="ts">
	import ToastContainer from './ToastContainer.svelte';
	import type { ToastPosition } from './toast-service';
	import type { Snippet } from 'svelte';

	/**
	 * ToastProvider Component
	 *
	 * Provides toast functionality to the entire application.
	 * Wrap your app with this component to enable toast notifications.
	 *
	 * @example
	 * ```svelte
	 * <ToastProvider position="top-right" maxToasts={5}>
	 *   <YourApp />
	 * </ToastProvider>
	 * ```
	 */

	interface ToastProviderProps {
		/** Default position for toasts */
		position?: ToastPosition;
		/** Maximum number of visible toasts */
		maxToasts?: number;
		/** Child content */
		children?: Snippet;
	}

	const { position = 'top-right', maxToasts = 5, children }: ToastProviderProps = $props();
</script>

<!-- Render child content -->
{@render children?.()}

<!-- Render toast container -->
<ToastContainer {position} {maxToasts} />
