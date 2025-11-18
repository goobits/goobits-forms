/**
 * Global Tooltip Manager (Sketchpad-style)
 *
 * Singleton tooltip manager implementing all Sketchpad tooltip features
 */

import type {
	TooltipOptions,
	TooltipState,
	TooltipContent,
	TooltipManager as TooltipManagerType
} from './tooltip.types.js';

import { calculateAdvancedPosition } from './positioning-engine.js';

// Global state
let _globalEnabled = true;
let _tooltipElement: HTMLElement | null = null;
let _currentState: TooltipState | null = null;
let _stateCallbacks: Array<(state: TooltipState) => void> = [];
let _hideCallbacks: Array<() => void> = [];
const _attachedEvents: Map<string, () => void> = new Map();

// Timers
let _showTimer: number | undefined;
let _hideTimer: number | undefined;
let _autoHideTimer: number | undefined;
let _transitionTimer: number | undefined;

// Constants
const SHOW_DELAY = 500;
const HIDE_DELAY = 250;
const TRANSITION_DURATION = 150;
const DISTANCE_THRESHOLD = 150;

/**
 * Initialize state with defaults
 */
function createDefaultState(): TooltipState {
	return {
		visible: false,
		transitioning: false,
		position: { x: 0, y: 0 },
		content: '',
		targetElement: null,
		finalPosition: 'top',
		arrowPosition: { x: 0, y: 0 },
		direction: 'ltr',
		actualDimensions: { width: 0, height: 0 },
		disableTransition: false,
		allowPointerEvents: false,
		arrowVisible: true,
		arrowRotation: undefined,
		showMode: 'hover',
		hideCallbacks: [],
		stickToEdge: false,
		rotation: 0
	};
}

/**
 * Process content - handle functions, elements, and strings
 */
function processContent(content: TooltipContent, event?: Event): string | HTMLElement {
	if (typeof content === 'function') {
		return processContent(content(event), event);
	}

	if (!content) {
		return '';
	}

	return content;
}

/**
 * Notify all state subscribers
 */
function notifyStateChange(): void {
	if (_currentState) {
		_stateCallbacks.forEach((callback) => callback(_currentState!));
	}
}

/**
 * Create tooltip element if needed
 */
/* function ensureTooltipElement(): HTMLElement {
	if (!_tooltipElement) {
		// Let the Svelte component create and manage the element
		// This will be set by the TooltipPortal component
		return document.createElement('div');
	}
	return _tooltipElement;
} */

/**
 * Calculate position from event or element
 */
function calculatePosition(
	options: TooltipOptions,
	event?: Event
): {
	position: { x: number; y: number };
	finalPosition: 'top' | 'bottom' | 'left' | 'right';
	arrowPosition: { x: number; y: number };
	arrowVisible: boolean;
} {
	// If we have a mouse event, use its position
	if (event && 'pageX' in event) {
		const mouseEvent = event as MouseEvent;
		const point = { x: mouseEvent.pageX, y: mouseEvent.pageY };

		// Handle stick to edge for point-based positioning
		if (options.stickToEdge === 'top' || options.stickToEdge === 'bottom') {
			point.y = options.stickToEdge === 'top' ? 0 : window.innerHeight;
		} else if (options.stickToEdge === 'left' || options.stickToEdge === 'right') {
			point.x = options.stickToEdge === 'left' ? 0 : window.innerWidth;
		}

		return calculateAdvancedPosition({
			targetElement: null as any,
			tooltipElement: _tooltipElement ?? undefined,
			preferredPosition: options.position,
			offset: options.offset,
			stickToEdge: options.stickToEdge,
			pointBasedPosition: point,
			lastPosition: _currentState?.position
		});
	}

	// Element-based positioning
	if (_currentState?.targetElement) {
		return calculateAdvancedPosition({
			targetElement: _currentState.targetElement,
			tooltipElement: _tooltipElement ?? undefined,
			preferredPosition: options.position,
			offset: options.offset,
			stickToEdge: options.stickToEdge,
			pointBasedPosition: options.pointBasedPosition,
			lastPosition: _currentState?.position
		});
	}

	// Fallback
	return {
		position: { x: 0, y: 0 },
		finalPosition: 'top',
		arrowPosition: { x: 0, y: 0 },
		arrowVisible: false
	};
}

/**
 * Show tooltip implementation
 */
function showTooltipInternal(
	elementOrOptions: HTMLElement | TooltipOptions,
	options?: TooltipOptions,
	event?: Event
): void {
	if (!_globalEnabled) {
		return;
	}

	// Clear timers
	if (_hideTimer) {
		clearTimeout(_hideTimer);
		_hideTimer = undefined;
	}

	if (_autoHideTimer) {
		clearTimeout(_autoHideTimer);
		_autoHideTimer = undefined;
	}

	// Parse arguments
	let targetElement: HTMLElement | null = null;
	let tooltipOptions: TooltipOptions = {};

	if (elementOrOptions instanceof HTMLElement) {
		targetElement = elementOrOptions;
		tooltipOptions = options || {};
	} else {
		tooltipOptions = elementOrOptions;
		targetElement = _currentState?.targetElement || null;
	}

	// Process content
	const content = processContent(tooltipOptions.content || tooltipOptions.text || '', event);

	if (!content) {
		hideTooltipInternal();
		return;
	}

	// Calculate new position
	const positionInfo = calculatePosition(tooltipOptions, event);

	// Check if we should disable transition based on distance
	let disableTransition = false;
	if (_currentState?.visible && _currentState.position) {
		const distance = Math.sqrt(
			Math.pow(positionInfo.position.x - _currentState.position.x, 2) +
				Math.pow(positionInfo.position.y - _currentState.position.y, 2)
		);
		disableTransition = distance > DISTANCE_THRESHOLD;
	}

	// Update state
	if (!_currentState) {
		_currentState = createDefaultState();
	}

	_currentState = {
		..._currentState,
		visible: true,
		transitioning: false,
		content,
		targetElement,
		position: positionInfo.position,
		finalPosition: positionInfo.finalPosition,
		arrowPosition: positionInfo.arrowPosition,
		arrowVisible: positionInfo.arrowVisible,
		disableTransition,
		allowPointerEvents: tooltipOptions.allowPointerEvents || false,
		showMode: tooltipOptions.showOnClick ? 'click' : 'hover',
		stickToEdge: tooltipOptions.stickToEdge,
		rotation: tooltipOptions.rotation || 0,
		direction: document.dir === 'rtl' ? 'rtl' : 'ltr'
	};

	notifyStateChange();

	// Handle auto-hide
	if (tooltipOptions.autoHideAfter && tooltipOptions.autoHideAfter > 0) {
		_autoHideTimer = setTimeout(() => {
			hideTooltipInternal();
		}, tooltipOptions.autoHideAfter);
	}
}

/**
 * Hide tooltip implementation
 */
function hideTooltipInternal(callback?: () => void): void {
	if (callback) {
		_hideCallbacks.push(callback);
	}

	if (!_currentState?.visible) {
		// Execute callbacks immediately if already hidden
		executeHideCallbacks();
		return;
	}

	// Start hide transition
	_currentState = {
		..._currentState,
		visible: false,
		transitioning: true
	};

	notifyStateChange();

	// After transition completes
	_transitionTimer = setTimeout(() => {
		if (_currentState) {
			_currentState.transitioning = false;
			_currentState.visible = false;
			notifyStateChange();
		}
		executeHideCallbacks();
	}, TRANSITION_DURATION);
}

/**
 * Execute and clear hide callbacks
 */
function executeHideCallbacks(): void {
	const callbacks = [..._hideCallbacks];
	_hideCallbacks = [];
	callbacks.forEach((cb) => cb());
}

/**
 * Global tooltip manager instance
 */
export const TooltipManager: TooltipManagerType = {
	show(elementOrOptions: HTMLElement | TooltipOptions, options?: TooltipOptions): void {
		// Clear show timer if exists
		if (_showTimer) {
			clearTimeout(_showTimer);
		}

		const delay = options?.showDelay ?? (elementOrOptions instanceof HTMLElement ? SHOW_DELAY : 0);

		if (delay > 0) {
			_showTimer = setTimeout(() => {
				showTooltipInternal(elementOrOptions, options);
			}, delay);
		} else {
			showTooltipInternal(elementOrOptions, options);
		}
	},

	hide(callback?: () => void): void {
		// Clear show timer if exists
		if (_showTimer) {
			clearTimeout(_showTimer);
			_showTimer = undefined;
		}

		// Throttle hide
		if (_hideTimer) {
			if (callback) {
				_hideCallbacks.push(callback);
			}
			return;
		}

		_hideTimer = setTimeout(() => {
			_hideTimer = undefined;
			hideTooltipInternal(callback);
		}, HIDE_DELAY);
	},

	updatePosition(): void {
		if (_currentState?.visible && _currentState.targetElement) {
			const positionInfo = calculatePosition({}, undefined);
			_currentState = {
				..._currentState,
				position: positionInfo.position,
				finalPosition: positionInfo.finalPosition,
				arrowPosition: positionInfo.arrowPosition,
				arrowVisible: positionInfo.arrowVisible
			};
			notifyStateChange();
		}
	},

	getState(): TooltipState {
		return _currentState || createDefaultState();
	},

	ping(state?: TooltipState): void {
		if (_globalEnabled && (_currentState?.visible || state)) {
			this.updatePosition();
		}
	},

	destroy(): void {
		// Clear all timers
		if (_showTimer) clearTimeout(_showTimer);
		if (_hideTimer) clearTimeout(_hideTimer);
		if (_autoHideTimer) clearTimeout(_autoHideTimer);
		if (_transitionTimer) clearTimeout(_transitionTimer);

		// Clear event listeners
		_attachedEvents.forEach((detach) => detach());
		_attachedEvents.clear();

		// Reset state
		_currentState = null;
		_tooltipElement = null;
		_hideCallbacks = [];
		_stateCallbacks = [];

		notifyStateChange();
	},

	get enabled(): boolean {
		return _globalEnabled;
	},

	setEnabled(enabled: boolean): void {
		_globalEnabled = enabled;
		if (!enabled) {
			this.hide();
		}
	}
};

/**
 * Subscribe to state changes
 */
export function subscribeToTooltipState(callback: (state: TooltipState) => void): () => void {
	_stateCallbacks.push(callback);

	// Return unsubscribe function
	return () => {
		const index = _stateCallbacks.indexOf(callback);
		if (index > -1) {
			_stateCallbacks.splice(index, 1);
		}
	};
}

/**
 * Set the tooltip element (called by TooltipPortal component)
 */
export function setTooltipElement(element: HTMLElement | null): void {
	_tooltipElement = element;

	// Update dimensions if we have a current state
	if (element && _currentState) {
		_currentState.actualDimensions = {
			width: element.offsetWidth,
			height: element.offsetHeight
		};
	}
}

/**
 * Enhanced tooltip action with all Sketchpad features
 */
export function tooltip(
	node: HTMLElement,
	options: TooltipOptions = {}
): {
	update: (newOptions: TooltipOptions) => void;
	destroy: () => void;
} {
	let currentOptions = { ...options };
	let clickHandler: ((event: Event) => void) | null = null;
	let hoverHandler: ((event: Event) => void) | null = null;
	let leaveHandler: ((event: MouseEvent) => void) | null = null;
	let isClickMode = false;

	// Click handler
	if (options.showOnClick) {
		clickHandler = (event: Event) => {
			event.stopPropagation();

			if (!isClickMode) {
				// Show tooltip
				isClickMode = true;
				TooltipManager.show(node, {
					...currentOptions,
					showDelay: 0
				});

				// Add document click listener to hide
				const documentClick = (e: Event) => {
					const target = e.target as HTMLElement;

					// Check if click is outside tooltip and trigger element
					if (!node.contains(target) && !target.closest('[role="tooltip"]')) {
						document.removeEventListener('click', documentClick, true);
						isClickMode = false;
						TooltipManager.hide();
					}
				};

				// Add listener after a delay to prevent immediate closing
				setTimeout(() => {
					document.addEventListener('click', documentClick, true);
				}, 0);
			}
		};

		node.addEventListener('click', clickHandler);
	}

	// Hover handlers
	if (options.showOnHover !== false) {
		hoverHandler = (event: Event) => {
			if (!isClickMode && !document.hasFocus?.() !== false) {
				event.stopPropagation();
				TooltipManager.show(node, currentOptions);
			}
		};

		leaveHandler = (event: MouseEvent) => {
			if (!isClickMode) {
				const relatedTarget = event.relatedTarget as HTMLElement;
				if (!node.contains(relatedTarget)) {
					event.stopPropagation();
					TooltipManager.hide();
				}
			}
		};

		node.addEventListener('mouseenter', hoverHandler);
		node.addEventListener('mouseleave', leaveHandler);
	}

	return {
		update(newOptions: TooltipOptions) {
			currentOptions = { ...newOptions };

			// Update handlers if needed
			if (newOptions.showOnClick !== options.showOnClick) {
				// Re-setup handlers
				if (clickHandler) {
					node.removeEventListener('click', clickHandler);
					clickHandler = null;
				}
				if (newOptions.showOnClick) {
					// Add click handler
					clickHandler = () => {
						TooltipManager.show(node, currentOptions);
					};
					node.addEventListener('click', clickHandler);
				}
			}
		},

		destroy() {
			if (clickHandler) {
				node.removeEventListener('click', clickHandler);
			}
			if (hoverHandler) {
				node.removeEventListener('mouseenter', hoverHandler);
			}
			if (leaveHandler) {
				node.removeEventListener('mouseleave', leaveHandler);
			}

			// Hide tooltip if it's showing for this element
			if (TooltipManager.getState().targetElement === node) {
				TooltipManager.hide();
			}
		}
	};
}

// Export as default for backward compatibility
export default tooltip;
