<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import TooltipPortal from './TooltipPortal.svelte';
  import { subscribeToTooltip, getTooltipState, initializeGlobalTooltips } from './tooltip-actions.js';
  import type { TooltipState } from './tooltip.types.js';

  /**
   * TooltipManager Component
   *
   * Global tooltip manager that:
   * 1. Renders the active tooltip using TooltipPortal
   * 2. Automatically initializes tooltips for all aria-label elements
   * 3. Manages the global tooltip state
   *
   * Add this component to your root layout to enable tooltips globally.
   */

  interface Props {
    /** Whether to automatically initialize tooltips for aria-label elements */
    autoInitialize?: boolean;
    /** Custom CSS class for tooltips */
    className?: string;
  }

  const { autoInitialize = true, className = '' }: Props = $props();

  let tooltipState: TooltipState = $state({
    visible: false,
    transitioning: false,
    position: { x: 0, y: 0 },
    text: '',
    targetElement: null,
    finalPosition: 'top',
    arrowPosition: { x: 0, y: 0 },
    direction: 'ltr',
    actualDimensions: { width: 200, height: 40 },
    disableTransition: false,
    allowPointerEvents: false,
    arrowVisible: true,
    arrowRotation: undefined
  });

  let unsubscribe: (() => void) | undefined;
  let cleanupGlobal: (() => void) | undefined;

  onMount(() => {
    if (!browser) return;

    // Subscribe to tooltip state changes
    unsubscribe = subscribeToTooltip(() => {
      tooltipState = getTooltipState();
    });

    // Initialize global tooltips if enabled
    if (autoInitialize) {
      cleanupGlobal = initializeGlobalTooltips();
    }
  });

  onDestroy(() => {
    unsubscribe?.();
    cleanupGlobal?.();
  });
</script>

<!-- Render the global tooltip -->
<TooltipPortal state={tooltipState} {className} />