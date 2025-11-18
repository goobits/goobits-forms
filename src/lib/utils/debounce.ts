/**
 * Simple debounce implementation for rate-limiting function calls
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function that will only execute after delay has elapsed
 * @throws TypeError If fn is not a function or delay is not a number
 */
export function debounce<T extends (...args: any[]) => any>(
	fn: T,
	delay: number = 300
): (...args: Parameters<T>) => void {
	if (typeof fn !== 'function') {
		throw new TypeError('First argument must be a function');
	}

	if (typeof delay !== 'number' || isNaN(delay)) {
		throw new TypeError('Delay must be a number');
	}

	let timeoutId: ReturnType<typeof setTimeout> | undefined;

	return function (this: ThisParameterType<T>, ...args: Parameters<T>): void {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => fn.apply(this, args), delay);
	};
}
