/**
 * Menu System - Export Index
 *
 * Single export point for the complete menu system.
 * Import everything you need from this single file.
 */

// Main components
export { default as Menu } from "./Menu.svelte";
export { default as ContextMenu } from "./ContextMenu.svelte";
// Types
export type {
  MenuPlacement,
  MenuVariant,
  MenuItemVariant,
  MenuItemSize,
  MenuPosition,
  MenuDimensions,
  MenuItemAction,
  MenuItemToggle,
  MenuItemDestructive,
  MenuItemSubmenu,
  MenuItemCustom,
  MenuItemSeparator,
  MenuItem,
  MenuConfig,
  MenuProps,
  MenuItemProps,
  KeyboardNavigationState,
  MenuKeyboardHandlers,
  MenuContext,
  ContextMenuState,
  ContextMenuConfig,
  ContextMenuProps,
} from "./types";

// Utilities
export {
  calculateMenuPosition,
  getMenuPositionStyles,
  createKeyboardNavigation,
  getMenuAriaAttributes,
  getMenuItemAriaAttributes,
  createContextMenuState,
  contextMenuAction
} from "./utils";

/**
 * Usage Examples:
 *
 * Basic menu:
 * ```svelte
 * <script>
 *   import { Menu, type MenuConfig } from '$lib/components/ui/menu';
 *
 *   const menuConfig: MenuConfig = {
 *     items: [
 *       { type: 'action', label: 'Edit', onClick: () => {} },
 *       { type: 'separator' },
 *       { type: 'destructive', label: 'Delete', onClick: () => {} }
 *     ]
 *   };
 * </script>
 *
 * <Menu
 *   {...menuConfig}
 *   isVisible={showMenu}
 *   x={mouseX}
 *   y={mouseY}
 *   onClose={() => showMenu = false}
 * />
 * ```
 *
 * Pre-configured menu:
 * ```svelte
 * <script>
 *   import { Menu, createPromptMenu } from '$lib/components/ui/menu';
 *
 *   const promptMenu = createPromptMenu({
 *     onEdit: () => {},
 *     onDelete: () => {},
 *     isFavorite: false,
 *     onToggleFavorite: () => {}
 *   });
 * </script>
 *
 * <Menu
 *   {...promptMenu}
 *   isVisible={showMenu}
 *   x={mouseX}
 *   y={mouseY}
 *   onClose={() => showMenu = false}
 * />
 * ```
 */
