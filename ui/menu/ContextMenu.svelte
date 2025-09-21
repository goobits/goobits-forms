<script lang="ts">
  /**
   * ContextMenu Component
   *
   * A context menu that appears on right-click, providing a clean API
   * for handling context-sensitive menus throughout applications.
   */

  import Menu from './Menu.svelte';

  const {
    state,
    onClose,
    items,
    preferLeft = false,
    placement,
    showPointer = true,
    offset = { x: 0, y: 0 },
    autoFocus = true,
    ...menuConfig
  }: import('./types').ContextMenuProps = $props();

  // Calculate position with smart defaults for context menus
  const menuX = $derived(() => {
    if (!state) return 0;

    let x = state.x + (offset.x || 0);

    // Handle specific placement positioning
    if (placement && state.target) {
      const rect = state.target.getBoundingClientRect();

      switch (placement) {
        case "left":
        case "top-left":
        case "bottom-left":
          x = rect.left - 8; // 8px to the left
          break;
        case "right":
        case "top-right":
        case "bottom-right":
          x = rect.right + 8; // 8px to the right
          break;
      }
    } else if (preferLeft && state.target) {
      // Fallback to preferLeft behavior
      const rect = state.target.getBoundingClientRect();
      x = rect.left - 8; // 8px to the left
    }

    return x;
  });

  const menuY = $derived(() => {
    if (!state) return 0;

    let y = state.y + (offset.y || 0);

    // Handle specific placement positioning
    if (placement && state.target) {
      const rect = state.target.getBoundingClientRect();

      switch (placement) {
        case "top-left":
        case "top-right":
          y = rect.top - 8; // 8px above
          break;
        case "bottom-left":
        case "bottom-right":
          y = rect.bottom + 8; // 8px below
          break;
        case "left":
        case "right":
          y = rect.top + rect.height / 2; // Center vertically
          break;
      }
    } else if (state.target) {
      // Default: center on target element vertically
      const rect = state.target.getBoundingClientRect();
      y = rect.top + rect.height / 2;
    }

    return y;
  });

  // Force direction based on placement or preferLeft setting
  const forceDirection = $derived(() => {
    if (placement) {
      switch (placement) {
        case "left":
        case "top-left":
        case "bottom-left":
          return "left";
        case "right":
        case "top-right":
        case "bottom-right":
          return "right";
        default:
          return "auto";
      }
    }
    return preferLeft ? "left" : "auto";
  });
</script>

<Menu
  {...menuConfig}
  {items}
  isVisible={!!state}
  x={menuX()}
  y={menuY()}
  {onClose}
  forceDirection={forceDirection}
  showPointer={showPointer}
  anchorEl={state?.target}
  {autoFocus}
/>