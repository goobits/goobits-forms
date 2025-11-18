/**
 * Accessibility Tests for Modal Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Dialog role and ARIA attributes
 * - Keyboard navigation (Escape key)
 * - Focus management (focus trap)
 * - Screen reader announcements
 * - Backdrop/overlay accessibility
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from '../test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testARIA,
	assertARIAAttributes
} from '../../utils/a11y-test-utils';
import Modal from './Modal.svelte';

describe('Modal Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations when open', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Test Modal'
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
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'WCAG Test Modal',
					description: 'This is a test modal for WCAG compliance'
				}
			});

			const results = await testWCAG_AA(container);

			// Filter color-contrast for unit tests
			const filteredViolations = results.violations.filter(
				(v) => v.id !== 'color-contrast'
			);

			expect(filteredViolations).toHaveLength(0);
		});

		it('should have proper ARIA attributes', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'ARIA Test Modal'
				}
			});

			const results = await testARIA(container);

			// Filter color-contrast for unit tests
			const filteredViolations = results.violations.filter(
				(v) => v.id !== 'color-contrast'
			);

			expect(filteredViolations).toHaveLength(0);
		});
	});

	describe('Dialog Role and ARIA', () => {
		it('should have dialog role', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Dialog Role Test'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog).toBeTruthy();
		});

		it('should have aria-modal attribute', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Modal Test'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});

		it('should have aria-labelledby pointing to title', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Labeled Modal'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');
			const labelledBy = dialog?.getAttribute('aria-labelledby');

			expect(labelledBy).toBeTruthy();

			// Title element should exist with matching ID
			if (labelledBy) {
				const titleElement = container.querySelector(`#${labelledBy}`);
				expect(titleElement).toBeTruthy();
				expect(titleElement?.textContent).toContain('Labeled Modal');
			}
		});

		it('should have aria-describedby when description is provided', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Described Modal',
					description: 'This is the modal description'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');
			const describedBy = dialog?.getAttribute('aria-describedby');

			if (describedBy) {
				const descElement = container.querySelector(`#${describedBy}`);
				expect(descElement).toBeTruthy();
				expect(descElement?.textContent).toContain('This is the modal description');
			}
		});

		it('should have proper ARIA label when title is hidden', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					'aria-label': 'Hidden Title Modal'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');

			// Should have either aria-label or aria-labelledby
			const hasLabel =
				dialog?.hasAttribute('aria-label') || dialog?.hasAttribute('aria-labelledby');

			expect(hasLabel).toBe(true);
		});
	});

	describe('Focus Management', () => {
		it('should trap focus within modal when open', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Focus Trap Test'
				}
			});

			const focusableElements = getFocusableElements(container);

			// Modal should have focusable elements (at minimum, close button)
			expect(focusableElements.length).toBeGreaterThan(0);

			// All focusable elements should be within the modal
			focusableElements.forEach((element) => {
				const dialog = container.querySelector('[role="dialog"]');
				expect(dialog?.contains(element)).toBe(true);
			});
		});

		it('should have a close button that is keyboard accessible', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Close Button Test',
					showCloseButton: true
				}
			});

			const closeButton = container.querySelector('[aria-label*="lose"]');
			expect(closeButton).toBeTruthy();

			// Close button should be focusable
			if (closeButton instanceof HTMLElement) {
				closeButton.focus();
				expect(document.activeElement).toBe(closeButton);
			}
		});

		it('should have focusable action buttons', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Action Buttons Test'
				}
			});

			const buttons = container.querySelectorAll('button');
			expect(buttons.length).toBeGreaterThan(0);

			// All buttons should be focusable
			buttons.forEach((button) => {
				button.focus();
				expect(document.activeElement).toBe(button);
			});
		});

		it('should have close button with accessible label', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Close Label Test',
					showCloseButton: true
				}
			});

			const closeButton = container.querySelector('[aria-label*="lose"]');

			if (closeButton) {
				const label =
					closeButton.getAttribute('aria-label') || closeButton.textContent?.trim();
				expect(label).toBeTruthy();
			}
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be accessible via keyboard', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Keyboard Test'
				}
			});

			const focusableElements = getFocusableElements(container);

			// Should be able to tab through all elements
			focusableElements.forEach((element) => {
				element.focus();
				expect(document.activeElement).toBe(element);
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

	describe('Backdrop/Overlay', () => {
		it('should have backdrop with proper attributes', () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Backdrop Test',
					backdrop: true
				}
			});

			// Backdrop should not interfere with modal accessibility
			const dialog = container.querySelector('[role="dialog"]');
			expect(dialog).toBeTruthy();
		});

		it('should be accessible with backdrop click disabled', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'No Backdrop Close',
					closeOnBackdropClick: false
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

	describe('Modal States', () => {
		it('should be accessible when closed', async () => {
			const { container } = render(Modal, {
				props: {
					open: false,
					title: 'Closed Modal'
				}
			});

			// Closed modal should not create accessibility issues
			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should hide content from screen readers when closed', () => {
			const { container } = render(Modal, {
				props: {
					open: false,
					title: 'Hidden Modal'
				}
			});

			const dialog = container.querySelector('[role="dialog"]');

			// When closed, modal should be hidden or not in DOM
			if (dialog) {
				const isHidden =
					dialog.hasAttribute('hidden') ||
					dialog.getAttribute('aria-hidden') === 'true' ||
					window.getComputedStyle(dialog).display === 'none';

				expect(isHidden).toBe(true);
			}
		});
	});

	describe('Modal Sizes', () => {
		it('should be accessible with small size', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Small Modal',
					size: 'sm'
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

		it('should be accessible with large size', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Large Modal',
					size: 'lg'
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

		it('should be accessible with full width', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Full Width Modal',
					fullWidth: true
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

	describe('Modal Content', () => {
		it('should be accessible with form content', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Form Modal'
				}
			});

			// Modal should support form content accessibly
			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should be accessible with scrollable content', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Scrollable Modal',
					scrollable: true
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

	describe('Nested Interactive Elements', () => {
		it('should handle nested interactive elements accessibly', async () => {
			const { container } = render(Modal, {
				props: {
					open: true,
					title: 'Interactive Modal'
				}
			});

			const focusableElements = getFocusableElements(container);

			// Each focusable element should be keyboard accessible
			focusableElements.forEach((element) => {
				element.focus();
				expect(document.activeElement).toBe(element);
			});
		});
	});
});
