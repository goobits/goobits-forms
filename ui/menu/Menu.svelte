<script lang="ts">
	/**
	 * Menu Component
	 *
	 * Main menu container with positioning, click-outside detection,
	 * keyboard navigation, and accessibility features.
	 */

	import { calculateMenuPosition, getMenuPositionStyles, createKeyboardNavigation, getMenuAriaAttributes } from './utils';
	import MenuItem from './MenuItem.svelte';
	import MenuSeparator from './MenuSeparator.svelte';
	import Portal from '../Portal.svelte';
	import type { MenuProps } from './types';

	const {
		id = `menu-${Math.random().toString(36).substr(2, 9)}`,
		items,
		isVisible,
		x,
		y,
		onClose,
		variant = 'default',
		size = 'md',
		className = '',
		maxHeight,
		minWidth = 120,
		showIcons = true,
		showShortcuts = true,
		forceDirection = 'auto',
		showPointer = false,
		pointerDirection = 'auto',
		anchorEl,
		autoFocus = false
	}: MenuProps = $props();

	let menuRef = $state<HTMLDivElement | undefined>();
	let menuStyle = $state<Record<string, string>>({});
	let pointerPosition = $state<{ placement: string; offset: number }>({
		placement: 'bottom-right',
		offset: 0
	});
	let isPositioned = $state(false);

	// Keyboard navigation state
	let keyboardNav = $state<ReturnType<typeof createKeyboardNavigation>>();

	// Z-index from design system - menus should appear above modals
	const MENU_Z_INDEX = 10001; // Higher than modal (10000)

	// Initialize keyboard navigation when menu becomes visible
	$effect(() => {
		if (isVisible && items) {
			keyboardNav = createKeyboardNavigation(
				items,
				onClose,
				(index: number) => {
					const item = items[index];
					if (item && item.type !== 'separator') {
						// Trigger click handler for the focused item
						const itemEl = menuRef?.querySelector(`[data-menu-item-index="${index}"]`) as HTMLButtonElement;
						itemEl?.click();
					}
				},
				autoFocus  // Use the autoFocus prop to determine focus behavior
			);
			isPositioned = true;
		} else if (!isVisible) {
			isPositioned = false;
			keyboardNav = undefined;
		}
	});

	// Calculate smart positioning once the menu is rendered
	$effect(() => {
		if (isVisible && menuRef) {
			// Use requestAnimationFrame to ensure DOM is rendered
			requestAnimationFrame(() => {
				if (!menuRef) return;
				
				const rect = menuRef.getBoundingClientRect();
				const position = calculateMenuPosition(
					x,
					y,
					{
						width: rect.width,
						height: rect.height
					},
					8,
					forceDirection,
					anchorEl
				);
				
				const style = getMenuPositionStyles(position, MENU_Z_INDEX);
				menuStyle = style;

				// Calculate pointer position if needed
				if (showPointer) {
					const pointerOffset = Math.min(Math.max(20, y - position.y), rect.height - 20);
					pointerPosition = { placement: position.placement, offset: pointerOffset };
				}

				isPositioned = true;
			});
		}
	});

	// Close menu when clicking outside
	$effect(() => {
		if (isVisible && isPositioned) {
			const handleClickOutside = (event: MouseEvent) => {
				const target = event.target as Node;
				if (menuRef && !menuRef.contains(target)) {
					// Check if clicked on the anchor element (button that opened this menu)
					if (anchorEl && anchorEl.contains(target)) {
						return; // Don't close if clicking on the button that opens the menu
					}
					onClose();
				}
			};

			// Use requestAnimationFrame to ensure the click that opened the menu doesn't close it
			const rafId = requestAnimationFrame(() => {
				document.addEventListener('mousedown', handleClickOutside, true);
			});

			return () => {
				cancelAnimationFrame(rafId);
				document.removeEventListener('mousedown', handleClickOutside, true);
			};
		}
	});

	// Handle keyboard navigation
	$effect(() => {
		if (isVisible && isPositioned && keyboardNav) {
			const handleKeyDown = (event: KeyboardEvent) => {
				keyboardNav?.handleKeydown(event);
			};

			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	});

	function getMenuClasses(): string {
		const baseClasses = [
			'menu',
			`menu--${variant}`,
			`menu--${size}`,
			className
		].filter(Boolean);

		return baseClasses.join(' ');
	}

	function getPointerClasses(): string {
		if (!showPointer) return '';

		// Use pointerDirection if explicitly set, otherwise fall back to placement logic
		let isLeft: boolean;
		if (pointerDirection === 'left') {
			isLeft = true;
		} else if (pointerDirection === 'right') {
			isLeft = false;
		} else {
			// Auto: use placement-based logic
			isLeft = pointerPosition.placement.includes('left');
		}
		const baseClasses = 'menu__pointer';

		return `${baseClasses} ${isLeft ? 'menu__pointer--left' : 'menu__pointer--right'}`;
	}

	const ariaAttributes = $derived(getMenuAriaAttributes(id, keyboardNav?.focusedIndex ?? -1));
	const menuClasses = $derived(getMenuClasses());
</script>

{#if isVisible}
	<Portal enabled={true}>
		<div
			bind:this={menuRef}
			class={menuClasses}
			style="{Object.entries(menuStyle).map(([key, value]) => `${key}: ${value}`).join('; ')};
			       opacity: {isPositioned ? 1 : 0};
			       transform: scale({isPositioned ? 1 : 0.95});
			       pointer-events: {isPositioned ? 'auto' : 'none'};
			       {maxHeight ? `max-height: ${maxHeight}px;` : ''}
			       {minWidth ? `min-width: ${minWidth}px;` : ''}"
			{...ariaAttributes}
		>
			{#if showPointer}
				<div
					class={getPointerClasses()}
					style="top: {pointerPosition.offset}px;"
				></div>
			{/if}

			<div class="menu__content">
				{#each items as item, index}
					{#if item.type === 'separator'}
						<MenuSeparator />
					{:else if item.type === 'label'}
						<MenuItem
							{item}
							{index}
							menuId={id}
							{size}
							showIcon={showIcons}
							showShortcut={showShortcuts}
							isFocused={false}
							onClose={onClose}
						/>
					{:else}
						<div data-menu-item-index={index}>
							<MenuItem
								{item}
								{index}
								menuId={id}
								{size}
								showIcon={showIcons}
								showShortcut={showShortcuts}
								isFocused={keyboardNav?.focusedIndex === index}
								onClose={onClose}
							/>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</Portal>
{/if}

<style>
	.menu {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		position: fixed;
		transition:
			opacity var(--duration-100) var(--ease-out),
			transform var(--duration-100) var(--ease-out);
		outline: none;
		z-index: 10001; /* Higher than modals (10000) */
	}

	:global(.theme-dark) .menu,
	:global(.theme-system-dark) .menu {
		background: var(--color-background);
		border-color: var(--color-border-strong);
	}

	.menu__content {
		padding: var(--space-1) 0;
		max-height: inherit;
		overflow-y: auto;
		overflow-x: hidden;
	}

	/* Variant styles */
	.menu--default {
		/* Default styling already applied above */
	}

	.menu--compact .menu__content {
		padding: var(--space-1) 0;
	}

	.menu--elevated {
		box-shadow: var(--shadow-xl);
		border: 1px solid var(--color-border-subtle);
	}

	/* Size variants */
	.menu--sm {
		font-size: 0.875rem;
	}

	.menu--md {
		/* Default size */
	}

	.menu--lg {
		font-size: 1.125rem;
	}

	/* Pointer/arrow styles */
	.menu__pointer {
		position: absolute;
		width: 0.75rem;
		height: 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		transform: rotate(45deg);
		z-index: 0;
	}

	.menu__pointer--right {
		right: -0.375rem;
		border-left: none;
		border-top: none;
	}

	.menu__pointer--left {
		left: -0.375rem;
		border-right: none;
		border-bottom: none;
	}

	.menu__content {
		position: relative;
		z-index: 2;
	}


	/* Focus management */
	.menu:focus-visible {
		outline: 2px solid var(--color-primary-500);
		outline-offset: 2px;
	}

	/* Dark theme adjustments */
	:global(.theme-dark) .menu,
	:global(.theme-system-dark) .menu {
		background: var(--color-surface);
		border-color: var(--color-border);
		box-shadow: var(--shadow-lg);
	}

	:global(.theme-dark) .menu__pointer,
	:global(.theme-system-dark) .menu__pointer {
		background: var(--color-surface);
		border-color: var(--color-border);
	}
</style>