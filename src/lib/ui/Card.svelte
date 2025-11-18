<script lang="ts">
	import type svelte from 'svelte';
	import './Card.css';

	/**
	 * Card Component
	 *
	 * A versatile container component with multiple variants and states.
	 * Can be used as a static container or interactive element (clickable or link).
	 */

	type CardVariant = 'elevated' | 'outlined' | 'filled';
	type CardPadding = 'none' | 'sm' | 'md' | 'lg';

	type CardProps = {
		/**
		 * Visual variant of the card
		 * @default 'elevated'
		 */
		variant?: CardVariant;

		/**
		 * Padding inside the card
		 * @default 'md'
		 */
		padding?: CardPadding;

		/**
		 * Makes the card interactive with hover effects and pointer cursor
		 * @default false
		 */
		clickable?: boolean;

		/**
		 * If provided, card becomes a link wrapper
		 */
		href?: string;

		/**
		 * Additional CSS class names
		 */
		class?: string;

		/**
		 * Default slot for card content
		 */
		children?: import('svelte').Snippet;
	} & (
		| ({ href?: never } & Omit<svelte.JSX.HTMLDivAttributes, 'class'>)
		| ({ href: string } & Omit<svelte.JSX.HTMLAnchorAttributes, 'class' | 'href'>)
	);

	const {
		variant = 'elevated',
		padding = 'md',
		clickable = false,
		href,
		class: className = '',
		children,
		...restProps
	}: CardProps = $props();

	// Combine CSS classes using BEM methodology
	const cardClasses = $derived(
		[
			'card',
			`card--${variant}`,
			padding !== 'none' && `card--padding-${padding}`,
			(clickable || href) && 'card--clickable',
			className
		]
			.filter(Boolean)
			.join(' ')
	);
</script>

{#if href}
	<!-- Card as link -->
	<a {href} class={cardClasses} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<!-- Card as div -->
	<div class={cardClasses} {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</div>
{/if}
