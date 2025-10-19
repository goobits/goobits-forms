/**
 * Tooltip Actions and Management
 *
 * Provides Svelte actions and utilities for managing Portal-based tooltips
 */

import type {
	TooltipOptions,
	TooltipState,
	TooltipAction,
	TooltipManager
} from './tooltip.types.js';

import { calculateAdvancedPosition } from './positioning-engine.js';

// Global tooltip state
let globalTooltipState: TooltipState = {
	visible: false,
	transitioning: false,
	position: { x: 0, y: 0 },
	content: '',
	targetElement: null,
	finalPosition: 'top',
	arrowPosition: { x: 0, y: 0 },
	direction: 'ltr',
	actualDimensions: { width: 200, height: 40 },
	disableTransition: false,
	allowPointerEvents: false,
	arrowVisible: true,
	arrowRotation: undefined,
	showMode: 'hover',
	hideCallbacks: [],
	stickToEdge: false,
	rotation: 0
};

// Global tooltip callbacks for the Svelte component to subscribe to
const globalTooltipCallbacks: Array<() => void> = [];

// Timeout tracking for debouncing
let hideTimeout: number | undefined;
let transitionTimeout: number | undefined;

// Enhanced transition timing constants
const FADE_OUT_DELAY = 150; // Wait before starting fade out
const TRANSITION_DURATION = 200; // CSS transition duration

// Distance-based transition thresholds (matching Sketchpad behavior)
const TRANSFORM_DISTANCE_THRESHOLD = 100; // Within this distance, transform position
const FADE_DISTANCE_THRESHOLD = 200; // Beyond this distance, fade out/in

// Default tooltip options
const DEFAULT_OPTIONS: Required<Omit<TooltipOptions, 'content' | 'text'>> & Pick<TooltipOptions, 'content'> = {
	content: '',
	position: 'auto',
	offset: 8,
	showDelay: 500,
	hideDelay: 150,
	disableOnTouch: true,
	className: '',
	allowPointerEvents: false,
	stickToEdge: false,
	pointBasedPosition: null,
	showOnClick: false,
	showOnHover: true,
	autoHideAfter: 0,
	rotation: 0
};

// Reference to current tooltip element for dimension measurement
let currentTooltipElement: HTMLElement | null = null;

/**
 * Set the tooltip element reference for dimension measurement
 */
export function setTooltipElement(element: HTMLElement | null): void {
	currentTooltipElement = element;
}

/**
 * Process tooltip content - supports content or text (for backward compatibility)
 */
function getTooltipContent(options: TooltipOptions): string {
	// Prefer content over text, with text as fallback for backward compatibility
	const content = options.content || options.text || '';

	// If content is a function, call it to get the actual content
	if (typeof content === 'function') {
		const result = content();
		return typeof result === 'string' ? result : '';
	}

	// If content is an HTMLElement, convert to string (simple implementation)
	if (typeof content === 'object' && content !== null) {
		return ''; // HTMLElement not fully supported in this implementation yet
	}

	return String(content);
}

/**
 * Calculate transition type based on distance between positions (Sketchpad-style)
 */
function calculateTransitionType(
	currentPos: { x: number; y: number },
	newPos: { x: number; y: number }
): 'transform' | 'fade' | 'instant' {
	if (!currentPos || !newPos) return 'instant';

	const distance = Math.sqrt(
		Math.pow(newPos.x - currentPos.x, 2) + Math.pow(newPos.y - currentPos.y, 2)
	);

	if (distance <= TRANSFORM_DISTANCE_THRESHOLD) {
		return 'transform'; // Smooth position transition
	} else if (distance <= FADE_DISTANCE_THRESHOLD) {
		return 'fade'; // Fade out, reposition, fade in
	} else {
		return 'instant'; // Large jump, disable transitions
	}
}

/**
 * Optimize transition states based on positioning context
 */
function optimizeTransitionState(newState: Partial<TooltipState>): void {
	// If position changed significantly, ensure smooth transition
	if (newState.disableTransition) {
		// For large position changes, briefly disable then re-enable transitions
		globalTooltipState.disableTransition = true;
		globalTooltipCallbacks.forEach((callback) => callback());

		// Re-enable transitions after a frame
		requestAnimationFrame(() => {
			if (globalTooltipState.visible) {
				globalTooltipState.disableTransition = false;
				globalTooltipCallbacks.forEach((callback) => callback());
			}
		});
	}
}

/**
 * Show tooltip for a given element
 */
function showTooltip(element: HTMLElement, options: TooltipOptions): void {
	// Clear any pending hide timeout (debouncing)
	if (hideTimeout) {
		clearTimeout(hideTimeout);
		hideTimeout = undefined;
	}

	// Clear any pending transition timeout
	if (transitionTimeout) {
		clearTimeout(transitionTimeout);
		transitionTimeout = undefined;
	}

	// Calculate advanced position using new positioning engine
	const positionCalculation = calculateAdvancedPosition({
		targetElement: element,
		tooltipElement: currentTooltipElement,
		preferredPosition: options.position,
		offset: options.offset,
		stickToEdge: options.stickToEdge,
		pointBasedPosition: options.pointBasedPosition,
		lastPosition: globalTooltipState.position
	});

	// Get tooltip content (supports both content and text properties)
	const content = getTooltipContent(options);

	// If tooltip is already visible, handle transition based on distance (Sketchpad-style)
	if (globalTooltipState.visible) {
		const transitionType = calculateTransitionType(
			globalTooltipState.position,
			positionCalculation.position
		);

		if (String(globalTooltipState.content) === content && transitionType === 'transform') {
			// Same content, close position - smooth transform
			globalTooltipState.position = positionCalculation.position;
			globalTooltipState.finalPosition = positionCalculation.finalPosition;
			globalTooltipState.arrowPosition = positionCalculation.arrowPosition;
			globalTooltipState.direction = positionCalculation.direction;
			globalTooltipState.actualDimensions = positionCalculation.actualDimensions;
			globalTooltipState.disableTransition = false; // Allow smooth transform
			globalTooltipState.allowPointerEvents = options.allowPointerEvents || false;
			globalTooltipState.arrowVisible = positionCalculation.arrowVisible;
			globalTooltipState.arrowRotation = positionCalculation.arrowRotation;
			globalTooltipState.targetElement = element;
			globalTooltipCallbacks.forEach((callback) => callback());
			return;
		} else if (transitionType === 'fade') {
			// Different content or medium distance - fade out then fade in
			globalTooltipState.transitioning = true;
			globalTooltipCallbacks.forEach((callback) => callback());

			// Fade out, then reposition and fade in
			setTimeout(() => {
				globalTooltipState = {
					visible: true,
					transitioning: true,
					position: positionCalculation.position,
					content,
					targetElement: element,
					finalPosition: positionCalculation.finalPosition,
					arrowPosition: positionCalculation.arrowPosition,
					direction: positionCalculation.direction,
					actualDimensions: positionCalculation.actualDimensions,
					disableTransition: false,
					allowPointerEvents: options.allowPointerEvents || false,
					arrowVisible: positionCalculation.arrowVisible,
					arrowRotation: positionCalculation.arrowRotation,
					showMode: 'hover',
					hideCallbacks: [],
					stickToEdge: options.stickToEdge || false,
					rotation: options.rotation || 0
				};
				globalTooltipCallbacks.forEach((callback) => callback());

				// Complete fade in
				setTimeout(() => {
					if (globalTooltipState.visible) {
						globalTooltipState.transitioning = false;
						globalTooltipCallbacks.forEach((callback) => callback());
					}
				}, TRANSITION_DURATION / 2);
			}, TRANSITION_DURATION / 2);
			return;
		}
		// For 'instant' or large distance changes, fall through to full replacement
	}

	// If content is different or tooltip is hidden, show new tooltip
	globalTooltipState = {
		visible: true,
		transitioning: true,
		position: positionCalculation.position,
		content,
		targetElement: element,
		finalPosition: positionCalculation.finalPosition,
		arrowPosition: positionCalculation.arrowPosition,
		direction: positionCalculation.direction,
		actualDimensions: positionCalculation.actualDimensions,
		disableTransition: positionCalculation.disableTransition,
		allowPointerEvents: options.allowPointerEvents || false,
		arrowVisible: positionCalculation.arrowVisible,
		arrowRotation: positionCalculation.arrowRotation,
		showMode: 'hover',
		hideCallbacks: [],
		stickToEdge: options.stickToEdge || false,
		rotation: options.rotation || 0
	};

	// Notify subscribers immediately
	globalTooltipCallbacks.forEach((callback) => callback());

	// Enhanced transition coordination with staggered timing
	transitionTimeout = window.setTimeout(
		() => {
			if (globalTooltipState.visible) {
				globalTooltipState.transitioning = false;
				globalTooltipCallbacks.forEach((callback) => callback());
			}
		},
		positionCalculation.disableTransition ? 0 : TRANSITION_DURATION
	);
}

/**
 * Hide the current tooltip (immediate)
 */
function hideTooltipImmediate(): void {
	// Clear any pending timeouts
	if (hideTimeout) {
		clearTimeout(hideTimeout);
		hideTimeout = undefined;
	}
	if (transitionTimeout) {
		clearTimeout(transitionTimeout);
		transitionTimeout = undefined;
	}

	globalTooltipState = {
		visible: false,
		transitioning: false,
		position: { x: 0, y: 0 },
		content: '',
		targetElement: null,
		finalPosition: 'top',
		arrowPosition: { x: 0, y: 0 },
		direction: 'ltr',
		actualDimensions: { width: 200, height: 40 },
		disableTransition: false,
		allowPointerEvents: false,
		arrowVisible: true,
		arrowRotation: undefined,
		showMode: 'hover',
		hideCallbacks: [],
		stickToEdge: false,
		rotation: 0
	};

	// Notify subscribers
	globalTooltipCallbacks.forEach((callback) => callback());
}

/**
 * Hide the current tooltip (debounced)
 */
function hideTooltip(): void {
	// Clear any existing hide timeout
	if (hideTimeout) {
		clearTimeout(hideTimeout);
	}

	// Set debounced hide timeout with enhanced transition logic
	hideTimeout = window.setTimeout(() => {
		if (globalTooltipState.visible) {
			// Start hide transition - set transitioning but keep visible for CSS
			globalTooltipState.transitioning = true;
			globalTooltipCallbacks.forEach((callback) => callback());

			// Complete hide after transition with enhanced timing
			const transitionDuration = globalTooltipState.disableTransition ? 0 : TRANSITION_DURATION;
			transitionTimeout = window.setTimeout(() => {
				globalTooltipState = {
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
				};
				globalTooltipCallbacks.forEach((callback) => callback());
			}, transitionDuration);
		}
		hideTimeout = undefined;
	}, FADE_OUT_DELAY);
}

/**
 * Update tooltip position (useful for responsive updates)
 */
function updateTooltipPosition(): void {
	if (!globalTooltipState.visible || !globalTooltipState.targetElement) return;

	const positionCalculation = calculateAdvancedPosition({
		targetElement: globalTooltipState.targetElement,
		tooltipElement: currentTooltipElement,
		preferredPosition: 'auto',
		offset: 8,
		lastPosition: globalTooltipState.position
	});

	// Apply transition optimization for large position changes
	optimizeTransitionState(positionCalculation);

	globalTooltipState.position = positionCalculation.position;
	globalTooltipState.finalPosition = positionCalculation.finalPosition;
	globalTooltipState.arrowPosition = positionCalculation.arrowPosition;
	globalTooltipState.direction = positionCalculation.direction;
	globalTooltipState.actualDimensions = positionCalculation.actualDimensions;
	globalTooltipState.disableTransition = positionCalculation.disableTransition;
	globalTooltipState.arrowVisible = positionCalculation.arrowVisible;
	globalTooltipState.arrowRotation = positionCalculation.arrowRotation;

	// Notify subscribers
	globalTooltipCallbacks.forEach((callback) => callback());
}

/**
 * Subscribe to tooltip state changes
 */
export function subscribeToTooltip(callback: () => void): () => void {
	globalTooltipCallbacks.push(callback);

	return () => {
		const index = globalTooltipCallbacks.indexOf(callback);
		if (index > -1) {
			globalTooltipCallbacks.splice(index, 1);
		}
	};
}

/**
 * Get current tooltip state
 */
export function getTooltipState(): TooltipState {
	return { ...globalTooltipState };
}

/**
 * Tooltip manager for external access
 */
export const tooltipManager: TooltipManager = {
	show: showTooltip,
	hide: hideTooltip,
	updatePosition: updateTooltipPosition,
	getState: getTooltipState
};

/**
 * Check if device supports hover (not touch-only)
 */
function supportsHover(): boolean {
	return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Svelte action for adding tooltips to elements
 */
export function useTooltip(
	node: HTMLElement,
	options: Partial<TooltipOptions> = {}
): ReturnType<TooltipAction> {
	let showTimeout: number | undefined;

	const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

	// Skip tooltip on touch devices if disabled
	if (mergedOptions.disableOnTouch && !supportsHover()) {
		return {};
	}

	function handleMouseEnter() {
		// Clear any pending show timeout
		if (showTimeout) {
			clearTimeout(showTimeout);
		}

		showTimeout = window.setTimeout(() => {
			const content = mergedOptions.content || mergedOptions.text || node.getAttribute('aria-label') || '';
			if (String(content).trim()) {
				showTooltip(node, { ...mergedOptions, content });
			}
			showTimeout = undefined;
		}, mergedOptions.showDelay);
	}

	function handleMouseLeave() {
		// Clear any pending show timeout
		if (showTimeout) {
			clearTimeout(showTimeout);
			showTimeout = undefined;
		}

		// Smart debouncing: Only hide if this element is the current target
		// and no new element will show a tooltip soon
		if (globalTooltipState.targetElement === node) {
			// Add a small delay to allow for seamless transitions between tooltips
			setTimeout(() => {
				// Check again if this element is still the active target after delay
				if (globalTooltipState.targetElement === node) {
					hideTooltip();
				}
			}, 50); // Small delay for tooltip switching
		}
	}

	function handleFocus() {
		handleMouseEnter();
	}

	function handleBlur() {
		handleMouseLeave();
	}

	// Add event listeners
	node.addEventListener('mouseenter', handleMouseEnter);
	node.addEventListener('mouseleave', handleMouseLeave);
	node.addEventListener('focus', handleFocus);
	node.addEventListener('blur', handleBlur);

	return {
		update(newOptions: Partial<TooltipOptions>) {
			Object.assign(mergedOptions, newOptions);
		},
		destroy() {
			if (showTimeout) {
				clearTimeout(showTimeout);
				showTimeout = undefined;
			}

			node.removeEventListener('mouseenter', handleMouseEnter);
			node.removeEventListener('mouseleave', handleMouseLeave);
			node.removeEventListener('focus', handleFocus);
			node.removeEventListener('blur', handleBlur);

			// Hide tooltip immediately if this element was showing it
			if (globalTooltipState.targetElement === node) {
				hideTooltipImmediate();
			}
		}
	};
}

/**
 * Initialize global tooltip system for aria-label elements
 */
export function initializeGlobalTooltips(): () => void {
	// Skip on touch devices if desired
	if (!supportsHover()) {
		return () => {};
	}

	const observer = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					const element = node as Element;

					// Find all elements with aria-label (including the node itself)
					const elements = [
						...(element.hasAttribute('aria-label') ? [element] : []),
						...element.querySelectorAll('[aria-label]:not(.no-tooltip)')
					];

					elements.forEach((el) => {
						if (
							!el.classList.contains('no-tooltip') &&
							!el.hasAttribute('data-tooltip-initialized')
						) {
							el.setAttribute('data-tooltip-initialized', 'true');
							(useTooltip as any)(el);
						}
					});
				}
			});
		});
	});

	// Initialize existing elements
	const existingElements = document.querySelectorAll('[aria-label]:not(.no-tooltip)');
	existingElements.forEach((el) => {
		if (!el.hasAttribute('data-tooltip-initialized')) {
			el.setAttribute('data-tooltip-initialized', 'true');
			(useTooltip as any)(el);
		}
	});

	// Start observing
	observer.observe(document.body, {
		childList: true,
		subtree: true
	});

	// Window resize handler for position updates
	const handleResize = () => updateTooltipPosition();
	window.addEventListener('resize', handleResize);
	window.addEventListener('scroll', handleResize, true);

	// Cleanup function
	return () => {
		observer.disconnect();
		window.removeEventListener('resize', handleResize);
		window.removeEventListener('scroll', handleResize, true);
		hideTooltipImmediate();
	};
}
