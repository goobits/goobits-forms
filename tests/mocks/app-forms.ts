/**
 * Mock for SvelteKit's $app/forms module
 * Used in tests to mock SvelteKit form actions
 */

import { vi } from 'vitest';

// Mock enhance function
export const enhance = vi.fn((_form: HTMLFormElement, _submit?: (input: { action: URL; formData: FormData; formElement: HTMLFormElement; controller: AbortController; submitter: HTMLElement | null; cancel: () => void }) => void | Promise<void>) => {
	return {
		destroy: () => {}
	};
});

// Mock applyAction function
export const applyAction = vi.fn(async (_result: any) => {});

// Mock deserialize function
export const deserialize = vi.fn(async (_result: string) => ({ type: 'success' as const, status: 200, data: {} }));
