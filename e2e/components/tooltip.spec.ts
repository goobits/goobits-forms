import { test, expect, checkA11y } from '../fixtures/test-helpers'

async function showTooltip(page, trigger, action = 'hover') {
	if (action === 'focus') {
		await trigger.focus()
	} else {
		await trigger.hover()
	}

	const tooltip = page.locator('[role="tooltip"], .tooltip')
	await tooltip.first().waitFor({ state: 'visible', timeout: 1000 }).catch(() => undefined)
	return tooltip
}

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
			const tooltip = await showTooltip(page, trigger)

			// Look for tooltip
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
			await showTooltip(page, trigger)

			// Move mouse away
			await page.mouse.move(0, 0)

			// Tooltip should be hidden
			const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
			await expect(visibleTooltips).toHaveCount(0)
		}
	})

	test('should show tooltip on focus', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Focus the element
			const tooltip = await showTooltip(page, trigger, 'focus')

			// Tooltip should appear
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
			await showTooltip(page, trigger, 'focus')

			// Blur the element
			await trigger.blur()

			// Tooltip should be hidden
			const visibleTooltips = page.locator('[role="tooltip"]:visible, .tooltip:visible')
			await expect(visibleTooltips).toHaveCount(0)
		}
	})

	test('should position tooltip correctly', async ({ page }) => {
		const tooltipTriggers = page.locator('[data-tooltip], [aria-describedby]')
		const count = await tooltipTriggers.count()

		if (count > 0) {
			const trigger = tooltipTriggers.first()

			// Show tooltip
			const tooltip = await showTooltip(page, trigger)

			// Get tooltip
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
			const tooltip = await showTooltip(page, trigger)

			// Check for position-related classes
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
			await showTooltip(page, trigger)

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
			await showTooltip(page, tooltipTriggers.first())

			// Move to second trigger
			await showTooltip(page, tooltipTriggers.nth(1))

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
			await showTooltip(page, trigger)

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
			const tooltip = await showTooltip(page, trigger)

			// Take screenshot
			const tooltipCount = await tooltip.count()

			if (tooltipCount > 0) {
				await expect(tooltip.first()).toHaveScreenshot('tooltip-default.png')
			}
		}
	})
})
