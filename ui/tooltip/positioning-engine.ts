/**
 * Advanced Tooltip Positioning Engine
 *
 * Provides sophisticated positioning logic with:
 * - Real dimension measurement
 * - Edge detection and automatic flipping
 * - RTL/LTR direction support
 * - Distance-based animation control
 * - Multi-pass positioning algorithm
 */

import type { TooltipPosition } from './tooltip.types.js';

export interface PositionCalculation {
  position: TooltipPosition;
  finalPosition: 'top' | 'bottom' | 'left' | 'right';
  arrowPosition: { x: number; y: number };
  direction: 'ltr' | 'rtl';
  actualDimensions: { width: number; height: number };
  disableTransition: boolean;
  arrowVisible: boolean;
  arrowRotation?: number;
}

export interface PositionOptions {
  targetElement: HTMLElement;
  tooltipElement?: HTMLElement;
  preferredPosition?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  offset?: number;
  stickToEdge?: boolean | string | { x: number; y: number };
  pointBasedPosition?: { x: number; y: number } | null;
  lastPosition?: { x: number; y: number };
}

const ARROW_WIDTH = 7;
const ARROW_HEIGHT = 7;
const DISPLACEMENT_THRESHOLD = 150;
const MIN_VIEWPORT_MARGIN = 8;
const ARROW_MARGIN = 12; // Minimum distance from tooltip edges
const ARROW_MAX_OFFSET = 100; // Maximum offset before hiding arrow

/**
 * Get the computed direction (RTL/LTR) for positioning calculations
 */
export function getDirection(element: HTMLElement): 'ltr' | 'rtl' {
  return window.getComputedStyle(element).direction as 'ltr' | 'rtl' || 'ltr';
}

/**
 * Measure actual tooltip dimensions after content is rendered
 */
export function measureTooltipDimensions(tooltipElement: HTMLElement): { width: number; height: number } {
  if (!tooltipElement) {
    return { width: 200, height: 40 }; // Fallback estimates
  }

  // Temporarily make visible to measure
  const originalStyle = {
    visibility: tooltipElement.style.visibility,
    position: tooltipElement.style.position,
    left: tooltipElement.style.left,
    top: tooltipElement.style.top
  };

  tooltipElement.style.visibility = 'hidden';
  tooltipElement.style.position = 'fixed';
  tooltipElement.style.left = '-9999px';
  tooltipElement.style.top = '-9999px';

  const rect = tooltipElement.getBoundingClientRect();
  const dimensions = {
    width: rect.width || tooltipElement.offsetWidth,
    height: rect.height || tooltipElement.offsetHeight
  };

  // Restore original styles
  Object.assign(tooltipElement.style, originalStyle);

  return dimensions;
}

/**
 * Calculate if movement distance should disable transitions
 */
export function shouldDisableTransition(
  currentPos: { x: number; y: number },
  lastPos?: { x: number; y: number }
): boolean {
  if (!lastPos) return false;

  const distance = Math.sqrt(
    Math.pow(currentPos.x - lastPos.x, 2) +
    Math.pow(currentPos.y - lastPos.y, 2)
  );

  return distance > DISPLACEMENT_THRESHOLD;
}

/**
 * Calculate viewport boundaries with margins
 */
export function getViewportBounds() {
  return {
    left: MIN_VIEWPORT_MARGIN,
    top: MIN_VIEWPORT_MARGIN,
    right: window.innerWidth - MIN_VIEWPORT_MARGIN,
    bottom: window.innerHeight - MIN_VIEWPORT_MARGIN,
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX,
    scrollY: window.scrollY
  };
}

/**
 * Test if a position fits within viewport bounds
 */
function positionFitsInViewport(
  pos: { x: number; y: number },
  dimensions: { width: number; height: number },
  viewport: ReturnType<typeof getViewportBounds>
): boolean {
  return (
    pos.x >= viewport.left &&
    pos.y >= viewport.top &&
    pos.x + dimensions.width <= viewport.right &&
    pos.y + dimensions.height <= viewport.bottom
  );
}

/**
 * Calculate positions for all four directions
 */
function calculateAllPositions(
  targetRect: DOMRect,
  dimensions: { width: number; height: number },
  offset: number
) {
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  return {
    top: {
      x: targetCenterX - dimensions.width / 2,
      y: targetRect.top - dimensions.height - offset
    },
    bottom: {
      x: targetCenterX - dimensions.width / 2,
      y: targetRect.bottom + offset
    },
    left: {
      x: targetRect.left - dimensions.width - offset,
      y: targetCenterY - dimensions.height / 2
    },
    right: {
      x: targetRect.right + offset,
      y: targetCenterY - dimensions.height / 2
    }
  };
}

/**
 * Apply viewport constraints to position
 */
function constrainToViewport(
  position: { x: number; y: number },
  dimensions: { width: number; height: number },
  viewport: ReturnType<typeof getViewportBounds>
): { x: number; y: number } {
  return {
    x: Math.max(viewport.left, Math.min(position.x, viewport.right - dimensions.width)),
    y: Math.max(viewport.top, Math.min(position.y, viewport.bottom - dimensions.height))
  };
}

/**
 * Calculate optimal arrow position and visibility
 */
function calculateAdvancedArrowPosition(
  finalPosition: 'top' | 'bottom' | 'left' | 'right',
  tooltipPos: { x: number; y: number },
  targetRect: DOMRect,
  dimensions: { width: number; height: number },
  direction: 'ltr' | 'rtl'
): { x: number; y: number; visible: boolean; rotation?: number } {
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;

  let arrowPos = { x: 0, y: 0 };
  let visible = true;

  // Calculate where the arrow should point to (target center)
  // relative to the tooltip position
  switch (finalPosition) {
    case 'top':
      // Tooltip is above target, arrow points down from bottom of tooltip
      arrowPos.x = Math.max(ARROW_MARGIN, Math.min(
        targetCenterX - tooltipPos.x - ARROW_WIDTH / 2,
        dimensions.width - ARROW_MARGIN - ARROW_WIDTH
      ));
      arrowPos.y = dimensions.height - ARROW_HEIGHT / 2; // Bottom edge
      break;

    case 'bottom':
      // Tooltip is below target, arrow points up from top of tooltip
      arrowPos.x = Math.max(ARROW_MARGIN, Math.min(
        targetCenterX - tooltipPos.x - ARROW_WIDTH / 2,
        dimensions.width - ARROW_MARGIN - ARROW_WIDTH
      ));
      arrowPos.y = -ARROW_HEIGHT / 2; // Top edge
      break;

    case 'left':
      // Tooltip is to the left of target, arrow points right from right edge
      arrowPos.x = dimensions.width - ARROW_WIDTH / 2; // Right edge
      arrowPos.y = Math.max(ARROW_MARGIN, Math.min(
        targetCenterY - tooltipPos.y - ARROW_HEIGHT / 2,
        dimensions.height - ARROW_MARGIN - ARROW_HEIGHT
      ));
      break;

    case 'right':
      // Tooltip is to the right of target, arrow points left from left edge
      arrowPos.x = -ARROW_WIDTH / 2; // Left edge
      arrowPos.y = Math.max(ARROW_MARGIN, Math.min(
        targetCenterY - tooltipPos.y - ARROW_HEIGHT / 2,
        dimensions.height - ARROW_MARGIN - ARROW_HEIGHT
      ));
      break;
  }

  // Check if arrow would be too far off-center (looks disconnected)
  const tooltipCenterX = tooltipPos.x + dimensions.width / 2;
  const tooltipCenterY = tooltipPos.y + dimensions.height / 2;
  const distanceFromTarget = Math.sqrt(
    Math.pow(targetCenterX - tooltipCenterX, 2) +
    Math.pow(targetCenterY - tooltipCenterY, 2)
  );

  // Hide arrow if target is too far away
  if (distanceFromTarget > 200) {
    visible = false;
  }

  return { x: arrowPos.x, y: arrowPos.y, visible };
}

/**
 * Handle point-based positioning (e.g., mouse coordinates)
 */
function calculatePointBasedPosition(
  point: { x: number; y: number },
  dimensions: { width: number; height: number },
  direction: 'ltr' | 'rtl',
  stickToEdge: boolean | string | { x: number; y: number }
): { x: number; y: number } {
  let x = point.x;
  let y = point.y - dimensions.height / 2;

  if (direction === 'ltr') {
    x += 5; // Small offset so cursor doesn't cover tooltip
  } else {
    x -= dimensions.width + 5;
  }

  // Handle stickToEdge variations
  if (typeof stickToEdge === 'string') {
    switch (stickToEdge) {
      case 'top':
        y = 0;
        break;
      case 'left':
        x = 0;
        break;
    }
  } else if (typeof stickToEdge === 'object' && stickToEdge !== null) {
    if (typeof stickToEdge.x === 'number') x = stickToEdge.x;
    if (typeof stickToEdge.y === 'number') y = stickToEdge.y;
  }

  return { x, y };
}

/**
 * Main positioning calculation with multi-pass algorithm
 */
export function calculateAdvancedPosition(options: PositionOptions): PositionCalculation {
  const {
    targetElement,
    tooltipElement,
    preferredPosition = 'auto',
    offset = 8,
    stickToEdge = false,
    pointBasedPosition = null,
    lastPosition
  } = options;

  // Get direction and dimensions
  const direction = getDirection(targetElement);
  const dimensions = tooltipElement
    ? measureTooltipDimensions(tooltipElement)
    : { width: 200, height: 40 };

  const viewport = getViewportBounds();

  // Handle point-based positioning
  if (pointBasedPosition) {
    const pointPos = calculatePointBasedPosition(
      pointBasedPosition,
      dimensions,
      direction,
      stickToEdge
    );

    const constrainedPos = constrainToViewport(pointPos, dimensions, viewport);
    const disableTransition = shouldDisableTransition(constrainedPos, lastPosition);

    return {
      position: constrainedPos,
      finalPosition: direction === 'ltr' ? 'right' : 'left',
      arrowPosition: { x: 0, y: 0 }, // No arrow for point-based
      direction,
      actualDimensions: dimensions,
      disableTransition,
      arrowVisible: false, // Point-based positioning doesn't use arrows
      arrowRotation: undefined
    };
  }

  // Element-based positioning
  const targetRect = targetElement.getBoundingClientRect();
  const allPositions = calculateAllPositions(targetRect, dimensions, offset);

  // Test which positions fit in viewport
  const fits = {
    top: positionFitsInViewport(allPositions.top, dimensions, viewport),
    bottom: positionFitsInViewport(allPositions.bottom, dimensions, viewport),
    left: positionFitsInViewport(allPositions.left, dimensions, viewport),
    right: positionFitsInViewport(allPositions.right, dimensions, viewport)
  };

  // Determine final position with intelligent fallback
  let finalPosition: 'top' | 'bottom' | 'left' | 'right';

  if (preferredPosition !== 'auto') {
    // Use preferred position if it fits, otherwise find best fallback
    if (fits[preferredPosition]) {
      finalPosition = preferredPosition;
    } else {
      // Find the best fallback based on available space
      if (fits.top) finalPosition = 'top';
      else if (fits.bottom) finalPosition = 'bottom';
      else if (fits.right) finalPosition = 'right';
      else if (fits.left) finalPosition = 'left';
      else finalPosition = preferredPosition; // Force preferred even if it doesn't fit
    }
  } else {
    // Auto-select best position with intelligent preference
    if (fits.top) finalPosition = 'top';
    else if (fits.bottom) finalPosition = 'bottom';
    else if (direction === 'ltr' && fits.right) finalPosition = 'right';
    else if (direction === 'rtl' && fits.left) finalPosition = 'left';
    else if (fits.right) finalPosition = 'right';
    else if (fits.left) finalPosition = 'left';
    else finalPosition = 'top'; // Fallback
  }

  // Get final position and constrain to viewport
  let finalPos = allPositions[finalPosition];
  const constrainedPos = constrainToViewport(finalPos, dimensions, viewport);

  // Calculate advanced arrow position with visibility
  const arrowCalculation = calculateAdvancedArrowPosition(
    finalPosition,
    constrainedPos,
    targetRect,
    dimensions,
    direction
  );

  // Check if transitions should be disabled
  const disableTransition = shouldDisableTransition(constrainedPos, lastPosition);

  return {
    position: constrainedPos,
    finalPosition,
    arrowPosition: { x: arrowCalculation.x, y: arrowCalculation.y },
    direction,
    actualDimensions: dimensions,
    disableTransition,
    arrowVisible: arrowCalculation.visible,
    arrowRotation: arrowCalculation.rotation
  };
}