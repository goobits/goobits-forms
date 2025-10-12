/**
 * Tooltip System Types
 *
 * TypeScript interfaces for the Portal-based tooltip system
 */

export interface TooltipPosition {
	x: number;
	y: number;
	rotation?: number;
}

/** Content can be a string, HTML element, or a function that returns content */
export type TooltipContent = string | HTMLElement | ((event?: Event) => string | HTMLElement);

export interface TooltipOptions {
	/** The content to display in the tooltip */
	content?: TooltipContent;
	/** @deprecated Use content instead */
	text?: string;
	/** Position preference - will auto-adjust if tooltip would be clipped */
	position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
	/** Offset from the target element in pixels */
	offset?: number;
	/** Delay before showing tooltip in milliseconds */
	showDelay?: number;
	/** Delay before hiding tooltip in milliseconds */
	hideDelay?: number;
	/** Whether to disable the tooltip on touch devices */
	disableOnTouch?: boolean;
	/** Custom CSS classes to apply to the tooltip */
	className?: string;
	/** Whether to allow pointer events on the tooltip (makes it interactive) */
	allowPointerEvents?: boolean;
	/** Stick tooltip to viewport edge or specific coordinates */
	stickToEdge?: boolean | 'top' | 'left' | 'right' | 'bottom' | { x: number; y: number };
	/** Use point-based positioning instead of element-based */
	pointBasedPosition?: { x: number; y: number } | null;
	/** Show tooltip on click instead of hover */
	showOnClick?: boolean;
	/** Show tooltip on hover (default true) */
	showOnHover?: boolean;
	/** Auto-hide tooltip after X milliseconds (0 = disabled) */
	autoHideAfter?: number;
	/** Rotation angle in radians for the tooltip */
	rotation?: number;
}

export interface TooltipState {
	/** Whether the tooltip is currently visible */
	visible: boolean;
	/** Whether the tooltip is currently transitioning (fading in/out) */
	transitioning: boolean;
	/** Current position of the tooltip */
	position: TooltipPosition;
	/** The content being displayed */
	content: string | HTMLElement;
	/** @deprecated Use content instead */
	text?: string;
	/** Target element the tooltip is attached to */
	targetElement: HTMLElement | null;
	/** Calculated position preference after auto-adjustment */
	finalPosition: 'top' | 'bottom' | 'left' | 'right';
	/** Position of the arrow relative to the tooltip */
	arrowPosition: TooltipPosition;
	/** Text direction (RTL/LTR) for positioning calculations */
	direction: 'ltr' | 'rtl';
	/** Actual measured dimensions of the tooltip */
	actualDimensions: { width: number; height: number };
	/** Whether transitions should be disabled for this update */
	disableTransition: boolean;
	/** Whether pointer events are allowed on the tooltip */
	allowPointerEvents: boolean;
	/** Whether the arrow should be visible */
	arrowVisible: boolean;
	/** Optional rotation angle for the arrow in degrees */
	arrowRotation?: number;
	/** Show mode - click or hover */
	showMode: 'hover' | 'click';
	/** Timer ID for auto-hide */
	autoHideTimer?: number;
	/** Callbacks to execute when tooltip hides */
	hideCallbacks: Array<() => void>;
	/** Stick to edge configuration */
	stickToEdge?: boolean | 'top' | 'left' | 'right' | 'bottom' | { x: number; y: number };
	/** Rotation angle in radians */
	rotation?: number;
}

export interface TooltipManager {
	/** Show a tooltip for the given element */
	show: (element: HTMLElement | TooltipOptions, options?: TooltipOptions) => void;
	/** Hide the currently visible tooltip */
	hide: (callback?: () => void) => void;
	/** Update the position of the current tooltip */
	updatePosition: () => void;
	/** Get the current tooltip state */
	getState: () => TooltipState;
	/** Ping - update position if tooltip is enabled */
	ping: (state?: TooltipState) => void;
	/** Destroy tooltip and clean up */
	destroy: () => void;
	/** Check if tooltips are globally enabled */
	readonly enabled: boolean;
	/** Enable/disable tooltips globally */
	setEnabled: (enabled: boolean) => void;
}

export type TooltipAction = (
	node: HTMLElement,
	options?: Partial<TooltipOptions>
) => {
	update?: (options: Partial<TooltipOptions>) => void;
	destroy?: () => void;
};
