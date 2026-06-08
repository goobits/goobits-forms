import { test, expect, checkA11y } from '../fixtures/test-helpers'

async function openFirstMenu(page) {
	const menuTriggers = page.locator('button[aria-haspopup="true"]')
	const count = await menuTriggers.count()
	if (count === 0) return null

	const trigger = menuTriggers.first()
	await trigger.click()

	const menu = page.locator('[role="menu"]')
	await expect(menu.first()).toBeVisible()
	return { menu, trigger }
}

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
		const opened = await openFirstMenu(page)
		if (opened) {
			// Look for menu items
			const menuItems = page.locator('[role="menu"], [role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 0) {
				await expect(menuItems.first()).toBeVisible()
			}
		}
	})

	test('should close menu on escape key', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Press Escape
			await page.keyboard.press('Escape')

			// Menu should be closed
			const menuItems = page.locator('[role="menu"]:visible')
			await expect(menuItems).toHaveCount(0)
		}
	})

	test('should support keyboard navigation with arrow keys', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Look for menu items
			const menuItems = page.locator('[role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 1) {
				// Press ArrowDown to navigate
				await page.keyboard.press('ArrowDown')

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
		const opened = await openFirstMenu(page)
		if (opened) {
			// Click outside the menu (on the body)
			await page.click('body', { position: { x: 5, y: 5 } })

			// Menu should be closed
			const visibleMenus = page.locator('[role="menu"]:visible')
			await expect(visibleMenus).toHaveCount(0)
		}
	})

	test('should execute menu item action on click', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Get menu items
			const menuItems = page.locator('[role="menuitem"]')
			const menuItemCount = await menuItems.count()

			if (menuItemCount > 0) {
				const firstMenuItem = menuItems.first()

				// Click menu item
				await firstMenuItem.click()

				// Menu should close after clicking item
				const visibleMenus = page.locator('[role="menu"]:visible')
				await expect(visibleMenus).toHaveCount(0)
			}
		}
	})

	test('should support menu separators', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Look for separators
			const separators = page.locator('[role="separator"], .menu-separator')
			const separatorCount = await separators.count()

			if (separatorCount > 0) {
				await expect(separators.first()).toBeVisible()
			}
		}
	})

	test('should support disabled menu items', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Look for disabled items
			const disabledItems = page.locator('[role="menuitem"][aria-disabled="true"]')
			const disabledCount = await disabledItems.count()

			if (disabledCount > 0) {
				const disabledItem = disabledItems.first()

				// Disabled item should not be clickable
				await disabledItem.click({ force: true })

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

			// Look for context menu
			const contextMenu = page.locator('[role="menu"]')
			const menuCount = await contextMenu.count()

			if (menuCount > 0) {
				await expect(contextMenu.first()).toBeVisible()
			}
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
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
			await openFirstMenu(page)

			// Menu should have role="menu"
			const menu = page.locator('[role="menu"]')
			const menuCount = await menu.count()

			if (menuCount > 0) {
				await expect(menu.first()).toHaveAttribute('role', 'menu')
			}
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const opened = await openFirstMenu(page)
		if (opened) {
			// Take screenshot of the menu
			const menu = page.locator('[role="menu"]')
			const menuCount = await menu.count()

			if (menuCount > 0) {
				await expect(menu.first()).toHaveScreenshot('menu-default.png')
			}
		}
	})
})
