/**
 * Global type augmentations for tooltip system
 */

// Override setTimeout return type to be compatible with browser setTimeout
declare global {
	function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
	function clearTimeout(id: number | undefined): void;
}

export {};
