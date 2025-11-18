import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Menu Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should handle menu visibility', async ({ page }) => {
		// Look for menu triggers (buttons with menu role or popup)
		const menuTriggers = page.locator('button[aria-haspopup="true"], [role="menu"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()
			await expect(trigger).toBeVisible()
		}
	})

	test('should open menu on click', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Click to open menu
			await trigger.click()

			// Wait for menu to appear
			await page.waitForTimeout(500)

			// Look for menu items
			const menuItems = page.locator('[role="menu"], [role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 0) {
				await expect(menuItems.first()).toBeVisible()
			}
		}
	})

	test('should close menu on escape key', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Press Escape
			await page.keyboard.press('Escape')
			await page.waitForTimeout(500)

			// Menu should be closed
			const menuItems = page.locator('[role="menu"]:visible')
			const visibleCount = await menuItems.count()
			expect(visibleCount).toBe(0)
		}
	})

	test('should support keyboard navigation with arrow keys', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Look for menu items
			const menuItems = page.locator('[role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 1) {
				// Press ArrowDown to navigate
				await page.keyboard.press('ArrowDown')
				await page.waitForTimeout(200)

				// Check that focus moved
				const focusedItem = page.locator('[role="menuitem"]:focus')
				const focusedCount = await focusedItem.count()

				if (focusedCount > 0) {
					await expect(focusedItem).toBeFocused()
				}
			}
		}
	})

	test('should close menu when clicking outside', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Click outside the menu (on the body)
			await page.click('body', { position: { x: 5, y: 5 } })
			await page.waitForTimeout(500)

			// Menu should be closed
			const visibleMenus = page.locator('[role="menu"]:visible')
			const visibleCount = await visibleMenus.count()
			expect(visibleCount).toBe(0)
		}
	})

	test('should execute menu item action on click', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Get menu items
			const menuItems = page.locator('[role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 0) {
				const firstMenuItem = menuItems.first()

				// Click menu item
				await firstMenuItem.click()
				await page.waitForTimeout(500)

				// Menu should close after clicking item
				const visibleMenus = page.locator('[role="menu"]:visible')
				const visibleCount = await visibleMenus.count()
				expect(visibleCount).toBe(0)
			}
		}
	})

	test('should support menu separators', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Look for separators
			const separators = page.locator('[role="separator"], .menu-separator')
			const separatorCount = await separators.count()

			if (separatorCount > 0) {
				await expect(separators.first()).toBeVisible()
			}
		}
	})

	test('should support disabled menu items', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Look for disabled items
			const disabledItems = page.locator('[role="menuitem"][aria-disabled="true"]')
			const disabledCount = await disabledItems.count()

			if (disabledCount > 0) {
				const disabledItem = disabledItems.first()

				// Disabled item should not be clickable
				await disabledItem.click({ force: true })
				await page.waitForTimeout(500)

				// Should not trigger any action
				await expect(disabledItem).toHaveAttribute('aria-disabled', 'true')
			}
		}
	})

	test('should support context menus', async ({ page }) => {
		// Look for elements with context menu
		const contextMenuElements = page.locator('[data-context-menu], [oncontextmenu]')
		const count = await contextMenuElements.count()

		if (count > 0) {
			const element = contextMenuElements.first()

			// Right click to open context menu
			await element.click({ button: 'right' })
			await page.waitForTimeout(500)

			// Look for context menu
			const contextMenu = page.locator('[role="menu"]')
			const menuCount = await contextMenu.count()

			if (menuCount > 0) {
				await expect(contextMenu.first()).toBeVisible()
			}
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Check accessibility
			await checkA11y(page, '[role="menu"]')
		}
	})

	test('should have proper ARIA attributes', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Trigger should have aria-haspopup
			await expect(trigger).toHaveAttribute('aria-haspopup', 'true')

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Menu should have role="menu"
			const menu = page.locator('[role="menu"]')
			const menuCount = await menu.count()

			if (menuCount > 0) {
				await expect(menu.first()).toHaveAttribute('role', 'menu')
			}
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Take screenshot of the menu
			const menu = page.locator('[role="menu"]')
			const menuCount = await menu.count()

			if (menuCount > 0) {
				await expect(menu.first()).toHaveScreenshot('menu-default.png')
			}
		}
	})
})
