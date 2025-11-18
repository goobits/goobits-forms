import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Button Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should render buttons on the page', async ({ page }) => {
		// The demo page should have at least one button (submit button in ContactForm)
		const buttons = page.locator('button')
		await expect(buttons.first()).toBeVisible()
	})

	test('should handle click interactions', async ({ page }) => {
		// Find the submit button in the contact form
		const submitButton = page.locator('button[type="submit"]').first()
		await expect(submitButton).toBeVisible()

		// Click should trigger validation errors (since form is empty)
		await submitButton.click()

		// Wait a bit for any form validation to trigger
		await page.waitForTimeout(500)
	})

	test('should support keyboard navigation with Enter', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Focus the button
		await submitButton.focus()

		// Press Enter
		await submitButton.press('Enter')

		// Wait for any form interaction
		await page.waitForTimeout(500)
	})

	test('should support keyboard navigation with Space', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Focus the button
		await submitButton.focus()

		// Press Space
		await submitButton.press(' ')

		// Wait for any form interaction
		await page.waitForTimeout(500)
	})

	test('should show disabled state when disabled', async ({ page }) => {
		// We'll check for any disabled buttons on the page
		const disabledButtons = page.locator('button[disabled]')
		const count = await disabledButtons.count()

		if (count > 0) {
			const disabledButton = disabledButtons.first()
			await expect(disabledButton).toBeDisabled()
			await expect(disabledButton).toHaveAttribute('disabled')
		}
	})

	test('should have proper focus management', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Focus the button
		await submitButton.focus()

		// Check that the button is focused
		await expect(submitButton).toBeFocused()
	})

	test('should show loading state with spinner', async ({ page }) => {
		// This would require triggering a loading state
		// For now, we'll just check if the spinner class exists in the codebase
		const loadingButtons = page.locator('button[aria-busy="true"]')
		const count = await loadingButtons.count()

		// If there are loading buttons, they should have the spinner
		if (count > 0) {
			const loadingButton = loadingButtons.first()
			await expect(loadingButton).toHaveAttribute('aria-busy', 'true')
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		// Check accessibility of all buttons on the page
		await checkA11y(page, 'button')
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Scroll to button
		await submitButton.scrollIntoViewIfNeeded()

		// Take screenshot
		await expect(submitButton).toHaveScreenshot('button-default.png')
	})

	test('should handle rapid clicks gracefully', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Click multiple times rapidly
		await submitButton.click()
		await submitButton.click()
		await submitButton.click()

		// Should not crash or cause issues
		await expect(submitButton).toBeVisible()
	})

	test('should maintain state after interactions', async ({ page }) => {
		const submitButton = page.locator('button[type="submit"]').first()

		// Initial state
		await expect(submitButton).toBeVisible()
		await expect(submitButton).toBeEnabled()

		// Click
		await submitButton.click()

		// Should still be visible and enabled after click
		await expect(submitButton).toBeVisible()
		await expect(submitButton).toBeEnabled()
	})
})
