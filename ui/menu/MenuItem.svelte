<script lang="ts">
	/**
	 * MenuItem Component
	 *
	 * Flexible menu item component supporting multiple variants:
	 * - action: Standard clickable item
	 * - toggle: Checkbox-style item with checked state
	 * - destructive: Dangerous action with confirmation
	 * - submenu: Item that opens a nested submenu
	 * - custom: Custom component wrapper
	 */

	import { getMenuItemAriaAttributes } from './utils';
	// Confirmation import removed - now optional via prop
	import {
		Type,
		Calendar,
		TrendingUp,
		TrendingDown,
		Edit,
		Copy,
		Heart,
		Download,
		Play,
		Trash,
		Plus,
		Settings,
		Palette,
		Upload,
		LogOut,
		Search,
		Eye,
		Wand,
		FolderPlus,
		Command,
		X,
		Layers,
		Folder,
		SortAsc,
		ArrowUpDown,
		Hash,
		Archive,
		Clock
	} from '@lucide/svelte';
	import type { MenuItem as MenuItemType, MenuItemSize } from './types';

	interface Props {
		item: MenuItemType;
		menuId: string;
		index: number;
		size?: MenuItemSize;
		showIcon?: boolean;
		showShortcut?: boolean;
		isFocused?: boolean;
		isNested?: boolean;
		onClose?: () => void;
		confirmationHandler?: (message: string) => Promise<boolean>;
	}

	const {
		item,
		menuId,
		index,
		size = 'md',
		showIcon = true,
		showShortcut = true,
		isFocused = false,
		isNested = false,
		onClose,
		confirmationHandler
	}: Props = $props();

	// Confirmation now handled via optional prop

	// Determine if this is a special styled action
	const isSpecialAction = $derived(item.type === 'action' && item.label === 'Clear All Filters');

	// Add submenu state management
	let showSubmenu = $state(false);
	let submenuTimeout = $state<number | null>(null);
	let buttonRef = $state<HTMLButtonElement | null>(null);
	let submenuPosition = $state({ x: 0, y: 0 });

	// Flash animation state
	let isFlashing = $state(false);
	let flashTimeout = $state<number | null>(null);

	async function handleClick(event?: MouseEvent) {
		// Stop event propagation to prevent immediate menu closure
		event?.stopPropagation();

		// Clear any existing flash timeout
		if (flashTimeout) {
			clearTimeout(flashTimeout);
			flashTimeout = null;
		}

		if (item.type === 'action' && !item.disabled) {
			// Trigger flash animation
			isFlashing = true;

			// Execute action immediately but delay menu close
			item.onClick();

			// Delay menu close to show animation
			flashTimeout = window.setTimeout(() => {
				isFlashing = false;
				onClose?.();
			}, 300); // Match --menu-close-delay
		} else if (item.type === 'destructive' && !item.disabled) {
			if (item.confirmMessage) {
				const confirmed = confirmationHandler
					? await confirmationHandler(item.confirmMessage)
					: confirm(item.confirmMessage); // Fallback to window.confirm
				if (confirmed) {
					// Trigger flash animation
					isFlashing = true;
					item.onClick();

					// Delay menu close
					flashTimeout = window.setTimeout(() => {
						isFlashing = false;
						onClose?.();
					}, 300);
				}
			} else {
				isFlashing = true;
				item.onClick();

				flashTimeout = window.setTimeout(() => {
					isFlashing = false;
					onClose?.();
				}, 300);
			}
		} else if (item.type === 'toggle' && !item.disabled) {
			// Trigger single flash for toggles
			isFlashing = true;
			item.onChange(!item.checked);

			// Reset flash state after animation
			flashTimeout = window.setTimeout(() => {
				isFlashing = false;
			}, 150); // Shorter for toggles

			// Don't close menu for toggles
		} else if (item.type === 'submenu' && !item.disabled) {
			// Toggle submenu visibility
			if (!showSubmenu) {
				updateSubmenuPosition();
			}
			showSubmenu = !showSubmenu;
		}
	}

	function updateSubmenuPosition() {
		if (buttonRef && item.type === 'submenu') {
			const rect = buttonRef.getBoundingClientRect();
			const submenuWidth = 200; // Approximate submenu width
			const submenuHeight = item.items.length * 36; // Approximate item height
			const padding = 8;

			let x = rect.right + padding;
			let y = rect.top;

			// Check if submenu would overflow right edge
			if (x + submenuWidth > window.innerWidth) {
				x = rect.left - submenuWidth - padding;
			}

			// Check if submenu would overflow bottom edge
			if (y + submenuHeight > window.innerHeight) {
				y = window.innerHeight - submenuHeight - padding;
			}

			// Ensure submenu stays within viewport
			x = Math.max(padding, Math.min(x, window.innerWidth - submenuWidth - padding));
			y = Math.max(padding, y);

			submenuPosition = { x, y };
		}
	}

	function handleMouseEnter() {
		if (item.type === 'submenu') {
			// Clear any pending close timeout
			if (submenuTimeout) {
				clearTimeout(submenuTimeout);
				submenuTimeout = null;
			}
			// Show submenu after a short delay
			submenuTimeout = window.setTimeout(() => {
				updateSubmenuPosition();
				showSubmenu = true;
			}, 150);
		}
	}

	function handleMouseLeave() {
		if (item.type === 'submenu') {
			// Clear any pending open timeout
			if (submenuTimeout) {
				clearTimeout(submenuTimeout);
				submenuTimeout = null;
			}
			// Hide submenu after a short delay
			submenuTimeout = window.setTimeout(() => {
				showSubmenu = false;
			}, 300);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}

	// Map icon names to icon components
	function getIconComponent(iconName: string) {
		const iconMap = {
			type: Type,
			calendar: Calendar,
			'trending-up': TrendingUp,
			'trending-down': TrendingDown,
			edit: Edit,
			copy: Copy,
			heart: Heart,
			download: Download,
			play: Play,
			trash: Trash,
			plus: Plus,
			settings: Settings,
			palette: Palette,
			upload: Upload,
			logout: LogOut,
			search: Search,
			eye: Eye,
			wand: Wand,
			'folder-plus': FolderPlus,
			command: Command,
			x: X,
			layers: Layers,
			folder: Folder,
			sort: SortAsc,
			compare: ArrowUpDown,
			hash: Hash,
			archive: Archive,
			clock: Clock
		};
		return iconMap[iconName as keyof typeof iconMap];
	}

	const ariaAttributes = $derived(getMenuItemAriaAttributes(menuId, index, item, isFocused));
	const isDisabled = $derived('disabled' in item && item.disabled);
	const hasIcon = $derived(showIcon && 'icon' in item && item.icon);
	const hasShortcut = $derived(showShortcut && 'shortcut' in item && item.shortcut);

	// Handle both string icon names and direct component references
	const IconComponent = $derived(() => {
		if (!hasIcon || !('icon' in item)) return null;

		// If icon is already a component constructor, use it directly
		if (typeof item.icon === 'function') {
			return item.icon;
		}

		// If icon is a string, try to map it
		if (typeof item.icon === 'string') {
			return getIconComponent(item.icon);
		}

		return null;
	});

	// Cleanup on destroy
	$effect(() => {
		return () => {
			if (flashTimeout) {
				clearTimeout(flashTimeout);
			}
			if (submenuTimeout) {
				clearTimeout(submenuTimeout);
			}
		};
	});

	// Determine if this is a special item (Save As Command/Agent)
	const isSpecialItem = $derived(
		item.type === 'toggle' &&
			'label' in item &&
			(item.label?.includes('Save As') || item.label?.includes('Agent'))
	);
</script>

{#if item.type === 'separator'}
	<!-- Separators are handled by parent component -->
{:else if item.type === 'label'}
	<div class="menu-item__section-label">
		<span class="menu-item__section-label-text">{item.label}</span>
	</div>
{:else if item.type === 'custom'}
	{@const CustomComponent = item.component}
	<div class="menu-item menu-item--custom menu-item--{size}" {...ariaAttributes}>
		<CustomComponent {...item.props || {}} />
	</div>
{:else if item.type !== 'separator'}
	{#if isSpecialAction}
		<!-- Special wrapper for Clear All Filters -->
		<div class="menu-item__special-action-wrapper">
			<div class="menu-item__container" style="position: relative;">
				<button
					bind:this={buttonRef}
					type="button"
					class="menu-item menu-item--{item.type} menu-item--{size}"
					class:menu-item--disabled={isDisabled}
					class:menu-item--focused={isFocused}
					class:menu-item--nested={isNested}
					class:menu-item--checked={item.type === 'toggle' && item.checked}
					class:menu-item--has-submenu={item.type === 'submenu'}
					class:menu-item--special-action={isSpecialAction}
					class:menu-item--flashing={isFlashing && item.type !== 'toggle'}
					class:menu-item--flashing-single={isFlashing && item.type === 'toggle'}
					class:menu-item--special={isSpecialItem && isFlashing}
					data-checked={item.type === 'toggle' ? item.checked : undefined}
					disabled={isDisabled}
					onclick={(e) => handleClick(e)}
					onkeydown={handleKeydown}
					onmouseenter={handleMouseEnter}
					onmouseleave={handleMouseLeave}
					{...ariaAttributes}
				>
					{#if hasIcon}
						<span class="menu-item__icon" aria-hidden="true">
							{#if item.type === 'toggle'}
								{#if item.checked}
									<svg
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
									>
										<polyline points="20,6 9,17 4,12"></polyline>
									</svg>
								{:else}
									<div class="menu-item__checkbox"></div>
								{/if}
							{:else if IconComponent()}
								{@const Icon = IconComponent()}
								<Icon size="16" />
							{:else}
								<!-- Fallback for unknown icons -->
								<span class="icon-placeholder"
									>{typeof item.icon === 'string' ? item.icon : 'icon'}</span
								>
							{/if}
						</span>
					{/if}

					<span class="menu-item__label">
						{#if 'label' in item}
							{item.label}
						{/if}
					</span>

					{#if hasShortcut}
						<span class="menu-item__shortcut" aria-hidden="true">
							{item.shortcut}
						</span>
					{/if}

					{#if item.type === 'submenu'}
						<span class="menu-item__arrow" aria-hidden="true">
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
							>
								<polyline points="9,18 15,12 9,6"></polyline>
							</svg>
						</span>
					{/if}
				</button>
			</div>
		</div>
	{:else}
		<!-- Regular menu item without special wrapper -->
		<div class="menu-item__container" style="position: relative;">
			<button
				bind:this={buttonRef}
				type="button"
				class="menu-item menu-item--{item.type} menu-item--{size}"
				class:menu-item--disabled={isDisabled}
				class:menu-item--focused={isFocused}
				class:menu-item--nested={isNested}
				class:menu-item--checked={item.type === 'toggle' && item.checked}
				class:menu-item--has-submenu={item.type === 'submenu'}
				class:menu-item--flashing={isFlashing && item.type !== 'toggle'}
				class:menu-item--flashing-single={isFlashing && item.type === 'toggle'}
				class:menu-item--special={isSpecialItem && isFlashing}
				data-checked={item.type === 'toggle' ? item.checked : undefined}
				disabled={isDisabled}
				onclick={(e) => handleClick(e)}
				onkeydown={handleKeydown}
				onmouseenter={handleMouseEnter}
				onmouseleave={handleMouseLeave}
				{...ariaAttributes}
			>
				{#if hasIcon}
					<span class="menu-item__icon" aria-hidden="true">
						{#if item.type === 'toggle'}
							{#if item.checked}
								<svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
								>
									<polyline points="20,6 9,17 4,12"></polyline>
								</svg>
							{:else}
								<div class="menu-item__checkbox"></div>
							{/if}
						{:else if IconComponent()}
							{@const Icon = IconComponent()}
							<Icon size="16" />
						{:else}
							<!-- Fallback for unknown icons -->
							<span class="icon-placeholder"
								>{typeof item.icon === 'string' ? item.icon : 'icon'}</span
							>
						{/if}
					</span>
				{/if}

				<span class="menu-item__label">
					{#if 'label' in item}
						{item.label}
					{/if}
				</span>

				{#if hasShortcut}
					<span class="menu-item__shortcut" aria-hidden="true">
						{item.shortcut}
					</span>
				{/if}

				{#if item.type === 'submenu'}
					<span class="menu-item__arrow" aria-hidden="true">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<polyline points="9,18 15,12 9,6"></polyline>
						</svg>
					</span>
				{/if}
			</button>
		</div>
	{/if}
{/if}

<!-- Portal-based submenu rendered at document root -->
{#if item.type === 'submenu' && showSubmenu}
	<div
		class="submenu__portal"
		role="menu"
		style="position: fixed; left: {submenuPosition.x}px; top: {submenuPosition.y}px; z-index: 1001;"
		onmouseenter={() => {
			if (submenuTimeout) {
				clearTimeout(submenuTimeout);
				submenuTimeout = null;
			}
		}}
		onmouseleave={handleMouseLeave}
	>
		{#each item.items as subItem, subIndex (subItem.id || subIndex)}
			{#if subItem.type === 'separator'}
				<div class="submenu__separator"></div>
			{:else}
				<svelte:self
					item={subItem}
					menuId="{menuId}-submenu"
					index={subIndex}
					{size}
					{showIcon}
					{showShortcut}
					isNested={true}
					{onClose}
				/>
			{/if}
		{/each}
	</div>
{/if}

<style>
	@import './animations.css';

	.menu-item {
		display: flex;
		align-items: center;
		width: 100%;
		text-align: left;
		background: transparent;
		border: none;
		cursor: pointer;
		transition: var(--transition-colors);
		outline: none;
		position: relative;
	}

	/* Size variants */
	.menu-item--sm {
		padding: var(--space-1) var(--space-2);
		font-size: var(--font-size-sm);
		min-height: 2rem;
	}

	.menu-item--md {
		padding: var(--space-2) var(--space-3);
		font-size: var(--font-size-base);
		min-height: 2.25rem;
	}

	.menu-item--lg {
		padding: var(--space-3) var(--space-4);
		font-size: var(--font-size-lg);
		min-height: 2.75rem;
	}

	/* Base states */
	.menu-item {
		color: var(--color-text-primary);
	}

	.menu-item:hover:not(.menu-item--disabled) {
		background-color: var(--color-background-secondary);
		color: var(--color-text-primary);
	}

	.menu-item--focused {
		background-color: var(--color-primary-50);
		color: var(--color-primary-700);
	}

	.menu-item--disabled {
		color: var(--color-text-disabled);
		cursor: not-allowed;
	}

	/* Type-specific styles */
	.menu-item--destructive:hover:not(.menu-item--disabled) {
		background-color: var(--color-error-50);
		color: var(--color-error-700);
	}

	.menu-item--destructive.menu-item--focused {
		background-color: var(--color-error-100);
		color: var(--color-error-800);
	}

	.menu-item--toggle.menu-item--checked {
		background-color: var(--color-primary-50);
	}

	/* Layout elements */
	.menu-item__icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1rem;
		height: 1rem;
		margin-right: var(--space-2);
		flex-shrink: 0;
	}

	.menu-item__checkbox {
		width: 0.75rem;
		height: 0.75rem;
		border: 1px solid var(--color-border-strong);
		border-radius: var(--radius-sm);
		background: var(--color-surface);
	}

	.menu-item__label {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.menu-item__shortcut {
		margin-left: var(--space-4);
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		flex-shrink: 0;
		font-family: var(--font-family-mono);
	}

	.menu-item__arrow {
		margin-left: var(--space-2);
		color: var(--color-text-tertiary);
		flex-shrink: 0;
	}

	.icon-placeholder {
		font-size: var(--font-size-xs);
		color: var(--color-text-tertiary);
		font-family: var(--font-family-mono);
	}

	/* Custom item container */
	.menu-item--custom {
		padding: 0;
		cursor: default;
	}

	/* Nested menu item styling */
	.menu-item--nested {
		padding-left: var(--space-6);
	}

	/* Submenu portal styles */
	.submenu__portal {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
		min-width: 200px;
		padding: var(--space-1) 0;
		opacity: 0;
		transform: translateX(-8px);
		animation: submenu-enter 0.15s ease-out forwards;
	}

	.submenu__separator {
		height: 1px;
		background: var(--color-border);
		margin: var(--space-1) 0;
	}

	.menu-item--has-submenu:hover {
		background-color: var(--color-background-secondary);
	}

	@keyframes submenu-enter {
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* Section label styles (for menu categories) */
	.menu-item__section-label {
		padding: var(--space-2) var(--space-3);
		margin-top: var(--space-1);
		margin-bottom: var(--space-1);
	}

	.menu-item__section-label-text {
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-tertiary);
		font-weight: 500;
		opacity: 0.7;
	}

	/* Special action wrapper (e.g., Clear All Filters) */
	.menu-item__special-action-wrapper {
		background-color: var(--color-background-secondary);
		padding: var(--space-2) var(--space-3);
		margin-top: var(--space-1);
		display: flex;
		justify-content: center;
	}

	/* Special action button styling */
	.menu-item--special-action {
		margin: 0;
		background: transparent;
		padding: 0;
		border-radius: var(--radius-sm);
		font-weight: 500;
		font-size: var(--font-size-xs); /* Same size as category headers */
		text-transform: uppercase; /* Same as category headers */
		letter-spacing: 0.05em; /* Same as category headers */
		color: var(--color-text-secondary);
		transition: all var(--transition-colors);
	}

	.menu-item--special-action:hover:not(.menu-item--disabled) {
		background-color: var(--color-surface);
		color: var(--color-error-600);
	}

	.menu-item--special-action.menu-item--focused {
		background-color: var(--color-surface);
		color: var(--color-error-700);
	}

	/* Dark theme adjustments */
	:global(.theme-dark) .menu-item,
	:global(.theme-system-dark) .menu-item,
	:global(.scheme-spells) .menu-item {
		color: var(--color-text-primary);
	}

	:global(.theme-dark) .menu-item__section-label-text,
	:global(.theme-system-dark) .menu-item__section-label-text,
	:global(.scheme-spells) .menu-item__section-label-text {
		color: var(--color-text-tertiary);
		opacity: 0.6;
	}

	/* Dark theme for special action wrapper */
	:global(.theme-dark) .menu-item__special-action-wrapper,
	:global(.theme-system-dark) .menu-item__special-action-wrapper,
	:global(.scheme-spells) .menu-item__special-action-wrapper {
		background-color: rgba(0, 0, 0, 0.2);
	}

	:global(.theme-dark) .menu-item--special-action,
	:global(.theme-system-dark) .menu-item--special-action,
	:global(.scheme-spells) .menu-item--special-action {
		color: var(--color-text-secondary);
	}

	:global(.theme-dark) .menu-item--special-action:hover:not(.menu-item--disabled),
	:global(.theme-system-dark) .menu-item--special-action:hover:not(.menu-item--disabled),
	:global(.scheme-spells) .menu-item--special-action:hover:not(.menu-item--disabled) {
		background-color: var(--color-background);
		color: var(--color-error-400);
	}

	:global(.theme-dark) .menu-item--special-action.menu-item--focused,
	:global(.theme-system-dark) .menu-item--special-action.menu-item--focused,
	:global(.scheme-spells) .menu-item--special-action.menu-item--focused {
		background-color: var(--color-background);
		color: var(--color-error-300);
	}

	:global(.theme-dark) .menu-item:hover:not(.menu-item--disabled),
	:global(.theme-system-dark) .menu-item:hover:not(.menu-item--disabled),
	:global(.scheme-spells) .menu-item:hover:not(.menu-item--disabled) {
		background-color: var(--color-background-secondary);
		color: var(--color-text-primary);
	}

	:global(.theme-dark) .menu-item--focused,
	:global(.theme-system-dark) .menu-item--focused,
	:global(.scheme-spells) .menu-item--focused {
		background-color: var(--color-primary-600);
		color: var(--color-white);
	}

	:global(.theme-dark) .menu-item--destructive.menu-item--focused,
	:global(.theme-system-dark) .menu-item--destructive.menu-item--focused,
	:global(.scheme-spells) .menu-item--destructive.menu-item--focused {
		background-color: var(--color-error-900);
		color: var(--color-error-200);
	}

	:global(.theme-dark) .submenu__portal,
	:global(.theme-system-dark) .submenu__portal,
	:global(.scheme-spells) .submenu__portal {
		background: var(--color-surface);
		border-color: var(--color-border);
	}

	/* Spells/Grimoire specific toggle styling */
	:global(.scheme-spells) .menu-item--toggle.menu-item--checked {
		background-color: var(--color-primary-100);
		color: var(--color-primary-700);
	}

	:global(.scheme-spells.theme-dark) .menu-item--toggle.menu-item--checked,
	:global(.scheme-spells.theme-system-dark) .menu-item--toggle.menu-item--checked {
		background-color: rgba(168, 85, 247, 0.15);
		color: var(--accent-glow);
	}

	:global(.scheme-spells) .menu-item__checkbox {
		border-color: var(--color-primary-400);
	}

	:global(.scheme-spells.theme-dark) .menu-item__checkbox,
	:global(.scheme-spells.theme-system-dark) .menu-item__checkbox {
		border-color: var(--accent-primary);
	}
</style>
