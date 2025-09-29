<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Portal from '../Portal.svelte';
  import type { TooltipState } from './tooltip.types.js';
  import { subscribeToTooltipState, setTooltipElement, TooltipManager, tooltip } from './tooltip-manager.js';

  /**
   * Global Tooltip Portal Component
   *
   * Renders a single global tooltip that follows the Sketchpad pattern.
   * Subscribes to the global tooltip manager state.
   * Auto-initializes tooltips for aria-label elements.
   */

  interface Props {
    /** Auto-initialize tooltips for aria-label elements */
    autoInitialize?: boolean;
  }

  const { autoInitialize = true }: Props = $props();

  // State from the global manager
  let state = $state<TooltipState>(TooltipManager.getState());
  let tooltipElement: HTMLElement;
  let unsubscribe: (() => void) | null = null;
  let cleanupFunctions: Array<() => void> = [];

  // Calculate arrow position based on tooltip position (BEM modifier)
  const arrowPositionModifier = $derived(() => {
    switch (state.finalPosition) {
      case 'top':
        return 'tooltip__arrow--position-bottom';
      case 'bottom':
        return 'tooltip__arrow--position-top';
      case 'left':
        return 'tooltip__arrow--position-right';
      case 'right':
        return 'tooltip__arrow--position-left';
      default:
        return 'tooltip__arrow--position-bottom';
    }
  });

  // Dynamic arrow positioning styles
  const arrowStyles = $derived(() => {
    const { x, y } = state.arrowPosition;
    let styles = `left: ${x}px; top: ${y}px;`;

    // Add rotation if specified
    if (state.arrowRotation !== undefined) {
      styles += ` transform: rotate(${state.arrowRotation}deg);`;
    } else if (state.rotation) {
      // Use tooltip rotation if no specific arrow rotation
      styles += ` transform: rotate(${state.rotation * 180 / Math.PI}deg);`;
    } else {
      // Default 45deg for diamond shape
      styles += ` transform: rotate(45deg);`;
    }

    // Hide arrow if not visible
    if (!state.arrowVisible) {
      styles += ` opacity: 0; pointer-events: none;`;
    }

    return styles;
  });

  // Calculate tooltip classes using semantic BEM methodology
  const tooltipClasses = $derived(() => {
    const block = 'tooltip';
    const positionModifier = `tooltip--position-${state.finalPosition}`;
    const directionModifier = `tooltip--direction-${state.direction}`;
    const noTransitionModifier = state.disableTransition ? 'tooltip--no-transition' : '';
    const interactiveModifier = state.allowPointerEvents ? 'tooltip--interactive' : '';
    const clickModeModifier = state.showMode === 'click' ? 'tooltip--click-mode' : '';

    // Determine primary state modifier
    let stateModifier = '';
    if (state.visible && !state.transitioning) {
      stateModifier = 'tooltip--state-visible';
    } else if (state.visible && state.transitioning) {
      stateModifier = 'tooltip--state-appearing';
    } else if (!state.visible && state.transitioning) {
      stateModifier = 'tooltip--state-hiding';
    }

    return [
      block,
      positionModifier,
      directionModifier,
      stateModifier,
      noTransitionModifier,
      interactiveModifier,
      clickModeModifier
    ].filter(Boolean).join(' ');
  });

  // Calculate transform for positioning and rotation
  const tooltipTransform = $derived(() => {
    const { x, y } = state.position;
    let transform = `translate(${x}px, ${y}px)`;

    if (state.rotation) {
      transform += ` rotate(${state.rotation * 180 / Math.PI}deg)`;
    }

    return transform;
  });

  // Auto-initialize tooltips for aria-label elements
  function initializeAriaLabelTooltips() {
    if (!autoInitialize) return;

    // Clean up previous listeners
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];

    // Find all elements with aria-label
    const elements = document.querySelectorAll('[aria-label]:not(.no-tooltip)');

    elements.forEach((element) => {
      if (!(element instanceof HTMLElement)) return;

      const ariaLabel = element.getAttribute('aria-label');
      if (!ariaLabel) return;

      // Apply tooltip action
      const cleanup = tooltip(element, {
        content: ariaLabel,
        showOnHover: true,
        showDelay: 500
      });

      cleanupFunctions.push(() => cleanup.destroy());
    });
  }

  // Subscribe to global state changes
  onMount(() => {
    unsubscribe = subscribeToTooltipState((newState) => {
      state = newState;
    });

    // Initialize aria-label tooltips
    if (autoInitialize) {
      // Initial setup
      initializeAriaLabelTooltips();

      // Watch for DOM changes
      const observer = new MutationObserver(() => {
        initializeAriaLabelTooltips();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['aria-label']
      });

      // Cleanup observer
      cleanupFunctions.push(() => observer.disconnect());
    }
  });

  onDestroy(() => {
    unsubscribe?.();
    setTooltipElement(null);
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
  });

  // Register tooltip element for dimension measurement
  $effect(() => {
    if (tooltipElement) {
      setTooltipElement(tooltipElement);
    }
  });
</script>

{#if state.visible || state.transitioning}
  <Portal>
    <div
      bind:this={tooltipElement}
      class={tooltipClasses()}
      style="
        position: fixed;
        transform: {tooltipTransform()};
        transform-origin: -13px 50%;
        z-index: var(--z-tooltip, 1800);
        pointer-events: {state.allowPointerEvents ? 'auto' : 'none'};
      "
      role="tooltip"
      aria-hidden={!state.visible}
    >
      <div class="tooltip__content">
        {#if typeof state.content === 'string'}
          {@html state.content}
        {:else if state.content instanceof HTMLElement}
          <!-- For HTML elements, we need to append them -->
          <div use:appendHtmlElement={state.content}></div>
        {:else if state.text}
          {state.text}
        {/if}
      </div>
      <div class="tooltip__arrow {arrowPositionModifier()}" style={arrowStyles()}></div>
    </div>
  </Portal>
{/if}

<script context="module" lang="ts">
  /**
   * Action to append an HTML element to a container
   */
  function appendHtmlElement(node: HTMLElement, element: HTMLElement) {
    node.appendChild(element);

    return {
      destroy() {
        if (node.contains(element)) {
          node.removeChild(element);
        }
      }
    };
  }
</script>

<style>
/* Import shared forms design system */
@import '../variables.css';

/* ===== TOOLTIP BLOCK (BEM) ===== */
.tooltip {
  /* Base tooltip styles using shared design tokens */
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-tight);
  opacity: 0;
  transition: opacity var(--transition-normal) ease-out,
              transform var(--transition-normal) ease-out;
  will-change: opacity, transform;
  width: auto;
  display: block;
}

/* ===== STATE MODIFIERS ===== */

.tooltip--state-visible {
  opacity: 1;
}

.tooltip--state-appearing {
  opacity: 0;
  animation: tooltipFadeIn var(--transition-normal) ease-out forwards;
}

.tooltip--state-hiding {
  opacity: 0;
  animation: tooltipFadeOut var(--transition-normal) ease-out;
}

.tooltip--no-transition {
  transition: none !important;
}

.tooltip--interactive {
  pointer-events: auto !important;
  user-select: text;
}

.tooltip--click-mode {
  /* Click mode tooltips may have different styles */
  box-shadow: var(--shadow-medium);
}

/* ===== POSITION MODIFIERS ===== */

.tooltip--position-top {
  /* Arrow appears at bottom */
}

.tooltip--position-bottom {
  /* Arrow appears at top */
}

.tooltip--position-left {
  /* Arrow appears at right */
}

.tooltip--position-right {
  /* Arrow appears at left */
}

/* ===== DIRECTION MODIFIERS (RTL/LTR) ===== */

.tooltip--direction-rtl {
  direction: rtl;
  text-align: right;
}

.tooltip--direction-ltr {
  direction: ltr;
  text-align: left;
}

/* ===== TOOLTIP ELEMENTS ===== */

.tooltip__content {
  background-color: var(--color-gray-900, #1a1a1a);
  color: var(--color-white, #ffffff);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-small);
  max-width: 250px;
  word-wrap: break-word;
  box-shadow: var(--shadow-medium);
  position: relative;
  z-index: 1;
}

.tooltip__arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: var(--color-gray-900, #1a1a1a);
  pointer-events: none;
  z-index: 0;
}

/* Arrow position variants */
.tooltip__arrow--position-top {
  /* Arrow at top edge */
}

.tooltip__arrow--position-bottom {
  /* Arrow at bottom edge */
}

.tooltip__arrow--position-left {
  /* Arrow at left edge */
}

.tooltip__arrow--position-right {
  /* Arrow at right edge */
  transform-origin: center;
}

/* ===== ANIMATIONS ===== */

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes tooltipFadeOut {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* ===== DARK MODE SUPPORT ===== */

:global(.theme-dark) .tooltip__content {
  background-color: var(--color-gray-800);
  color: var(--color-gray-100);
}

:global(.theme-dark) .tooltip__arrow {
  background-color: var(--color-gray-800);
}
</style>