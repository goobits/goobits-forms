/**
 * Menu System Types
 *
 * Comprehensive type definitions for the flexible menu system.
 * Supports context menus, dropdown menus, action menus, and more.
 */

export type MenuPlacement =
	| 'top-left'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-right'
	| 'left'
	| 'right';

export type MenuVariant = 'default' | 'compact' | 'elevated';

export type MenuItemSize = 'sm' | 'md' | 'lg';

export interface MenuPosition {
	x: number;
	y: number;
	placement: MenuPlacement;
}

export interface MenuDimensions {
	width: number;
	height: number;
}

export interface MenuItemAction {
	type: 'action';
	label: string;
	icon?: string | any; // Support both string names and component constructors
	shortcut?: string;
	disabled?: boolean;
	onClick: () => void;
}

export interface MenuItemToggle {
	type: 'toggle';
	label: string;
	icon?: string | any; // Support both string names and component constructors
	shortcut?: string;
	disabled?: boolean;
	checked: boolean;
	onChange: (checked: boolean) => void;
}

export interface MenuItemDestructive {
	type: 'destructive';
	label: string;
	icon?: string | any; // Support both string names and component constructors
	shortcut?: string;
	disabled?: boolean;
	confirmMessage?: string;
	onClick: () => void;
}

export interface MenuItemSubmenu {
	type: 'submenu';
	label: string;
	icon?: string | any; // Support both string names and component constructors
	disabled?: boolean;
	items: MenuItem[];
}

export interface MenuItemCustom {
	type: 'custom';
	component: any; // Svelte component - Keep as any for component flexibility
	props?: Record<string, unknown>;
}

export interface MenuItemSeparator {
	type: 'separator';
	id?: string;
}

export interface MenuItemLabel {
	type: 'label';
	label: string;
	id?: string;
}

export type MenuItem =
	| MenuItemAction
	| MenuItemToggle
	| MenuItemDestructive
	| MenuItemSubmenu
	| MenuItemCustom
	| MenuItemSeparator
	| MenuItemLabel;

export interface MenuConfig {
	id?: string;
	items: MenuItem[];
	variant?: MenuVariant;
	size?: MenuItemSize;
	className?: string;
	maxHeight?: number;
	minWidth?: number;
	showIcons?: boolean;
	showShortcuts?: boolean;
}

export interface MenuProps extends MenuConfig {
	isVisible: boolean;
	x: number;
	y: number;
	onClose: () => void;
	forceDirection?: 'left' | 'right' | 'auto';
	showPointer?: boolean;
	pointerDirection?: 'left' | 'right' | 'auto';
	anchorEl?: HTMLElement;
	autoFocus?: boolean;
}

/* interface MenuItemProps {
	item: MenuItem;
	size?: MenuItemSize;
	showIcon?: boolean;
	showShortcut?: boolean;
	isNested?: boolean;
	onClose?: () => void;
} */

/* interface KeyboardNavigationState {
	focusedIndex: number;
	items: MenuItem[];
	isSubmenuOpen: boolean;
	submenuIndex?: number;
} */

/* interface MenuKeyboardHandlers {
	onArrowUp: () => void;
	onArrowDown: () => void;
	onArrowRight: () => void;
	onArrowLeft: () => void;
	onEnter: () => void;
	onEscape: () => void;
} */

// Context Menu Types
export interface ContextMenuState {
	x: number;
	y: number;
	target?: HTMLElement;
	data?: Record<string, any>; // Generic context data
}

export interface ContextMenuConfig extends MenuConfig {
	/** Whether the context menu should position to the left of the trigger */
	preferLeft?: boolean;
	/** Specific placement direction to force (overrides preferLeft and auto-detection) */
	placement?: MenuPlacement;
	/** Whether to show a pointer/arrow pointing to the trigger */
	showPointer?: boolean;
	/** Additional offset from the trigger element */
	offset?: { x?: number; y?: number };
}

export interface ContextMenuProps extends ContextMenuConfig {
	/** Current context menu state (null means closed) */
	state: ContextMenuState | null;
	/** Called when the context menu should close */
	onClose: () => void;
	/** Whether to auto-focus the first item */
	autoFocus?: boolean;
}

/* interface MenuContext {
	close: () => void;
	focusNext: () => void;
	focusPrevious: () => void;
	executeItem: (index: number) => void;
} */
