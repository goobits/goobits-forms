/**
 * Mock for SvelteKit's $app/navigation module
 * Used in tests to mock SvelteKit navigation functions
 */

import { vi } from 'vitest';

// Mock goto function
export const goto = vi.fn((_url: string | URL, _options?: { replaceState?: boolean; noScroll?: boolean; keepFocus?: boolean; invalidateAll?: boolean; state?: any }) => Promise.resolve());

// Mock invalidate function
export const invalidate = vi.fn((_resource: string | URL | ((url: URL) => boolean)) => Promise.resolve());

// Mock invalidateAll function
export const invalidateAll = vi.fn(() => Promise.resolve());

// Mock preloadData function
export const preloadData = vi.fn((_url: string | URL) => Promise.resolve({ type: 'loaded' as const, status: 200, data: {} }));

// Mock preloadCode function
export const preloadCode = vi.fn((..._urls: string[]) => Promise.resolve());

// Mock beforeNavigate function
export const beforeNavigate = vi.fn((_callback: (navigation: any) => void) => {});

// Mock afterNavigate function
export const afterNavigate = vi.fn((_callback: (navigation: any) => void) => {});

// Mock disableScrollHandling function
export const disableScrollHandling = vi.fn();

// Mock pushState function
export const pushState = vi.fn((_url: string | URL, _state: any) => {});

// Mock replaceState function
export const replaceState = vi.fn((_url: string | URL, _state: any) => {});
