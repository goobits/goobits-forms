<script lang="ts">
	import Portal from '../Portal.svelte';
	import type { TooltipState } from './tooltip.types.js';
	import { setTooltipElement } from './tooltip-actions.js';

	/**
	 * TooltipPortal Component
	 *
	 * Renders tooltips using the Portal system to escape overflow constraints.
	 * Automatically calculates positioning and handles viewport boundaries.
	 */

	interface Props {
		/** Current tooltip state */
		state: TooltipState;
		/** Custom CSS classes */
		className?: string;
	}

	const { state, className = '' }: Props = $props();

	let tooltipElement: HTMLElement;

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

		// Add rotation if specified, otherwise use default based on position
		if (state.arrowRotation !== undefined) {
			styles += ` transform: rotate(${state.arrowRotation}deg);`;
		} else {
			// Fallback to basic rotation based on tooltip position
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
		const customClasses = className;

		// Determine primary state modifier based on Sketchpad-style behavior
		let stateModifier = '';
		if (state.visible && !state.transitioning) {
			stateModifier = 'tooltip--state-visible';
		} else if (state.visible && state.transitioning) {
			stateModifier = 'tooltip--state-appearing';
		} else if (!state.visible && state.transitioning) {
			stateModifier = 'tooltip--state-transitioning';
		}

		return [
			block,
			positionModifier,
			directionModifier,
			stateModifier,
			noTransitionModifier,
			customClasses
		]
			.filter(Boolean)
			.join(' ');
	});

	// Register tooltip element for dimension measurement
	$effect(() => {
		if (tooltipElement) {
			setTooltipElement(tooltipElement);
		}
		return () => {
			setTooltipElement(null);
		};
	});
</script>

{#if state.visible && state.text}
	<Portal>
		<div
			bind:this={tooltipElement}
			class={tooltipClasses()}
			style="
        position: fixed;
        left: {state.position.x}px;
        top: {state.position.y}px;
        z-index: var(--z-tooltip, 1800);
        pointer-events: {state.allowPointerEvents ? 'auto' : 'none'};
      "
			role="tooltip"
			aria-hidden="false"
		>
			<div class="tooltip__content">
				{state.text}
			</div>
			<div class="tooltip__arrow {arrowPositionModifier()}" style={arrowStyles()}></div>
		</div>
	</Portal>
{/if}

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
		transform: scale(0.95);
		transition:
			opacity var(--transition-normal) ease-out,
			transform var(--transition-normal) ease-out,
			left var(--transition-normal) ease-out,
			top var(--transition-normal) ease-out;
		will-change: opacity, transform, left, top;
	}

	/* ===== STATE MODIFIERS ===== */

	.tooltip--state-visible {
		opacity: 1;
		transform: scale(1);
	}

	.tooltip--state-appearing {
		opacity: 0;
		transform: scale(0.95);
	}

	.tooltip--state-transitioning {
		opacity: 0;
		transform: scale(0.95);
	}

	/* ===== TRANSITION MODIFIERS ===== */

	.tooltip--no-transition {
		transition: none !important;
	}

	.tooltip--state-appearing.tooltip--no-transition {
		opacity: 1;
		transform: scale(1);
	}

	/* ===== POSITION MODIFIERS ===== */

	.tooltip--position-top:not(.tooltip--state-visible):not(.tooltip--state-appearing) {
		transform: scale(0.95) translateY(var(--space-2));
	}

	.tooltip--position-bottom:not(.tooltip--state-visible):not(.tooltip--state-appearing) {
		transform: scale(0.95) translateY(calc(-1 * var(--space-2)));
	}

	.tooltip--position-left:not(.tooltip--state-visible):not(.tooltip--state-appearing) {
		transform: scale(0.95) translateX(var(--space-2));
	}

	.tooltip--position-right:not(.tooltip--state-visible):not(.tooltip--state-appearing) {
		transform: scale(0.95) translateX(calc(-1 * var(--space-2)));
	}

	/* ===== DIRECTION MODIFIERS (RTL support) ===== */

	.tooltip--direction-rtl.tooltip--position-left:not(.tooltip--state-visible):not(
			.tooltip--state-appearing
		) {
		transform: scale(0.95) translateX(calc(-1 * var(--space-2)));
	}

	.tooltip--direction-rtl.tooltip--position-right:not(.tooltip--state-visible):not(
			.tooltip--state-appearing
		) {
		transform: scale(0.95) translateX(var(--space-2));
	}

	/* ===== TOOLTIP CONTENT ELEMENT ===== */

	.tooltip__content {
		background-color: var(--color-text-primary);
		border-radius: var(--border-radius-medium);
		border: 1px solid var(--color-border);
		color: var(--color-surface);
		padding: var(--space-2) var(--space-4);
		white-space: nowrap;
		max-width: 18.75rem; /* 300px */
		word-wrap: break-word;
		white-space: normal;
	}

	/* ===== TOOLTIP ARROW ELEMENT ===== */

	.tooltip__arrow {
		position: absolute;
		width: 0.625rem; /* 10px */
		height: 0.625rem; /* 10px */
		background-color: var(--color-text-primary);
		border: 1px solid var(--color-border);
		transform: rotate(45deg);
		transition:
			opacity var(--transition-normal) ease-out,
			transform var(--transition-normal) ease-out;
		will-change: opacity, transform;
	}

	/* ===== ARROW STATE COORDINATION ===== */

	.tooltip--state-appearing .tooltip__arrow {
		opacity: 0;
		transform: rotate(45deg) scale(0.8);
	}

	.tooltip--state-transitioning .tooltip__arrow {
		opacity: 0;
		transform: rotate(45deg) scale(0.8);
	}

	.tooltip--state-visible .tooltip__arrow {
		opacity: 1;
		transform: rotate(45deg) scale(1);
	}

	.tooltip--state-visible .tooltip__arrow[style*='transform'] {
		opacity: 1;
		/* Custom transform from style attribute takes precedence */
	}

	/* ===== ARROW POSITION MODIFIERS ===== */

	.tooltip__arrow--position-top {
		border-top: none;
		border-left: none;
	}

	.tooltip__arrow--position-bottom {
		border-bottom: none;
		border-right: none;
	}

	.tooltip__arrow--position-left {
		border-left: none;
		border-bottom: none;
	}

	.tooltip__arrow--position-right {
		border-right: none;
		border-top: none;
	}

	/* Enhanced arrow transitions for each position */
	.tooltip--position-top:not(.tooltip--state-visible):not(.tooltip--state-appearing)
		.tooltip__arrow--position-bottom {
		transform: rotate(45deg) scale(0.8) translateY(calc(-1 * var(--space-1)));
	}

	.tooltip--position-bottom:not(.tooltip--state-visible):not(.tooltip--state-appearing)
		.tooltip__arrow--position-top {
		transform: rotate(45deg) scale(0.8) translateY(var(--space-1));
	}

	.tooltip--position-left:not(.tooltip--state-visible):not(.tooltip--state-appearing)
		.tooltip__arrow--position-right {
		transform: rotate(45deg) scale(0.8) translateX(calc(-1 * var(--space-1)));
	}

	.tooltip--position-right:not(.tooltip--state-visible):not(.tooltip--state-appearing)
		.tooltip__arrow--position-left {
		transform: rotate(45deg) scale(0.8) translateX(var(--space-1));
	}

	/* ===== ACCESSIBILITY SUPPORT ===== */

	@media (prefers-contrast: high) {
		.tooltip__content {
			border-width: 2px;
			font-weight: var(--font-weight-medium);
		}
	}

	/* ===== MOTION PREFERENCES ===== */

	@media (prefers-reduced-motion: reduce) {
		.tooltip,
		.tooltip__arrow {
			transition: none !important;
			animation: none !important;
		}

		.tooltip--state-visible,
		.tooltip--state-appearing,
		.tooltip--state-transitioning {
			opacity: 1;
			transform: scale(1) translateX(0) translateY(0);
		}

		.tooltip__arrow {
			opacity: 1;
			transform: rotate(45deg) scale(1) translateX(0) translateY(0);
		}
	}

	/* Performance optimizations for smooth animations */
	@media (prefers-reduced-motion: no-preference) {
		.tooltip {
			backface-visibility: hidden;
			perspective: 1000px;
		}

		.tooltip__arrow {
			backface-visibility: hidden;
		}
	}
</style>
