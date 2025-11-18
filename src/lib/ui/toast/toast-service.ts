/**
 * Toast Service
 *
 * Provides a global store and API for managing toast notifications.
 * Supports multiple variants, auto-dismiss, and queue management.
 */

import { writable } from 'svelte/store';

/**
 * Toast variant types
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Toast position on screen
 */
export type ToastPosition =
	| 'top-left'
	| 'top-center'
	| 'top-right'
	| 'bottom-left'
	| 'bottom-center'
	| 'bottom-right';

/**
 * Action button configuration
 */
export interface ToastAction {
	label: string;
	onClick: () => void;
}

/**
 * Toast configuration
 */
export interface ToastConfig {
	id?: string;
	variant?: ToastVariant;
	title: string;
	message?: string;
	duration?: number; // milliseconds, 0 = no auto-dismiss
	dismissible?: boolean;
	action?: ToastAction;
	icon?: string;
	position?: ToastPosition;
}

/**
 * Internal toast representation
 */
export interface Toast {
	id: string;
	variant: ToastVariant;
	title: string;
	message?: string;
	duration: number;
	dismissible: boolean;
	action?: ToastAction;
	icon?: string;
	position: ToastPosition;
	createdAt: number;
}

/**
 * Generate unique ID for toasts
 */
function generateId(): string {
	return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default icons for each variant
 */
const DEFAULT_ICONS: Record<ToastVariant, string> = {
	info: 'ℹ️',
	success: '✓',
	warning: '⚠',
	error: '✕'
};

/**
 * Global toast store
 */
const createToastStore = () => {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		/**
		 * Add a toast to the store
		 */
		add: (config: ToastConfig): string => {
			const id = config.id || generateId();
			const toast: Toast = {
				id,
				variant: config.variant || 'info',
				title: config.title,
				message: config.message,
				duration: config.duration !== undefined ? config.duration : 5000,
				dismissible: config.dismissible !== undefined ? config.dismissible : true,
				action: config.action,
				icon: config.icon || DEFAULT_ICONS[config.variant || 'info'],
				position: config.position || 'top-right',
				createdAt: Date.now()
			};

			update((toasts) => [...toasts, toast]);
			return id;
		},
		/**
		 * Remove a toast by ID
		 */
		remove: (id: string) => {
			update((toasts) => toasts.filter((t) => t.id !== id));
		},
		/**
		 * Remove all toasts
		 */
		removeAll: () => {
			update(() => []);
		}
	};
};

/**
 * Global toast store instance
 */
export const toastStore = createToastStore();

/**
 * Toast API - Imperative methods for showing toasts
 */
export const toast = {
	/**
	 * Show a toast with custom configuration
	 */
	show: (config: ToastConfig): string => {
		return toastStore.add(config);
	},

	/**
	 * Show a success toast
	 */
	success: (title: string, message?: string, options?: Partial<ToastConfig>): string => {
		return toastStore.add({
			...options,
			variant: 'success',
			title,
			message
		});
	},

	/**
	 * Show an error toast
	 */
	error: (title: string, message?: string, options?: Partial<ToastConfig>): string => {
		return toastStore.add({
			...options,
			variant: 'error',
			title,
			message,
			duration: options?.duration !== undefined ? options.duration : 0 // Errors persist by default
		});
	},

	/**
	 * Show a warning toast
	 */
	warning: (title: string, message?: string, options?: Partial<ToastConfig>): string => {
		return toastStore.add({
			...options,
			variant: 'warning',
			title,
			message
		});
	},

	/**
	 * Show an info toast
	 */
	info: (title: string, message?: string, options?: Partial<ToastConfig>): string => {
		return toastStore.add({
			...options,
			variant: 'info',
			title,
			message
		});
	},

	/**
	 * Dismiss a toast by ID
	 */
	dismiss: (id: string): void => {
		toastStore.remove(id);
	},

	/**
	 * Dismiss all toasts
	 */
	dismissAll: (): void => {
		toastStore.removeAll();
	}
};
