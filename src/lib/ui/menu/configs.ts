/**
 * Basic Menu Configurations
 *
 * Simple configurations for common form use cases.
 * For complex configurations with i18n, use the main application's config files.
 */

import type { MenuConfig, MenuItem } from './types';

/**
 * Create a basic select menu configuration
 */
export function createSelectMenu(options: {
	items: Array<{ value: string; label: string; icon?: string }>;
	onSelect: (value: string) => void;
}): MenuConfig {
	const items: MenuItem[] = options.items.map((option) => ({
		type: 'action',
		label: option.label,
		icon: option.icon,
		onClick: () => options.onSelect(option.value)
	}));

	return {
		id: 'select-menu',
		items,
		variant: 'default',
		showIcons: !!options.items.some((item) => item.icon),
		showShortcuts: false
	};
}

/**
 * Create a basic action menu
 */
export function createActionMenu(options: {
	actions: Array<{
		label: string;
		icon?: string;
		onClick: () => void;
		destructive?: boolean;
		confirmMessage?: string;
	}>;
}): MenuConfig {
	const items: MenuItem[] = options.actions.map((action) => ({
		type: action.destructive ? 'destructive' : 'action',
		label: action.label,
		icon: action.icon,
		onClick: action.onClick,
		...(action.confirmMessage && { confirmMessage: action.confirmMessage })
	}));

	return {
		id: 'action-menu',
		items,
		variant: 'default',
		showIcons: true,
		showShortcuts: false
	};
}
