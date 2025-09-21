/**
 * Simple debounce implementation for rate-limiting function calls
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function that will only execute after delay has elapsed
 * @throws TypeError If fn is not a function or delay is not a number
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay?: number): (...args: Parameters<T>) => void;
