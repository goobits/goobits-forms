/**
 * Comprehensive tests for Toast system
 *
 * Tests rendering, variants, auto-dismiss, manual dismiss, actions, progress bar,
 * multiple toasts, max toast limit, and API methods.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import Toast from './Toast.svelte';
import ToastContainer from './ToastContainer.svelte';
import ToastProvider from './ToastProvider.svelte';
import { toast, toastStore } from './toast-service';

describe('Toast Component', () => {
	beforeEach(() => {
		// Clear all toasts before each test
		toastStore.removeAll();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.clearAllTimers();
	});

	describe('Basic Rendering', () => {
		test('renders toast with title', () => {
			render(Toast, {
				props: {
					id: 'test-1',
					title: 'Test Toast'
				}
			});

			expect(screen.getByText('Test Toast')).toBeInTheDocument();
		});

		test('renders toast with title and message', () => {
			render(Toast, {
				props: {
					id: 'test-2',
					title: 'Success',
					message: 'Operation completed successfully'
				}
			});

			expect(screen.getByText('Success')).toBeInTheDocument();
			expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
		});

		test('renders with custom icon', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-3',
					title: 'Custom Icon',
					icon: '🎉'
				}
			});

			const icon = container.querySelector('.toast__icon');
			expect(icon).toHaveTextContent('🎉');
		});

		test('applies correct variant class', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-4',
					title: 'Success Toast',
					variant: 'success'
				}
			});

			const toast = container.querySelector('.toast');
			expect(toast).toHaveClass('toast--success');
		});
	});

	describe('Variants', () => {
		test.each(['info', 'success', 'warning', 'error'] as const)('renders %s variant', (variant) => {
			const { container } = render(Toast, {
				props: {
					id: `${variant}-1`,
					title: variant,
					variant
				}
			});

			expect(container.querySelector(`.toast--${variant}`)).toBeInTheDocument();
		});
	});

	describe('Auto-dismiss', () => {
		test('auto-dismisses after duration', async () => {
			// Use real timers for this test
			vi.useRealTimers();

			const handleDismiss = vi.fn();
			render(Toast, {
				props: {
					id: 'auto-1',
					title: 'Auto Dismiss',
					duration: 100, // Shorter duration for faster test
					ondismiss: handleDismiss
				}
			});

			expect(screen.getByText('Auto Dismiss')).toBeInTheDocument();

			// Wait for auto-dismiss
			await waitFor(
				() => {
					expect(handleDismiss).toHaveBeenCalled();
				},
				{ timeout: 500 }
			);

			// Restore fake timers
			vi.useFakeTimers();
		});

		test('does not auto-dismiss when duration is 0', async () => {
			const handleDismiss = vi.fn();
			render(Toast, {
				props: {
					id: 'persist-1',
					title: 'Persistent Toast',
					duration: 0,
					ondismiss: handleDismiss
				}
			});

			expect(screen.getByText('Persistent Toast')).toBeInTheDocument();

			// Fast-forward time
			vi.advanceTimersByTime(10000);

			// Should not dismiss
			expect(handleDismiss).not.toHaveBeenCalled();
		});

		test('shows progress bar when duration is set', () => {
			const { container } = render(Toast, {
				props: {
					id: 'progress-1',
					title: 'With Progress',
					duration: 5000
				}
			});

			const progressBar = container.querySelector('.toast__progress-bar');
			expect(progressBar).toBeInTheDocument();
		});

		test('does not show progress bar when duration is 0', () => {
			const { container } = render(Toast, {
				props: {
					id: 'no-progress-1',
					title: 'No Progress',
					duration: 0
				}
			});

			const progressBar = container.querySelector('.toast__progress-bar');
			expect(progressBar).not.toBeInTheDocument();
		});
	});

	describe('Manual Dismiss', () => {
		test('dismisses when close button is clicked', async () => {
			// Use real timers for this test
			vi.useRealTimers();

			const user = userEvent.setup({ delay: null });
			const handleDismiss = vi.fn();

			render(Toast, {
				props: {
					id: 'dismiss-1',
					title: 'Dismissible Toast',
					dismissible: true,
					ondismiss: handleDismiss
				}
			});

			const closeButton = screen.getByLabelText('Dismiss notification');
			await user.click(closeButton);

			// Wait for dismiss event
			await waitFor(() => {
				expect(handleDismiss).toHaveBeenCalled();
			});

			// Restore fake timers
			vi.useFakeTimers();
		});

		test('does not show close button when dismissible is false', () => {
			render(Toast, {
				props: {
					id: 'not-dismissible-1',
					title: 'Not Dismissible',
					dismissible: false
				}
			});

			const closeButton = screen.queryByLabelText('Dismiss notification');
			expect(closeButton).not.toBeInTheDocument();
		});

		test('dismisses when Escape key is pressed', async () => {
			// Use real timers for this test
			vi.useRealTimers();

			const handleDismiss = vi.fn();

			const { container } = render(Toast, {
				props: {
					id: 'escape-1',
					title: 'Press Escape',
					dismissible: true,
					ondismiss: handleDismiss
				}
			});

			const toast = container.querySelector('.toast');
			if (toast) {
				toast.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
			}

			// Wait for dismiss event
			await waitFor(() => {
				expect(handleDismiss).toHaveBeenCalled();
			});

			// Restore fake timers
			vi.useFakeTimers();
		});
	});

	describe('Action Button', () => {
		test('renders action button', () => {
			const handleAction = vi.fn();

			render(Toast, {
				props: {
					id: 'action-1',
					title: 'With Action',
					action: {
						label: 'Undo',
						onClick: handleAction
					}
				}
			});

			expect(screen.getByText('Undo')).toBeInTheDocument();
		});

		test('calls action onClick when clicked', async () => {
			// Use real timers for this test
			vi.useRealTimers();

			const user = userEvent.setup({ delay: null });
			const handleAction = vi.fn();
			const handleDismiss = vi.fn();

			render(Toast, {
				props: {
					id: 'action-2',
					title: 'With Action',
					action: {
						label: 'Retry',
						onClick: handleAction
					},
					ondismiss: handleDismiss
				}
			});

			const actionButton = screen.getByText('Retry');
			await user.click(actionButton);

			expect(handleAction).toHaveBeenCalled();

			// Action button click should also dismiss toast
			await waitFor(() => {
				expect(handleDismiss).toHaveBeenCalled();
			});

			// Restore fake timers
			vi.useFakeTimers();
		});
	});

	describe('Positions', () => {
		test('applies correct position class', () => {
			const { container } = render(Toast, {
				props: {
					id: 'pos-1',
					title: 'Positioned Toast',
					position: 'bottom-left'
				}
			});

			const toast = container.querySelector('.toast');
			expect(toast).toHaveClass('toast--bottom-left');
		});
	});
});

describe('Toast Service', () => {
	beforeEach(() => {
		toastStore.removeAll();
	});

	describe('Store Operations', () => {
		test('adds toast to store', () => {
			const id = toastStore.add({
				title: 'Test Toast'
			});

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].id).toBe(id);
			expect(toasts[0].title).toBe('Test Toast');
		});

		test('removes toast from store', () => {
			const id = toastStore.add({
				title: 'Remove Me'
			});

			expect(get(toastStore)).toHaveLength(1);

			toastStore.remove(id);

			expect(get(toastStore)).toHaveLength(0);
		});

		test('removes all toasts from store', () => {
			toastStore.add({ title: 'Toast 1' });
			toastStore.add({ title: 'Toast 2' });
			toastStore.add({ title: 'Toast 3' });

			expect(get(toastStore)).toHaveLength(3);

			toastStore.removeAll();

			expect(get(toastStore)).toHaveLength(0);
		});
	});

	describe('toast.success()', () => {
		test('creates success toast', () => {
			toast.success('Success!', 'Operation completed');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].variant).toBe('success');
			expect(toasts[0].title).toBe('Success!');
			expect(toasts[0].message).toBe('Operation completed');
		});
	});

	describe('toast.error()', () => {
		test('creates error toast', () => {
			toast.error('Error!', 'Something went wrong');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].variant).toBe('error');
			expect(toasts[0].title).toBe('Error!');
			expect(toasts[0].message).toBe('Something went wrong');
		});

		test('error toasts are persistent by default', () => {
			toast.error('Error!');

			const toasts = get(toastStore);
			expect(toasts[0].duration).toBe(0);
		});
	});

	describe('toast.warning()', () => {
		test('creates warning toast', () => {
			toast.warning('Warning!', 'Please be careful');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].variant).toBe('warning');
			expect(toasts[0].title).toBe('Warning!');
			expect(toasts[0].message).toBe('Please be careful');
		});
	});

	describe('toast.info()', () => {
		test('creates info toast', () => {
			toast.info('FYI', 'Here is some information');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(1);
			expect(toasts[0].variant).toBe('info');
			expect(toasts[0].title).toBe('FYI');
			expect(toasts[0].message).toBe('Here is some information');
		});
	});

	describe('toast.dismiss()', () => {
		test('dismisses toast by id', () => {
			const id = toast.success('Dismiss Me');

			expect(get(toastStore)).toHaveLength(1);

			toast.dismiss(id);

			expect(get(toastStore)).toHaveLength(0);
		});
	});

	describe('toast.dismissAll()', () => {
		test('dismisses all toasts', () => {
			toast.success('Toast 1');
			toast.error('Toast 2');
			toast.warning('Toast 3');

			expect(get(toastStore)).toHaveLength(3);

			toast.dismissAll();

			expect(get(toastStore)).toHaveLength(0);
		});
	});

	describe('Multiple Toasts', () => {
		test('stacks multiple toasts', () => {
			toast.info('Toast 1');
			toast.success('Toast 2');
			toast.warning('Toast 3');

			const toasts = get(toastStore);
			expect(toasts).toHaveLength(3);
			expect(toasts[0].title).toBe('Toast 1');
			expect(toasts[1].title).toBe('Toast 2');
			expect(toasts[2].title).toBe('Toast 3');
		});
	});
});

describe('ToastContainer', () => {
	beforeEach(() => {
		toastStore.removeAll();
	});

	test('renders active toasts', async () => {
		render(ToastContainer);

		toast.success('Toast 1');
		toast.error('Toast 2');

		// Wait for Portal to render
		await waitFor(() => {
			expect(screen.getByText('Toast 1')).toBeInTheDocument();
		});
		expect(screen.getByText('Toast 2')).toBeInTheDocument();
	});

	test('limits visible toasts to maxToasts', async () => {
		render(ToastContainer, { props: { maxToasts: 3 } });

		toast.info('Toast 1');
		toast.info('Toast 2');
		toast.info('Toast 3');
		toast.info('Toast 4');
		toast.info('Toast 5');

		// Wait for Portal to render
		await waitFor(() => {
			expect(screen.getByText('Toast 3')).toBeInTheDocument();
		});

		// Only the last 3 should be visible
		expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Toast 2')).not.toBeInTheDocument();
		expect(screen.getByText('Toast 4')).toBeInTheDocument();
		expect(screen.getByText('Toast 5')).toBeInTheDocument();
	});

	test('removes dismissed toasts', async () => {
		// Use real timers for this test
		vi.useRealTimers();

		const user = userEvent.setup({ delay: null });

		render(ToastContainer);

		toast.success('Dismiss Me', 'Click the X');

		// Wait for toast to render
		await waitFor(() => {
			expect(screen.getByText('Dismiss Me')).toBeInTheDocument();
		});

		const closeButton = screen.getByLabelText('Dismiss notification');
		await user.click(closeButton);

		// Wait for toast to be dismissed
		await waitFor(() => {
			expect(screen.queryByText('Dismiss Me')).not.toBeInTheDocument();
		});

		// Restore fake timers
		vi.useFakeTimers();
	});

	test('groups toasts by position', async () => {
		render(ToastContainer);

		toast.info('Top Right', undefined, { position: 'top-right' });
		toast.success('Bottom Left', undefined, { position: 'bottom-left' });

		// Wait for Portal to render
		await waitFor(() => {
			const topRightContainer = document.body.querySelector('.toast-container--top-right');
			const bottomLeftContainer = document.body.querySelector('.toast-container--bottom-left');

			expect(topRightContainer).toBeInTheDocument();
			expect(bottomLeftContainer).toBeInTheDocument();
		});
	});
});

describe('ToastProvider', () => {
	beforeEach(() => {
		toastStore.removeAll();
	});

	test('renders children and toast container', () => {
		const { container } = render(ToastProvider);

		// Provider should render (even if it doesn't have visible content)
		expect(container).toBeInTheDocument();
	});

	test('toasts work within provider', async () => {
		render(ToastProvider);

		toast.success('Provider Toast');

		// Wait for Portal to render
		await waitFor(() => {
			expect(screen.getByText('Provider Toast')).toBeInTheDocument();
		});
	});
});

describe('Queue Management', () => {
	beforeEach(() => {
		toastStore.removeAll();
	});

	test('queues toasts in order', () => {
		const id1 = toast.info('First');
		const id2 = toast.success('Second');
		const id3 = toast.warning('Third');

		const toasts = get(toastStore);
		expect(toasts[0].id).toBe(id1);
		expect(toasts[1].id).toBe(id2);
		expect(toasts[2].id).toBe(id3);
	});

	test('removes toasts independently', () => {
		const id1 = toast.info('First');
		const id2 = toast.success('Second');
		const id3 = toast.warning('Third');

		toast.dismiss(id2);

		const toasts = get(toastStore);
		expect(toasts).toHaveLength(2);
		expect(toasts[0].id).toBe(id1);
		expect(toasts[1].id).toBe(id3);
	});
});
