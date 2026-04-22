<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLDivAttributes } from 'svelte/elements';

	/**
	 * Card Header Component
	 *
	 * Header section for a Card component with title, subtitle, and optional actions.
	 * Can use default slot to completely override the title/subtitle layout.
	 */

	type CardHeaderProps = {
		/**
		 * Header title text
		 */
		title?: string;

		/**
		 * Optional subtitle text
		 */
		subtitle?: string;

		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * Actions slot for buttons/icons in the header
		 */
		actions?: Snippet;

		/**
		 * Default slot (overrides title/subtitle if used)
		 */
		children?: Snippet;
	} & Omit<HTMLDivAttributes, 'class'>;

	const {
		title,
		subtitle,
		class: className = '',
		actions,
		children,
		...restProps
	}: CardHeaderProps = $props();

	const headerClasses = $derived(['card__header', className].filter(Boolean).join(' '));
</script>

<div class={headerClasses} {...restProps}>
	{#if children}
		<!-- Custom content via default slot -->
		{#if typeof children === 'function'}
			{@render children()}
		{:else}
			{children}
		{/if}
	{:else}
		<!-- Default title/subtitle layout -->
		<div class="card__header-content">
			{#if title}
				<h3 class="card__title">{title}</h3>
			{/if}
			{#if subtitle}
				<p class="card__subtitle">{subtitle}</p>
			{/if}
		</div>
	{/if}

	{#if actions}
		<div class="card__header-actions">
			{#if typeof actions === 'function'}
				{@render actions()}
			{:else}
				{actions}
			{/if}
		</div>
	{/if}
</div>
