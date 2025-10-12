<script lang="ts">
	import { browser } from '$app/environment';

	/**
	 * Portal Component
	 *
	 * Renders its children at the top level of the document body.
	 * This is useful for modals, menus, tooltips, and other UI elements
	 * that need to escape their container's overflow/z-index constraints.
	 */

	/**
	 * Props interface for the Portal component
	 */
	interface Props {
		/** Whether the portal is enabled */
		enabled?: boolean;
		/** Children to render in the portal */
		children?: any;
	}

	const { enabled = true, children }: Props = $props();

	let portalContainer: HTMLDivElement | undefined = $state();
	let placeholder: HTMLDivElement | undefined = $state();

	$effect(() => {
		if (!browser || !enabled || !portalContainer || !placeholder) return;

		// Insert portal container right after the placeholder to maintain DOM order
		document.body.appendChild(portalContainer);

		return () => {
			// Clean up when component unmounts or portal is disabled
			if (portalContainer && portalContainer.parentNode === document.body) {
				document.body.removeChild(portalContainer);
			}
		};
	});
</script>

<!-- Placeholder to mark original position -->
<div bind:this={placeholder} style="display: none;"></div>

{#if enabled}
	<!-- Portal content that will be moved to body -->
	<div bind:this={portalContainer} class="svelte-portal" data-portal="true">
		{@render children?.()}
	</div>
{:else}
	<!-- Render inline when portal is disabled -->
	{@render children?.()}
{/if}

<style>
	.svelte-portal {
		/* Portal container itself has no styling - children control everything */
		position: static;
		pointer-events: none;
	}

	.svelte-portal :global(> *) {
		pointer-events: auto;
	}
</style>
