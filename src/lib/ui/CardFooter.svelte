<script lang="ts">
	import type svelte from 'svelte';

	/**
	 * Card Footer Component
	 *
	 * Footer section for a Card component, typically used for action buttons.
	 */

	type CardFooterAlign = 'left' | 'center' | 'right';

	type CardFooterProps = {
		/**
		 * Horizontal alignment of footer content
		 * @default 'left'
		 */
		align?: CardFooterAlign;

		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * Default slot for footer content (typically buttons)
		 */
		children?: import('svelte').Snippet;
	} & Omit<svelte.JSX.HTMLDivAttributes, 'class'>;

	const { align = 'left', class: className = '', children, ...restProps }: CardFooterProps = $props();

	const footerClasses = $derived(
		['card__footer', `card__footer--align-${align}`, className].filter(Boolean).join(' ')
	);
</script>

<div class={footerClasses} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
