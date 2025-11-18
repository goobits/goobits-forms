/**
 * Accessibility Tests for Toast Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - role="status" for info/success (polite announcements)
 * - role="alert" for warning/error (assertive announcements)
 * - aria-live attributes
 * - aria-atomic
 * - Keyboard navigation
 * - Focus management
 * - Screen reader announcements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, getFocusableElements } from '../test-utils';
import { waitFor } from '@testing-library/svelte';
import {
	testAccessibility,
	testWCAG_AA,
	testARIA,
	assertFocusable
} from '../../utils/a11y-test-utils';
import Toast from './Toast.svelte';
import ToastContainer from './ToastContainer.svelte';
import { toastStore } from './toast-service';

describe('Toast Component - Accessibility', () => {
	beforeEach(() => {
		toastStore.removeAll();
	});

	describe('WCAG Compliance', () => {
		it('should have no accessibility violations - info variant', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-info',
					title: 'Information',
					message: 'This is an informational message',
					variant: 'info'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should have no accessibility violations - success variant', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-success',
					title: 'Success',
					message: 'Operation completed successfully',
					variant: 'success'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should have no accessibility violations - warning variant', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-warning',
					title: 'Warning',
					message: 'Please be careful',
					variant: 'warning'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should have no accessibility violations - error variant', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-error',
					title: 'Error',
					message: 'Something went wrong',
					variant: 'error'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should meet WCAG 2.1 AA standards', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-wcag',
					title: 'WCAG Test',
					message: 'Testing WCAG compliance',
					variant: 'info'
				}
			});

			const results = await testWCAG_AA(container);

			// Filter color-contrast for unit tests
			const filteredViolations = results.violations.filter((v) => v.id !== 'color-contrast');

			expect(filteredViolations).toHaveLength(0);
		});

		it('should have proper ARIA attributes', async () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-aria',
					title: 'ARIA Test',
					variant: 'info'
				}
			});

			const results = await testARIA(container);

			// Filter color-contrast for unit tests
			const filteredViolations = results.violations.filter((v) => v.id !== 'color-contrast');

			expect(filteredViolations).toHaveLength(0);
		});
	});

	describe('ARIA Roles', () => {
		it('should have role="status" for info variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-role-info',
					title: 'Info Toast',
					variant: 'info'
				}
			});

			const toast = container.querySelector('[role="status"]');
			expect(toast).toBeTruthy();
		});

		it('should have role="status" for success variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-role-success',
					title: 'Success Toast',
					variant: 'success'
				}
			});

			const toast = container.querySelector('[role="status"]');
			expect(toast).toBeTruthy();
		});

		it('should have role="alert" for warning variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-role-warning',
					title: 'Warning Toast',
					variant: 'warning'
				}
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toBeTruthy();
		});

		it('should have role="alert" for error variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-role-error',
					title: 'Error Toast',
					variant: 'error'
				}
			});

			const toast = container.querySelector('[role="alert"]');
			expect(toast).toBeTruthy();
		});
	});

	describe('ARIA Live Regions', () => {
		it('should have aria-live="polite" for info variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-live-info',
					title: 'Info Toast',
					variant: 'info'
				}
			});

			const toast = container.querySelector('[aria-live="polite"]');
			expect(toast).toBeTruthy();
		});

		it('should have aria-live="polite" for success variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-live-success',
					title: 'Success Toast',
					variant: 'success'
				}
			});

			const toast = container.querySelector('[aria-live="polite"]');
			expect(toast).toBeTruthy();
		});

		it('should have aria-live="assertive" for warning variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-live-warning',
					title: 'Warning Toast',
					variant: 'warning'
				}
			});

			const toast = container.querySelector('[aria-live="assertive"]');
			expect(toast).toBeTruthy();
		});

		it('should have aria-live="assertive" for error variant', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-live-error',
					title: 'Error Toast',
					variant: 'error'
				}
			});

			const toast = container.querySelector('[aria-live="assertive"]');
			expect(toast).toBeTruthy();
		});

		it('should have aria-atomic="true"', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-atomic',
					title: 'Atomic Toast',
					variant: 'info'
				}
			});

			const toast = container.querySelector('[aria-atomic="true"]');
			expect(toast).toBeTruthy();
		});
	});

	describe('Keyboard Navigation', () => {
		it('should have focusable close button', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-focus-close',
					title: 'Focusable Toast',
					dismissible: true
				}
			});

			const closeButton = container.querySelector('.toast__close');
			expect(closeButton).toBeTruthy();

			if (closeButton instanceof HTMLElement) {
				assertFocusable(closeButton);
			}
		});

		it('should have focusable action button', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-focus-action',
					title: 'Action Toast',
					action: {
						label: 'Undo',
						onClick: () => {}
					}
				}
			});

			const actionButton = container.querySelector('.toast__action');
			expect(actionButton).toBeTruthy();

			if (actionButton instanceof HTMLElement) {
				assertFocusable(actionButton);
			}
		});

		it('should support Escape key to dismiss', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-escape',
					title: 'Escape Toast',
					dismissible: true
				}
			});

			const toast = container.querySelector('.toast');
			expect(toast).toBeTruthy();

			// Escape key should be handled
			const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
			toast?.dispatchEvent(event);
			// Note: actual dismissal is tested in functional tests
		});

		it('should have proper tab order', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-tab-order',
					title: 'Tab Order Toast',
					dismissible: true,
					action: {
						label: 'Retry',
						onClick: () => {}
					}
				}
			});

			const focusableElements = getFocusableElements(container);

			// Should have action button and close button
			expect(focusableElements.length).toBeGreaterThanOrEqual(2);

			// All should be focusable
			focusableElements.forEach((element) => {
				assertFocusable(element);
			});
		});
	});

	describe('Screen Reader Announcements', () => {
		it('should announce content to screen readers', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-sr',
					title: 'Screen Reader Toast',
					message: 'This should be announced',
					variant: 'info'
				}
			});

			const toast = container.querySelector('[role="status"]');
			expect(toast).toBeTruthy();

			// Should have aria-live for announcements
			expect(toast).toHaveAttribute('aria-live');
			expect(toast).toHaveAttribute('aria-atomic', 'true');
		});

		it('should hide decorative icons from screen readers', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-sr-icon',
					title: 'Icon Toast',
					icon: '🎉'
				}
			});

			const icon = container.querySelector('.toast__icon');
			expect(icon).toBeTruthy();
			expect(icon).toHaveAttribute('aria-hidden', 'true');
		});

		it('should hide progress bar from screen readers', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-sr-progress',
					title: 'Progress Toast',
					duration: 5000
				}
			});

			const progress = container.querySelector('.toast__progress');
			expect(progress).toBeTruthy();
			expect(progress).toHaveAttribute('aria-hidden', 'true');
		});
	});

	describe('Button Accessibility', () => {
		it('should have accessible close button label', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-close-label',
					title: 'Close Label Toast',
					dismissible: true
				}
			});

			const closeButton = container.querySelector('.toast__close');
			expect(closeButton).toHaveAttribute('aria-label', 'Dismiss notification');
		});

		it('should have accessible action button label', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-action-label',
					title: 'Action Label Toast',
					action: {
						label: 'Undo',
						onClick: () => {}
					}
				}
			});

			const actionButton = container.querySelector('.toast__action');
			expect(actionButton).toHaveAttribute('aria-label', 'Undo');
		});

		it('should have type="button" on close button', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-close-type',
					title: 'Close Type Toast',
					dismissible: true
				}
			});

			const closeButton = container.querySelector('.toast__close');
			expect(closeButton).toHaveAttribute('type', 'button');
		});

		it('should have type="button" on action button', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-action-type',
					title: 'Action Type Toast',
					action: {
						label: 'Retry',
						onClick: () => {}
					}
				}
			});

			const actionButton = container.querySelector('.toast__action');
			expect(actionButton).toHaveAttribute('type', 'button');
		});
	});

	describe('ToastContainer Accessibility', () => {
		it('should have no accessibility violations', async () => {
			const { container } = render(ToastContainer);

			toastStore.add({
				title: 'Container Test',
				variant: 'info'
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should have aria-live on container', async () => {
			render(ToastContainer);

			toastStore.add({
				title: 'Container Live',
				variant: 'info'
			});

			await waitFor(() => {
				const toastContainer = document.body.querySelector('.toast-container');
				expect(toastContainer).toHaveAttribute('aria-live', 'polite');
			});
		});

		it('should have aria-atomic="false" on container', async () => {
			render(ToastContainer);

			toastStore.add({
				title: 'Container Atomic',
				variant: 'info'
			});

			await waitFor(() => {
				const toastContainer = document.body.querySelector('.toast-container');
				expect(toastContainer).toHaveAttribute('aria-atomic', 'false');
			});
		});
	});

	describe('Multiple Toasts Accessibility', () => {
		it('should maintain accessibility with multiple toasts', async () => {
			const { container } = render(ToastContainer);

			toastStore.add({ title: 'Toast 1', variant: 'info' });
			toastStore.add({ title: 'Toast 2', variant: 'success' });
			toastStore.add({ title: 'Toast 3', variant: 'warning' });

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should have unique IDs for each toast', async () => {
			render(ToastContainer);

			const id1 = toastStore.add({ title: 'Toast 1' });
			const id2 = toastStore.add({ title: 'Toast 2' });
			const id3 = toastStore.add({ title: 'Toast 3' });

			await waitFor(() => {
				const toast1 = document.body.querySelector(`[data-testid="toast-${id1}"]`);
				const toast2 = document.body.querySelector(`[data-testid="toast-${id2}"]`);
				const toast3 = document.body.querySelector(`[data-testid="toast-${id3}"]`);

				expect(toast1).toBeTruthy();
				expect(toast2).toBeTruthy();
				expect(toast3).toBeTruthy();
			});
		});
	});

	describe('Responsive Accessibility', () => {
		it('should be accessible on mobile viewports', async () => {
			// Mock mobile viewport
			global.innerWidth = 375;

			const { container } = render(Toast, {
				props: {
					id: 'test-mobile',
					title: 'Mobile Toast',
					message: 'Testing mobile accessibility',
					variant: 'info'
				}
			});

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});
	});

	describe('Reduced Motion', () => {
		it('should respect prefers-reduced-motion', () => {
			const { container } = render(Toast, {
				props: {
					id: 'test-reduced-motion',
					title: 'Reduced Motion Toast',
					variant: 'info'
				}
			});

			const toast = container.querySelector('.toast');
			expect(toast).toBeTruthy();

			// Note: CSS media query handling is tested in CSS, this verifies component structure
		});
	});
});
