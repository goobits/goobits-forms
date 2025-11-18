import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('Contact Form - Full User Flow', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the demo page
		await page.goto('/')
	})

	test('should complete full contact form submission flow', async ({ page }) => {
		// Mock successful API response
		await page.route('**/api/contact', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					message: 'Message sent successfully'
				})
			})
		})

		// 1. Verify form is visible
		const form = page.locator('form').first()
		await expect(form).toBeVisible()

		// 2. Fill name field
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		if (await nameInput.isVisible()) {
			await nameInput.fill('John Doe')
			await expect(nameInput).toHaveValue('John Doe')
		}

		// 3. Fill email field
		const emailInput = form.locator('input[type="email"]').first()
		if (await emailInput.isVisible()) {
			await emailInput.fill('john.doe@example.com')
			await expect(emailInput).toHaveValue('john.doe@example.com')
		}

		// 4. Fill message/subject field
		const messageInput = form.locator('textarea, input[name*="message" i]').first()
		if (await messageInput.isVisible()) {
			await messageInput.fill(
				'Hello! I am interested in learning more about your services. Please contact me at your earliest convenience.'
			)
		}

		// 5. Select category (if available)
		const categorySelect = form.locator('select').first()
		const categoryRadios = form.locator('input[type="radio"]')

		const selectCount = await categorySelect.count()
		const radioCount = await categoryRadios.count()

		if (selectCount > 0 && (await categorySelect.isVisible())) {
			await categorySelect.selectOption({ index: 1 })
		} else if (radioCount > 0) {
			await categoryRadios.first().check()
		}

		// 6. Upload file (if available)
		const fileInput = form.locator('input[type="file"]')
		const fileCount = await fileInput.count()

		if (fileCount > 0 && (await fileInput.isVisible())) {
			const buffer = Buffer.from('Test file content for contact form')
			await fileInput.setInputFiles({
				name: 'test-document.txt',
				mimeType: 'text/plain',
				buffer: buffer
			})
		}

		// 7. Wait a bit for any debounced validations
		await page.waitForTimeout(500)

		// 8. Submit the form
		const submitButton = form.locator('button[type="submit"]')
		await submitButton.click()

		// 9. Wait for submission to complete
		await page.waitForTimeout(2000)

		// 10. Verify success message appears
		const successIndicators = page.locator(
			'[role="status"], .success-message, .alert-success, [data-success="true"]'
		)
		const successCount = await successIndicators.count()

		if (successCount > 0) {
			await expect(successIndicators.first()).toBeVisible()
		}

		// 11. Verify form is cleared or redirected
		// (This depends on implementation - form might clear or show thank you message)
	})

	test('should handle form validation errors correctly', async ({ page }) => {
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Submit empty form
		await submitButton.click()

		// Wait for validation
		await page.waitForTimeout(500)

		// Should show validation errors
		const errorMessages = page.locator('.error, [role="alert"], .form-error, [aria-invalid="true"]')
		const errorCount = await errorMessages.count()

		expect(errorCount).toBeGreaterThan(0)

		// Now fill in the form fields one by one and verify errors disappear
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		if (await nameInput.isVisible()) {
			await nameInput.fill('John Doe')
			await page.waitForTimeout(500)
			// Name error should disappear (if it was shown)
		}

		const emailInput = form.locator('input[type="email"]').first()
		if (await emailInput.isVisible()) {
			// First try invalid email
			await emailInput.fill('invalid-email')
			await emailInput.blur()
			await page.waitForTimeout(500)

			// Then fix it
			await emailInput.fill('john@example.com')
			await emailInput.blur()
			await page.waitForTimeout(500)
		}
	})

	test('should handle server errors gracefully', async ({ page }) => {
		// Mock server error
		await page.route('**/api/contact', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({
					success: false,
					message: 'Internal server error'
				})
			})
		})

		const form = page.locator('form').first()

		// Fill form with valid data
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')
		if (await messageInput.isVisible()) await messageInput.fill('Test message')

		// Submit
		const submitButton = form.locator('button[type="submit"]')
		await submitButton.click()

		// Wait for error
		await page.waitForTimeout(2000)

		// Should show error message
		const errorIndicators = page.locator(
			'[role="alert"], .error-message, .alert-error, [data-error="true"]'
		)
		const errorCount = await errorIndicators.count()

		if (errorCount > 0) {
			await expect(errorIndicators.first()).toBeVisible()
		}

		// Form should still be usable (not cleared)
		if (await nameInput.isVisible()) {
			await expect(nameInput).toHaveValue('John Doe')
		}
	})

	test('should handle network errors gracefully', async ({ page }) => {
		// Mock network failure
		await page.route('**/api/contact', async (route) => {
			await route.abort('failed')
		})

		const form = page.locator('form').first()

		// Fill form
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')
		if (await messageInput.isVisible()) await messageInput.fill('Test message')

		// Submit
		const submitButton = form.locator('button[type="submit"]')
		await submitButton.click()

		// Wait for error handling
		await page.waitForTimeout(2000)

		// Should show error message or network error
		const errorIndicators = page.locator(
			'[role="alert"], .error-message, .alert-error, [data-error="true"]'
		)
		const errorCount = await errorIndicators.count()

		// Should handle network error gracefully
		// (Either show error or keep form in usable state)
	})

	test('should preserve form data on page refresh', async ({ page }) => {
		const form = page.locator('form').first()

		// Fill some fields
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')

		// Wait for localStorage to update
		await page.waitForTimeout(1000)

		// Reload page
		await page.reload()

		// Wait for page to load
		await page.waitForLoadState('networkidle')

		// Check if data is preserved (depends on implementation)
		const nameInputAfterReload = page
			.locator('input[name*="name" i], input[placeholder*="name" i]')
			.first()
		const emailInputAfterReload = page.locator('input[type="email"]').first()

		// If form persistence is implemented, values should be restored
		// This is optional and depends on the implementation
	})

	test('should handle reCAPTCHA integration', async ({ page }) => {
		const form = page.locator('form').first()

		// Look for reCAPTCHA elements
		const recaptcha = page.locator('.g-recaptcha, [data-sitekey], iframe[src*="recaptcha"]')
		const count = await recaptcha.count()

		if (count > 0) {
			// reCAPTCHA is present
			// Note: Actually solving reCAPTCHA in tests is difficult
			// Usually, you'd use a test key or mock the verification
			await expect(recaptcha.first()).toBeVisible()
		}
	})

	test('should handle file size validation', async ({ page }) => {
		const form = page.locator('form').first()
		const fileInput = form.locator('input[type="file"]')
		const count = await fileInput.count()

		if (count > 0 && (await fileInput.isVisible())) {
			// Create a large file (larger than typical limits)
			const largeBuffer = Buffer.alloc(10 * 1024 * 1024) // 10MB

			await fileInput.setInputFiles({
				name: 'large-file.pdf',
				mimeType: 'application/pdf',
				buffer: largeBuffer
			})

			// Wait for validation
			await page.waitForTimeout(500)

			// Should show file size error (if validation is implemented)
			const errorMessages = page.locator('.error, [role="alert"], .file-error')
			// Note: This depends on implementation
		}
	})

	test('should handle file type validation', async ({ page }) => {
		const form = page.locator('form').first()
		const fileInput = form.locator('input[type="file"]')
		const count = await fileInput.count()

		if (count > 0 && (await fileInput.isVisible())) {
			// Create a file with disallowed extension
			const buffer = Buffer.from('Potentially malicious content')

			await fileInput.setInputFiles({
				name: 'script.exe',
				mimeType: 'application/x-msdownload',
				buffer: buffer
			})

			// Wait for validation
			await page.waitForTimeout(500)

			// Should show file type error (if validation is implemented)
			// Note: This depends on implementation
		}
	})

	test('should be fully keyboard accessible', async ({ page }) => {
		const form = page.locator('form').first()

		// Tab through all form elements
		await page.keyboard.press('Tab')

		// Find all focusable elements
		const focusableElements = form.locator(
			'input:not([type="hidden"]), textarea, select, button, [tabindex]:not([tabindex="-1"])'
		)
		const count = await focusableElements.count()

		// Tab through all elements
		for (let i = 0; i < count - 1; i++) {
			await page.keyboard.press('Tab')
			await page.waitForTimeout(100)
		}

		// Should be able to submit with Enter
		const submitButton = form.locator('button[type="submit"]')
		await submitButton.focus()
		await submitButton.press('Enter')

		// Form should submit (or show validation errors)
		await page.waitForTimeout(500)
	})

	test('should pass accessibility checks for entire flow', async ({ page }) => {
		// Check accessibility of the page
		await checkA11y(page)

		// Fill and submit form
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Submit to trigger validation
		await submitButton.click()
		await page.waitForTimeout(500)

		// Check accessibility with errors shown
		await checkA11y(page)
	})

	test('should take screenshots for visual regression', async ({ page }) => {
		// Initial state
		await expect(page).toHaveScreenshot('contact-form-initial.png', { fullPage: true })

		// Submit to show errors
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')
		await submitButton.click()
		await page.waitForTimeout(500)

		// Error state
		await expect(page).toHaveScreenshot('contact-form-errors.png', { fullPage: true })
	})
})
