/**
 * Simple debounce implementation for rate-limiting function calls
 *
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=300] - Delay in milliseconds
 * @returns {Function} Debounced function that will only execute after delay has elapsed
 * @throws {TypeError} If fn is not a function or delay is not a number
 */
export function debounce(fn, delay = 300) {
  if (typeof fn !== "function") {
    throw new TypeError("First argument must be a function");
  }

  if (typeof delay !== "number" || isNaN(delay)) {
    throw new TypeError("Delay must be a number");
  }

  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}
