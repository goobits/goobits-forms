<!--
  Modal Provider

  Simple container component for modal management.
  Apps can extend this or use their own modal management system.
-->
<script lang="ts">
	interface Props {
		children?: import('svelte').Snippet;
	}

	const { children }: Props = $props();
</script>

<div class="modal-provider">
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.modal-provider {
		/* Modal provider container */
		position: relative;
		z-index: 1000;
	}
</style>
