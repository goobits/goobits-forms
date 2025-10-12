/**
 * Tooltip System - Full-featured Sketchpad-compatible tooltips
 *
 * Features (matching Sketchpad):
 * - Portal-based rendering (no clipping by overflow: hidden)
 * - Auto-positioning with viewport boundary detection
 * - Click-to-show mode with outside click dismissal
 * - Auto-hide timer support
 * - Interactive tooltips (allowPointerEvents)
 * - Dynamic content functions
 * - Rotation support
 * - Global show/hide API
 * - Callbacks on hide
 * - Advanced stick-to-edge modes
 * - Global enable/disable
 * - Touch device support
 * - Theme-aware styling
 * - Accessibility compliant
 *
 * Usage:
 * ```typescript
 * import { TooltipPortal, tooltip, TooltipManager } from '@goobits/forms/ui/tooltip';
 *
 * // Svelte action (hover):
 * <div use:tooltip={{ content: "Hello world" }}>Hover me</div>
 *
 * // Click mode:
 * <div use:tooltip={{ content: "Click tooltip", showOnClick: true }}>Click me</div>
 *
 * // Programmatic control:
 * TooltipManager.show({ content: "Manual tooltip", position: { x: 100, y: 200 } });
 * TooltipManager.hide(() => console.log('Hidden!'));
 * ```
 */

// Component exports - Global portal component
export { default as TooltipPortal } from './TooltipPortalGlobal.svelte';

// Legacy components for backward compatibility
export { default as TooltipPortalLegacy } from './TooltipPortal.svelte';
export { default as TooltipManagerComponent } from './TooltipManager.svelte';

// Global manager and action exports
export {
	TooltipManager as TooltipAPI,
	tooltip,
	subscribeToTooltipState,
	setTooltipElement
} from './tooltip-manager.js';

// Legacy action exports for backward compatibility
export {
	useTooltip,
	tooltipManager,
	subscribeToTooltip,
	getTooltipState,
	initializeGlobalTooltips
} from './tooltip-actions.js';

// Type exports
export type {
	TooltipOptions,
	TooltipPosition,
	TooltipState,
	TooltipManager as TooltipManagerType,
	TooltipAction,
	TooltipContent
} from './tooltip.types.js';

// Default export is the tooltip action
import { tooltip as defaultTooltip } from './tooltip-manager.js';
export default defaultTooltip;
