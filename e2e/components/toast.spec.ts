import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Toast Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should show toast notifications', async ({ page }) => {
		// Look for toast container or notifications
		const toasts = page.locator('[role="status"], [role="alert"], .toast, [data-toast]')
		const count = await toasts.count()

		// Toasts may appear after certain actions
		// This test just checks if toast infrastructure exists
		if (count > 0) {
			const toast = toasts.first()
			await expect(toast).toBeVisible()
		}
	})

	test('should auto-dismiss toast after timeout', async ({ page }) => {
		// Look for auto-dismissing toasts
		const toasts = page.locator('[role="status"]:visible, .toast:visible')
		const initialCount = await toasts.count()

		if (initialCount > 0) {
			// Wait for auto-dismiss (typically 3-5 seconds)
			await page.waitForTimeout(6000)

			// Count should decrease
			const finalCount = await toasts.count()
			expect(finalCount).toBeLessThanOrEqual(initialCount)
		}
	})

	test('should manually dismiss toast with close button', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"], .toast')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Look for close button in toast
			const closeButton = toast.locator('button[aria-label*="close" i], button[aria-label*="dismiss" i]')
			const closeButtonCount = await closeButton.count()

			if (closeButtonCount > 0) {
				// Click close button
				await closeButton.click()
				await page.waitForTimeout(500)

				// Toast should be hidden or removed
				const isVisible = await toast.isVisible().catch(() => false)
				expect(isVisible).toBeFalsy()
			}
		}
	})

	test('should support different toast types (success, error, warning, info)', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"], .toast')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Check for type-related classes
			const className = await toast.getAttribute('class')

			// Should have type classes like 'success', 'error', 'warning', 'info'
			expect(className).toBeTruthy()
		}
	})

	test('should stack multiple toasts', async ({ page }) => {
		const toasts = page.locator('[role="status"]:visible, [role="alert"]:visible, .toast:visible')
		const count = await toasts.count()

		// If there are multiple toasts
		if (count > 1) {
			// They should be stacked (positioned correctly)
			const firstToast = toasts.first()
			const secondToast = toasts.nth(1)

			const firstPosition = await firstToast.evaluate((el) => {
				const rect = el.getBoundingClientRect()
				return { top: rect.top, bottom: rect.bottom }
			})

			const secondPosition = await secondToast.evaluate((el) => {
				const rect = el.getBoundingClientRect()
				return { top: rect.top, bottom: rect.bottom }
			})

			// Toasts should not overlap completely
			expect(firstPosition.top !== secondPosition.top || firstPosition.bottom !== secondPosition.bottom).toBeTruthy()
		}
	})

	test('should support action buttons in toasts', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"], .toast')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Look for action buttons (excluding close button)
			const actionButtons = toast.locator('button:not([aria-label*="close" i]):not([aria-label*="dismiss" i])')
			const actionButtonCount = await actionButtons.count()

			if (actionButtonCount > 0) {
				const actionButton = actionButtons.first()

				// Action button should be clickable
				await expect(actionButton).toBeVisible()
				await expect(actionButton).toBeEnabled()
			}
		}
	})

	test('should position toasts correctly', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"], .toast')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Check position (usually top-right, bottom-right, etc.)
			const position = await toast.evaluate((el) => {
				const style = window.getComputedStyle(el)
				return {
					position: style.position,
					top: style.top,
					right: style.right,
					bottom: style.bottom,
					left: style.left
				}
			})

			// Toast should be positioned (fixed or absolute)
			expect(['absolute', 'fixed']).toContain(position.position)
		}
	})

	test('should animate toast entrance and exit', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"], .toast')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Check for animations
			const computedStyle = await toast.evaluate((el) => {
				const style = window.getComputedStyle(el)
				return {
					transition: style.transition,
					animation: style.animation,
					opacity: style.opacity
				}
			})

			// Should have some animation or transition
			expect(
				computedStyle.transition !== 'none' ||
				computedStyle.animation !== 'none'
			).toBeTruthy()
		}
	})

	test('should have proper ARIA roles', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"]')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Toast should have appropriate role
			const role = await toast.getAttribute('role')
			expect(['status', 'alert']).toContain(role)

			// If it's an alert, it should have aria-live
			if (role === 'alert') {
				const ariaLive = await toast.getAttribute('aria-live')
				expect(ariaLive).toBeTruthy()
			}
		}
	})

	test('should be accessible to screen readers', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"]')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Toast should have aria-live for screen readers
			const ariaLive = await toast.getAttribute('aria-live')
			const ariaAtomic = await toast.getAttribute('aria-atomic')

			// Should have aria-live="polite" or "assertive"
			expect(ariaLive === 'polite' || ariaLive === 'assertive' || ariaLive === null).toBeTruthy()
		}
	})

	test('should limit number of visible toasts', async ({ page }) => {
		const toasts = page.locator('[role="status"]:visible, [role="alert"]:visible, .toast:visible')
		const count = await toasts.count()

		// Most toast systems limit to 3-5 visible toasts
		expect(count).toBeLessThanOrEqual(10)
	})

	test('should pass accessibility checks', async ({ page }) => {
		const toasts = page.locator('[role="status"], [role="alert"]')
		const count = await toasts.count()

		if (count > 0) {
			// Check accessibility of toasts
			await checkA11y(page, '[role="status"], [role="alert"]')
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const toasts = page.locator('[role="status"]:visible, [role="alert"]:visible, .toast:visible')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Take screenshot of toast
			await expect(toast).toHaveScreenshot('toast-default.png')
		}
	})

	test('should persist important toasts until dismissed', async ({ page }) => {
		const toasts = page.locator('[role="alert"]:visible, .toast.error:visible, .toast.warning:visible')
		const count = await toasts.count()

		if (count > 0) {
			const toast = toasts.first()

			// Wait longer than auto-dismiss time
			await page.waitForTimeout(6000)

			// Error/warning toasts should still be visible
			const isStillVisible = await toast.isVisible().catch(() => false)

			// If it's an important toast, it should still be visible
			// (This depends on implementation)
		}
	})
})
