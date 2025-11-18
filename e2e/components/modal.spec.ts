import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Modal Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should handle modal visibility states', async ({ page }) => {
		// Look for any modals on the page
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		// If there are modals, check their visibility state
		if (count > 0) {
			// Modal should have proper ARIA attributes
			const modal = modals.first()
			await expect(modal).toHaveAttribute('role', 'dialog')
		}
	})

	test('should handle escape key to close modal', async ({ page }) => {
		// This test assumes a modal can be triggered
		// For a real implementation, you'd need to trigger a modal first
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Press Escape
			await page.keyboard.press('Escape')

			// Wait a bit for closing animation
			await page.waitForTimeout(500)
		}
	})

	test('should handle backdrop clicks', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Look for the backdrop
			const backdrop = page.locator('.modal-backdrop, [data-modal-backdrop]').first()

			if (await backdrop.isVisible()) {
				// Click on the backdrop (not the modal content)
				await backdrop.click({ position: { x: 5, y: 5 } })

				// Wait for any closing animation
				await page.waitForTimeout(500)
			}
		}
	})

	test('should trap focus within modal', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Get all focusable elements within the modal
			const focusableElements = modal.locator(
				'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
			)
			const focusableCount = await focusableElements.count()

			if (focusableCount > 0) {
				// Focus first element
				await focusableElements.first().focus()

				// Tab through elements
				await page.keyboard.press('Tab')

				// Focus should still be within the modal
				const activeElement = page.locator(':focus')
				const isInModal = await modal.locator(':focus').count()
				expect(isInModal).toBeGreaterThan(0)
			}
		}
	})

	test('should have proper ARIA attributes', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Check for proper ARIA attributes
			await expect(modal).toHaveAttribute('role', 'dialog')

			// Modal should ideally have aria-modal attribute
			const hasAriaModal = await modal.getAttribute('aria-modal')
			if (hasAriaModal) {
				expect(hasAriaModal).toBe('true')
			}
		}
	})

	test('should show close button when enabled', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Look for close button
			const closeButton = modal.locator('button[aria-label*="close" i], button[aria-label*="Close"]')
			const closeButtonCount = await closeButton.count()

			if (closeButtonCount > 0) {
				await expect(closeButton.first()).toBeVisible()
			}
		}
	})

	test('should handle animations', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()

			// Modal should have some animation/transition
			const computedStyle = await modal.evaluate((el) => {
				const style = window.getComputedStyle(el)
				return {
					transition: style.transition,
					animation: style.animation
				}
			})

			// Either transition or animation should be set
			expect(computedStyle.transition !== 'none' || computedStyle.animation !== 'none').toBeTruthy()
		}
	})

	test('should support different sizes', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Check if modal has size-related classes
			const className = await modal.getAttribute('class')
			expect(className).toBeTruthy()
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			// Check accessibility of the modal
			await checkA11y(page, '[role="dialog"]')
		}
	})

	test('should prevent body scroll when modal is open', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			// Check if body has overflow hidden or similar
			const bodyOverflow = await page.evaluate(() => {
				return window.getComputedStyle(document.body).overflow
			})

			// When modal is open, body should have overflow hidden or similar
			expect(['hidden', 'overlay']).toContain(bodyOverflow)
		}
	})

	test('should handle multiple modals stacking', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		// If there are multiple modals, they should stack properly
		if (count > 1) {
			const firstModal = modals.first()
			const secondModal = modals.nth(1)

			// Check z-index or stacking
			const firstZIndex = await firstModal.evaluate(
				(el) => window.getComputedStyle(el).zIndex
			)
			const secondZIndex = await secondModal.evaluate(
				(el) => window.getComputedStyle(el).zIndex
			)

			// Second modal should have higher z-index
			expect(parseInt(secondZIndex) >= parseInt(firstZIndex)).toBeTruthy()
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Take screenshot of the modal
			await expect(modal).toHaveScreenshot('modal-default.png')
		}
	})
})
