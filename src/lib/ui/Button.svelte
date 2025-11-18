<script lang="ts">
	/**
	 * Props interface for the Button component
	 */
	interface Props {
		/** Visual variant of the button */
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
		/** Size of the button */
		size?: 'sm' | 'md' | 'lg';
		/** Whether the button is disabled */
		disabled?: boolean;
		/** Whether the button is in a loading state */
		loading?: boolean;
		/** Button type attribute */
		type?: 'button' | 'submit' | 'reset';
		/** If provided, renders as an anchor element */
		href?: string;
		/** Whether the button should take full width */
		fullWidth?: boolean;
		/** Additional CSS class names */
		class?: string;
		/** Accessible label for the button */
		'aria-label'?: string;
		/** Test ID for automated testing */
		'data-testid'?: string;
	}

	let {
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		type = 'button',
		href,
		fullWidth = false,
		class: className = '',
		'aria-label': ariaLabel,
		'data-testid': dataTestId,
		onclick,
		children,
		...restProps
	}: Props & { children?: any } = $props();

	// Combine CSS classes using BEM methodology
	const buttonClasses = $derived(
		[
			'button',
			`button--${variant}`,
			`button--${size}`,
			fullWidth && 'button--full-width',
			loading && 'button--loading',
			disabled && 'button--disabled',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	// Determine if button should be disabled (disabled prop or loading state)
	const isDisabled = $derived(disabled || loading);

	// Handle click events
	function handleClick(event: MouseEvent) {
		if (isDisabled) {
			event.preventDefault();
			return;
		}
		if (onclick) {
			onclick(event);
		}
	}

	// Handle keyboard events (Enter and Space)
	function handleKeyDown(event: KeyboardEvent) {
		if (isDisabled) {
			event.preventDefault();
			return;
		}
		// For buttons, Enter and Space should trigger the click
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (onclick) {
				// Create a synthetic mouse event
				const syntheticEvent = new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					view: window
				});
				onclick(syntheticEvent);
			}
		}
	}
</script>

{#if href && !disabled && !loading}
	<!-- Render as anchor if href is provided and not disabled/loading -->
	<a
		{href}
		class={buttonClasses}
		role="button"
		aria-label={ariaLabel}
		data-testid={dataTestId}
		onclick={handleClick}
		onkeydown={handleKeyDown}
		{...restProps}
	>
		{#if typeof children === 'function' && children?.['icon-left']}
			<span class="button__icon button__icon--left">
				{@render children['icon-left']()}
			</span>
		{/if}
		<span class="button__content">
			{#if typeof children === 'function'}
				{@render children?.()}
			{:else if children}
				{children}
			{/if}
		</span>
		{#if typeof children === 'function' && children?.['icon-right']}
			<span class="button__icon button__icon--right">
				{@render children['icon-right']()}
			</span>
		{/if}
	</a>
{:else}
	<!-- Render as button element -->
	<button
		{type}
		class={buttonClasses}
		disabled={isDisabled}
		aria-disabled={isDisabled}
		aria-busy={loading}
		aria-label={loading ? 'Loading...' : ariaLabel}
		data-testid={dataTestId}
		onclick={handleClick}
		onkeydown={handleKeyDown}
		{...restProps}
	>
		{#if loading}
			<span class="button__spinner" aria-hidden="true"></span>
		{/if}
		{#if typeof children === 'function' && children?.['icon-left'] && !loading}
			<span class="button__icon button__icon--left">
				{@render children['icon-left']()}
			</span>
		{/if}
		<span class="button__content" class:button__content--hidden={loading}>
			{#if typeof children === 'function'}
				{@render children?.()}
			{:else if children}
				{children}
			{/if}
		</span>
		{#if typeof children === 'function' && children?.['icon-right'] && !loading}
			<span class="button__icon button__icon--right">
				{@render children['icon-right']()}
			</span>
		{/if}
	</button>
{/if}

<style>
	@import './Button.css';
</style>
