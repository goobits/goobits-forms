<script lang="ts">
	import type svelte from 'svelte';

	/**
	 * Card Body Component
	 *
	 * Main content area of a Card component.
	 */

	type CardBodyPadding = 'none' | 'sm' | 'md' | 'lg';

	type CardBodyProps = {
		/**
		 * Padding inside the card body
		 * @default 'md'
		 */
		padding?: CardBodyPadding;

		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * Default slot for body content
		 */
		children?: any;
	} & Omit<svelte.JSX.HTMLDivAttributes, 'class'>;

	const {
		padding = 'md',
		class: className = '',
		children,
		...restProps
	}: CardBodyProps = $props();

	const bodyClasses = $derived(
		['card__body', padding !== 'none' && `card__body--padding-${padding}`, className]
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class={bodyClasses} {...restProps}>
	{#if typeof children === 'function'}
		{@render children()}
	{:else if children}
		{children}
	{/if}
</div>
