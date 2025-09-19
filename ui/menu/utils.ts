/**
 * Menu Utilities
 *
 * Positioning, keyboard navigation, and helper functions for the menu system.
 * Reuses existing utilities and extends them for menu-specific needs.
 */

import type {
  MenuPosition,
  MenuDimensions,
  MenuPlacement,
  MenuItem,
} from "./types";

/**
 * Calculate optimal menu position based on cursor/anchor position and viewport constraints
 */
export function calculateMenuPosition(
  x: number,
  y: number,
  menuDimensions: MenuDimensions,
  padding: number = 8,
  forceDirection: "left" | "right" | "auto" = "auto",
  anchorEl?: HTMLElement,
): MenuPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // If anchor element is provided, adjust position relative to it
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    x = rect.left;
    y = rect.bottom + 4; // Small gap below anchor
  }

  // Default position: bottom-right of cursor/anchor
  let finalX = x;
  let finalY = y;
  let placement: MenuPlacement = "bottom-right";

  // Handle horizontal positioning
  if (forceDirection === "left") {
    finalX = x - menuDimensions.width;
    placement = finalY < y ? "top-left" : "bottom-left";
  } else if (forceDirection === "right") {
    // Keep default x position
    placement = finalY < y ? "top-right" : "bottom-right";
  } else {
    // Auto mode - check if menu would overflow right edge
    if (x + menuDimensions.width + padding > viewportWidth) {
      finalX = x - menuDimensions.width;
      placement = finalY < y ? "top-left" : "bottom-left";
    }
  }

  // Handle vertical positioning
  if (y + menuDimensions.height + padding > viewportHeight) {
    finalY = y - menuDimensions.height;
    placement = placement.includes("left") ? "top-left" : "top-right";
  }

  // Ensure menu stays within viewport bounds
  finalX = Math.max(
    padding,
    Math.min(finalX, viewportWidth - menuDimensions.width - padding),
  );
  finalY = Math.max(
    padding,
    Math.min(finalY, viewportHeight - menuDimensions.height - padding),
  );

  return { x: finalX, y: finalY, placement };
}

/**
 * Generate CSS styles for menu positioning
 */
export function getMenuPositionStyles(
  position: MenuPosition,
  zIndex: number = 1000,
): Record<string, string> {
  return {
    position: "fixed",
    left: `${position.x}px`,
    top: `${position.y}px`,
    "z-index": zIndex.toString(),
  };
}

/**
 * Get focusable menu items (excludes separators, labels, and disabled items)
 */
function getFocusableItems(items: MenuItem[]): MenuItem[] {
  return items.filter(
    (item) =>
      item.type !== "separator" &&
      item.type !== "label" &&
      !("disabled" in item && item.disabled),
  );
}

/**
 * Find the index of the next/previous focusable item
 */
function getNextFocusableIndex(
  items: MenuItem[],
  currentIndex: number,
  direction: "next" | "previous",
): number {
  const focusableItems = getFocusableItems(items);
  const focusableIndices = items
    .map((item, index) => (focusableItems.includes(item) ? index : -1))
    .filter((index) => index !== -1);

  if (focusableIndices.length === 0) return -1;

  const currentFocusableIndex = focusableIndices.indexOf(currentIndex);

  if (direction === "next") {
    const nextIndex = (currentFocusableIndex + 1) % focusableIndices.length;
    return focusableIndices[nextIndex];
  } else {
    const prevIndex =
      currentFocusableIndex <= 0
        ? focusableIndices.length - 1
        : currentFocusableIndex - 1;
    return focusableIndices[prevIndex];
  }
}

/**
 * Handle keyboard navigation for menu items
 */
export function createKeyboardNavigation(
  items: MenuItem[],
  onClose: () => void,
  onExecute: (index: number) => void,
  autoFocus: boolean = false,
) {
  let focusedIndex = -1;
  let isSubmenuOpen = false;

  const focusableItems = getFocusableItems(items);
  if (autoFocus && focusableItems.length) {
    // Find first focusable item only if autoFocus is enabled
    focusedIndex = items.findIndex((item) => focusableItems.includes(item));
  }

  return {
    get focusedIndex() {
      return focusedIndex;
    },

    get isSubmenuOpen() {
      return isSubmenuOpen;
    },

    focusNext() {
      focusedIndex = getNextFocusableIndex(items, focusedIndex, "next");
      return focusedIndex;
    },

    focusPrevious() {
      focusedIndex = getNextFocusableIndex(items, focusedIndex, "previous");
      return focusedIndex;
    },

    focusFirst() {
      const firstFocusable = items.findIndex((item) =>
        focusableItems.includes(item),
      );
      focusedIndex = firstFocusable !== -1 ? firstFocusable : -1;
      return focusedIndex;
    },

    focusLast() {
      const focusableIndices = items
        .map((item, index) => (focusableItems.includes(item) ? index : -1))
        .filter((index) => index !== -1);
      focusedIndex = focusableIndices.length
        ? focusableIndices[focusableIndices.length - 1]
        : -1;
      return focusedIndex;
    },

    executeCurrentItem() {
      if (focusedIndex >= 0 && focusedIndex < items.length) {
        onExecute(focusedIndex);
      }
    },

    handleKeydown(event: KeyboardEvent) {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          this.focusNext();
          break;

        case "ArrowUp":
          event.preventDefault();
          this.focusPrevious();
          break;

        case "Home":
          event.preventDefault();
          this.focusFirst();
          break;

        case "End":
          event.preventDefault();
          this.focusLast();
          break;

        case "Enter":
        case " ":
          event.preventDefault();
          this.executeCurrentItem();
          break;

        case "Escape":
          event.preventDefault();
          onClose();
          break;

        case "ArrowRight":
          // Handle submenu opening if applicable
          if (focusedIndex >= 0 && items[focusedIndex]?.type === "submenu") {
            event.preventDefault();
            isSubmenuOpen = true;
          }
          break;

        case "ArrowLeft":
          // Handle submenu closing
          if (isSubmenuOpen) {
            event.preventDefault();
            isSubmenuOpen = false;
          } else {
            // Close main menu if no submenu is open
            onClose();
          }
          break;
      }
    },
  };
}

/**
 * Generate unique menu item IDs for accessibility
 */
function generateMenuItemId(menuId: string, index: number): string {
  return `${menuId}-item-${index}`;
}

/**
 * Get ARIA attributes for menu accessibility
 */
export function getMenuAriaAttributes(menuId: string, focusedIndex: number) {
  return {
    role: "menu",
    "aria-labelledby": `${menuId}-trigger`,
    "aria-activedescendant":
      focusedIndex >= 0 ? generateMenuItemId(menuId, focusedIndex) : undefined,
  };
}

/**
 * Create context menu state from a right-click event
 */
export function createContextMenuState(
  event: MouseEvent,
  data?: Record<string, any>
): { x: number; y: number; target?: HTMLElement; data?: Record<string, any> } {
  event.preventDefault();
  event.stopPropagation();

  return {
    x: event.clientX,
    y: event.clientY,
    target: event.currentTarget as HTMLElement,
    data: data || {}
  };
}

/**
 * Context menu Svelte action for easy integration
 */
export function contextMenuAction(
  node: HTMLElement,
  params: {
    onContextMenu: (state: { x: number; y: number; target?: HTMLElement; data?: Record<string, any> }) => void;
    data?: Record<string, any>;
    disabled?: boolean;
  }
) {
  function handleContextMenu(event: MouseEvent) {
    if (params.disabled) return;

    const state = createContextMenuState(event, params.data);
    params.onContextMenu(state);
  }

  node.addEventListener('contextmenu', handleContextMenu);

  return {
    update(newParams: typeof params) {
      params = newParams;
    },
    destroy() {
      node.removeEventListener('contextmenu', handleContextMenu);
    }
  };
}

/**
 * Get ARIA attributes for menu items
 */
export function getMenuItemAriaAttributes(
  menuId: string,
  index: number,
  item: MenuItem,
  isFocused: boolean,
) {
  const baseAttributes = {
    id: generateMenuItemId(menuId, index),
    role: item.type === "separator" ? "separator" : "menuitem",
    tabindex: -1,
  };

  if (item.type === "separator") {
    return baseAttributes;
  }

  return {
    ...baseAttributes,
    "aria-disabled": ("disabled" in item && item.disabled) || undefined,
    "aria-checked": item.type === "toggle" ? item.checked : undefined,
    "aria-haspopup": item.type === "submenu" ? "menu" : undefined,
    "aria-expanded": item.type === "submenu" ? false : undefined, // Will be updated when submenu opens
    "data-focused": isFocused,
  };
}
