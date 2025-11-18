/**
 * Mock for SvelteKit's $app/stores module
 * Used in tests to mock SvelteKit stores
 */

import { readable, writable } from 'svelte/store';

// Mock page store
export const page = readable({
	url: new URL('http://localhost:3000'),
	params: {},
	route: {
		id: null
	},
	status: 200,
	error: null,
	data: {},
	state: {},
	form: undefined
});

// Mock navigating store
export const navigating = readable(null);

// Mock updated store
export const updated = writable(false);
