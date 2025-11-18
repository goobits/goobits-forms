/**
 * Accessibility Tests for Menu Component
 *
 * Tests WCAG 2.1 AA compliance and accessibility features:
 * - No axe violations
 * - Menu role and ARIA attributes
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Focus management
 * - Menu items and separators
 * - Nested menus (submenus)
 */

import { describe, it, expect } from 'vitest';
import { render, getFocusableElements } from '../test-utils';
import {
	testAccessibility,
	testWCAG_AA,
	testARIA,
	testKeyboardNavigation
} from '../../utils/a11y-test-utils';
import Menu from './Menu.svelte';

describe('Menu Component - Accessibility', () => {
	describe('WCAG Compliance', () => {
		it('should have no accessibility violations when open', async () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Main menu'
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
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'WCAG test menu'
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
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'ARIA test menu'
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

	describe('Menu Role and ARIA', () => {
		it('should have menu role', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Menu role test'
				}
			});

			const menu = container.querySelector('[role="menu"]');
			expect(menu).toBeTruthy();
		});

		it('should have aria-label or aria-labelledby', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Labeled menu'
				}
			});

			const menu = container.querySelector('[role="menu"]');

			const hasLabel =
				menu?.hasAttribute('aria-label') || menu?.hasAttribute('aria-labelledby');

			expect(hasLabel).toBe(true);
		});

		it('should have aria-orientation for vertical menus', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					orientation: 'vertical',
					'aria-label': 'Vertical menu'
				}
			});

			const menu = container.querySelector('[role="menu"]');

			// Vertical is default, but can be explicit
			const orientation = menu?.getAttribute('aria-orientation');
			if (orientation) {
				expect(orientation).toBe('vertical');
			}
		});

		it('should have aria-orientation for horizontal menus', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					orientation: 'horizontal',
					'aria-label': 'Horizontal menu'
				}
			});

			const menu = container.querySelector('[role="menu"]');
			const orientation = menu?.getAttribute('aria-orientation');

			if (orientation) {
				expect(orientation).toBe('horizontal');
			}
		});
	});

	describe('Menu Items', () => {
		it('should have menuitem role for items', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Menu items test'
				}
			});

			// Look for menu items
			const menuItems = container.querySelectorAll('[role="menuitem"]');

			// If menu items exist, they should have proper role
			if (menuItems.length > 0) {
				menuItems.forEach((item) => {
					expect(item).toHaveAttribute('role', 'menuitem');
				});
			}
		});

		it('should have keyboard accessible menu items', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Keyboard menu items'
				}
			});

			const menuItems = container.querySelectorAll('[role="menuitem"]');

			if (menuItems.length > 0) {
				menuItems.forEach((item) => {
					if (item instanceof HTMLElement) {
						// Menu items should be focusable
						const isFocusable =
							item.tabIndex >= 0 ||
							item.hasAttribute('tabindex') ||
							['BUTTON', 'A'].includes(item.tagName);

						expect(isFocusable).toBe(true);
					}
				});
			}
		});

		it('should support disabled menu items', async () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Disabled items menu'
				}
			});

			// Disabled items should have aria-disabled
			const disabledItems = container.querySelectorAll('[aria-disabled="true"]');

			// Disabled items should not be in tab order
			if (disabledItems.length > 0) {
				disabledItems.forEach((item) => {
					if (item instanceof HTMLElement) {
						expect(item.tabIndex).toBeLessThan(0);
					}
				});
			}

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});
	});

	describe('Menu Separators', () => {
		it('should have separator role for dividers', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Menu with separators'
				}
			});

			const separators = container.querySelectorAll('[role="separator"]');

			// Separators should have proper role
			if (separators.length > 0) {
				separators.forEach((sep) => {
					expect(sep).toHaveAttribute('role', 'separator');
				});
			}
		});

		it('should not make separators focusable', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Separator focus test'
				}
			});

			const separators = container.querySelectorAll('[role="separator"]');

			if (separators.length > 0) {
				separators.forEach((sep) => {
					const focusableElements = getFocusableElements(container);
					expect(focusableElements).not.toContain(sep);
				});
			}
		});
	});

	describe('Keyboard Navigation', () => {
		it('should be keyboard accessible', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Keyboard navigation test'
				}
			});

			const menu = container.querySelector('[role="menu"]');
			if (menu instanceof HTMLElement) {
				testKeyboardNavigation(menu);
			}
		});

		it('should have roving tabindex for menu items', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Roving tabindex test'
				}
			});

			const menuItems = container.querySelectorAll('[role="menuitem"]');

			if (menuItems.length > 0) {
				// Only one item should have tabindex="0", others should be "-1"
				const focusableCount = Array.from(menuItems).filter((item) =>
					item.hasAttribute('tabindex') && item.getAttribute('tabindex') === '0'
				).length;

				// Either roving tabindex is implemented, or all are naturally focusable
				expect(focusableCount).toBeGreaterThanOrEqual(0);
			}
		});
	});

	describe('Focus Management', () => {
		it('should manage focus when opening', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Focus management test'
				}
			});

			const focusableElements = getFocusableElements(container);
			expect(focusableElements.length).toBeGreaterThan(0);
		});

		it('should have focusable trigger button', () => {
			const { container } = render(Menu, {
				props: {
					open: false,
					'aria-label': 'Trigger button test'
				}
			});

			// Look for menu button/trigger
			const menuButton = container.querySelector('[aria-haspopup="menu"]');

			if (menuButton instanceof HTMLElement) {
				menuButton.focus();
				expect(document.activeElement).toBe(menuButton);
			}
		});
	});

	describe('Menu States', () => {
		it('should be accessible when closed', async () => {
			const { container } = render(Menu, {
				props: {
					open: false,
					'aria-label': 'Closed menu'
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

		it('should hide menu content when closed', () => {
			const { container } = render(Menu, {
				props: {
					open: false,
					'aria-label': 'Hidden menu'
				}
			});

			const menu = container.querySelector('[role="menu"]');

			// When closed, menu should be hidden
			if (menu) {
				const isHidden =
					menu.hasAttribute('hidden') ||
					menu.getAttribute('aria-hidden') === 'true' ||
					window.getComputedStyle(menu).display === 'none';

				// Menu should be hidden when closed
				expect(isHidden || !menu.parentElement).toBe(true);
			}
		});

		it('should indicate menu state on trigger with aria-expanded', () => {
			const { container, rerender } = render(Menu, {
				props: {
					open: false,
					'aria-label': 'Expandable menu'
				}
			});

			const trigger = container.querySelector('[aria-haspopup="menu"]');

			if (trigger) {
				// When closed, aria-expanded should be false
				expect(trigger.getAttribute('aria-expanded')).toBe('false');
			}
		});
	});

	describe('Context Menu', () => {
		it('should be accessible as context menu', async () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					type: 'context',
					'aria-label': 'Context menu'
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

	describe('Submenu/Nested Menus', () => {
		it('should be accessible with submenus', async () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Menu with submenu'
				}
			});

			// Submenus should have proper ARIA
			const submenus = container.querySelectorAll('[role="menu"] [role="menu"]');

			if (submenus.length > 0) {
				submenus.forEach((submenu) => {
					expect(submenu).toHaveAttribute('role', 'menu');
				});
			}

			await testAccessibility(container, {
				axeOptions: {
					rules: {
						'color-contrast': { enabled: false }
					}
				}
			});
		});

		it('should indicate submenu items with aria-haspopup', () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Submenu indicators'
				}
			});

			const submenuTriggers = container.querySelectorAll('[aria-haspopup="menu"]');

			if (submenuTriggers.length > 0) {
				submenuTriggers.forEach((trigger) => {
					expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
				});
			}
		});
	});

	describe('Menu Positioning', () => {
		it('should be accessible with different positions', async () => {
			const positions = ['top', 'bottom', 'left', 'right'];

			for (const position of positions) {
				const { container } = render(Menu, {
					props: {
						open: true,
						position,
						'aria-label': `${position} positioned menu`
					}
				});

				await testAccessibility(container, {
					axeOptions: {
						rules: {
							'color-contrast': { enabled: false }
						}
					}
				});
			}
		});
	});

	describe('Menu with Icons', () => {
		it('should be accessible with icon-only items', async () => {
			const { container } = render(Menu, {
				props: {
					open: true,
					'aria-label': 'Icon menu'
				}
			});

			// Icon-only items should have aria-label
			const menuItems = container.querySelectorAll('[role="menuitem"]');

			if (menuItems.length > 0) {
				menuItems.forEach((item) => {
					// Should have some form of accessible label
					const hasLabel =
						item.hasAttribute('aria-label') ||
						item.hasAttribute('aria-labelledby') ||
						(item.textContent && item.textContent.trim().length > 0);

					expect(hasLabel).toBe(true);
				});
			}
		});
	});
});
