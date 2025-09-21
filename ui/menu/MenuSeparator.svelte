<script lang="ts">
	/**
	 * MenuSeparator Component
	 *
	 * Simple divider component for menu sections.
	 * Uses design tokens for consistent styling.
	 */

	/**
	 * Props interface for the MenuSeparator component
	 */
	interface Props {
		/** Additional CSS class names */
		className?: string
	}

	const { className = '' }: Props = $props();
</script>

<div 
	class="menu__separator {className}"
	role="separator"
	aria-orientation="horizontal"
></div>

<style>
	.menu__separator {
		height: 1px;
		background-color: var(--color-border);
		margin: var(--space-1) var(--space-2);
	}

	/* Reduce margin in compact menus */
	:global(.menu--compact) .menu__separator {
		margin: var(--space-1) var(--space-2);
	}
</style>