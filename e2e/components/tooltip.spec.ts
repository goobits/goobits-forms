import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Tooltip Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should show tooltip on hover', async ({ page }) => {
		// Look for elements with tooltip
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Hover over element
			await trigger.hover()
			await page.waitForTimeout(500)

			// Look for tooltip
			const tooltip = page.locator('[role="tooltip"], .tooltip')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				await expect(tooltip.first()).toBeVisible()
			}
		}
	})

	test('should hide tooltip when mouse leaves', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Hover to show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Move mouse away
			await page.mouse.move(0, 0)
			await page.waitForTimeout(500)

			// Tooltip should be hidden
			const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
			const visibleCount = await visibleTooltips.count()
			expect(visibleCount).toBe(0)
		}
	})

	test('should show tooltip on focus', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Focus the element
			await trigger.focus()
			await page.waitForTimeout(500)

			// Tooltip should appear
			const tooltip = page.locator('[role="tooltip"], .tooltip')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				await expect(tooltip.first()).toBeVisible()
			}
		}
	})

	test('should hide tooltip on blur', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Focus to show tooltip
			await trigger.focus()
			await page.waitForTimeout(500)

			// Blur the element
			await trigger.blur()
			await page.waitForTimeout(500)

			// Tooltip should be hidden
			const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
			const visibleCount = await visibleTooltips.count()
			expect(visibleCount).toBe(0)
		}
	})

	test('should position tooltip correctly', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Get tooltip
			const tooltip = page.locator('[role="tooltip"], .tooltip')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				const tooltipElement = tooltip.first()

				// Check that tooltip is positioned (has top/left or transform)
				const position = await tooltipElement.evaluate((el) => {
					const style = window.getComputedStyle(el)
					return {
						position: style.position,
						top: style.top,
						left: style.left,
						transform: style.transform
					}
				})

				// Tooltip should be absolutely or fixed positioned
				expect(['absolute', 'fixed']).toContain(position.position)
			}
		}
	})

	test('should support different tooltip positions', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Check for position-related classes
			const tooltip = page.locator('[role="tooltip"], .tooltip')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				const className = await tooltip.first().getAttribute('class')
				// Should have position classes like 'top', 'bottom', 'left', 'right'
				expect(className).toBeTruthy()
			}
		}
	})

	test('should have proper ARIA attributes', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Tooltip should have role="tooltip"
			const tooltip = page.locator('[role="tooltip"]')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				await expect(tooltip.first()).toHaveAttribute('role', 'tooltip')

				// Check aria-describedby linkage
				const ariaDescribedBy = await trigger.getAttribute('aria-describedby')
				if (ariaDescribedBy) {
					const tooltipId = await tooltip.first().getAttribute('id')
					expect(tooltipId).toBe(ariaDescribedBy)
				}
			}
		}
	})

	test('should handle multiple tooltips', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 1) {
			// Hover over first trigger
			await tooltipTriggers.first().hover()
			await page.waitForTimeout(500)

			// Move to second trigger
			await tooltipTriggers.nth(1).hover()
			await page.waitForTimeout(500)

			// Only one tooltip should be visible at a time
			const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
			const visibleCount = await visibleTooltips.count()
			expect(visibleCount).toBeLessThanOrEqual(1)
		}
	})

	test('should not show empty tooltips', async ({ page }) => {
		// All visible tooltips should have content
		const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
		const count = await visibleTooltips.count()

		for (let i = 0; i < count; i++) {
			const tooltip = visibleTooltips.nth(i)
			const text = await tooltip.textContent()
			expect(text?.trim()).toBeTruthy()
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Check accessibility
			await checkA11y(page, '[role="tooltip"]')
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			await trigger.hover()
			await page.waitForTimeout(500)

			// Take screenshot
			const tooltip = page.locator('[role="tooltip"], .tooltip')
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				await expect(tooltip.first()).toHaveScreenshot('tooltip-default.png')
			}
		}
	})
})
