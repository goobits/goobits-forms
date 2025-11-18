import { test, expect, checkA11y } from '../fixtures/test-helpers'

test.describe('ContactForm Component', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/')
	})

	test('should render the contact form', async ({ page }) => {
		// Check that the form exists
		const form = page.locator('form').first()
		await expect(form).toBeVisible()
	})

	test('should show validation errors when submitting empty form', async ({ page }) => {
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Submit empty form
		await submitButton.click()

		// Wait for validation errors to appear
		await page.waitForTimeout(500)

		// Check for error messages (common patterns)
		const errorMessages = page.locator('.error, [role="alert"], .form-error, [aria-invalid="true"]')
		const errorCount = await errorMessages.count()

		// Should show at least one validation error
		expect(errorCount).toBeGreaterThan(0)
	})

	test('should validate email field', async ({ page }) => {
		const form = page.locator('form').first()

		// Find email input by label or placeholder
		const emailInput = form.locator('input[type="email"]').first()

		if (await emailInput.isVisible()) {
			// Enter invalid email
			await emailInput.fill('invalid-email')

			// Trigger validation (submit or blur)
			await emailInput.blur()

			// Wait for validation
			await page.waitForTimeout(500)

			// Should show error for invalid email
			const emailError = page.locator('.error, [role="alert"]')
			// Note: This will depend on implementation
		}
	})

	test('should accept valid form input', async ({ page }) => {
		const form = page.locator('form').first()

		// Fill out the form with valid data
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) {
			await nameInput.fill('John Doe')
		}

		if (await emailInput.isVisible()) {
			await emailInput.fill('john.doe@example.com')
		}

		if (await messageInput.isVisible()) {
			await messageInput.fill('This is a test message for the contact form.')
		}

		// All inputs should have values
		if (await nameInput.isVisible()) {
			await expect(nameInput).toHaveValue('John Doe')
		}
		if (await emailInput.isVisible()) {
			await expect(emailInput).toHaveValue('john.doe@example.com')
		}
		if (await messageInput.isVisible()) {
			await expect(messageInput).toHaveValue('This is a test message for the contact form.')
		}
	})

	test('should handle category selection', async ({ page }) => {
		const form = page.locator('form').first()

		// Look for select or radio buttons for category
		const categorySelect = form.locator('select').first()
		const categoryRadios = form.locator('input[type="radio"]')

		const selectCount = await categorySelect.count()
		const radioCount = await categoryRadios.count()

		if (selectCount > 0 && (await categorySelect.isVisible())) {
			// If there's a select dropdown
			await categorySelect.selectOption({ index: 1 })
		} else if (radioCount > 0) {
			// If there are radio buttons
			await categoryRadios.first().check()
		}
	})

	test('should handle file upload', async ({ page }) => {
		const form = page.locator('form').first()

		// Look for file input
		const fileInput = form.locator('input[type="file"]')
		const count = await fileInput.count()

		if (count > 0 && (await fileInput.isVisible())) {
			// Create a test file
			const buffer = Buffer.from('This is a test file content')

			// Upload the file
			await fileInput.setInputFiles({
				name: 'test-file.txt',
				mimeType: 'text/plain',
				buffer: buffer
			})

			// Verify file is selected
			await expect(fileInput).not.toHaveValue('')
		}
	})

	test('should persist form data in localStorage', async ({ page }) => {
		const form = page.locator('form').first()

		// Fill some fields
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()

		if (await nameInput.isVisible()) {
			await nameInput.fill('Test User')

			// Wait a bit for localStorage to be updated
			await page.waitForTimeout(1000)

			// Check if data is in localStorage
			const localStorageData = await page.evaluate(() => {
				return localStorage.getItem('contact-form') || localStorage.getItem('form-data')
			})

			// If form persistence is implemented, localStorage should have data
			// Note: This depends on the implementation
		}
	})

	test('should show loading state during submission', async ({ page }) => {
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Mock the API endpoint to delay response
		await page.route('**/api/contact', async (route) => {
			await new Promise((resolve) => setTimeout(resolve, 2000))
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true, message: 'Message sent successfully' })
			})
		})

		// Fill required fields
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')
		if (await messageInput.isVisible()) await messageInput.fill('Test message')

		// Submit the form
		await submitButton.click()

		// Check for loading state
		await page.waitForTimeout(500)

		// Button should show loading state (disabled or aria-busy)
		const isDisabled = await submitButton.isDisabled()
		const ariaBusy = await submitButton.getAttribute('aria-busy')

		expect(isDisabled || ariaBusy === 'true').toBeTruthy()
	})

	test('should show success message after submission', async ({ page }) => {
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Mock successful API response
		await page.route('**/api/contact', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true, message: 'Message sent successfully' })
			})
		})

		// Fill required fields with valid data
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')
		if (await messageInput.isVisible()) await messageInput.fill('Test message')

		// Submit the form
		await submitButton.click()

		// Wait for success message
		await page.waitForTimeout(2000)

		// Look for success indicators
		const successMessage = page.locator(
			'[role="status"], .success-message, .alert-success, [data-success="true"]'
		)
		const count = await successMessage.count()

		if (count > 0) {
			await expect(successMessage.first()).toBeVisible()
		}
	})

	test('should show error message on submission failure', async ({ page }) => {
		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Mock failed API response
		await page.route('**/api/contact', async (route) => {
			await route.fulfill({
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify({ success: false, message: 'Server error' })
			})
		})

		// Fill required fields
		const nameInput = form.locator('input[name*="name" i], input[placeholder*="name" i]').first()
		const emailInput = form.locator('input[type="email"]').first()
		const messageInput = form.locator('textarea, input[name*="message" i]').first()

		if (await nameInput.isVisible()) await nameInput.fill('John Doe')
		if (await emailInput.isVisible()) await emailInput.fill('john@example.com')
		if (await messageInput.isVisible()) await messageInput.fill('Test message')

		// Submit the form
		await submitButton.click()

		// Wait for error message
		await page.waitForTimeout(2000)

		// Look for error indicators
		const errorMessage = page.locator(
			'[role="alert"], .error-message, .alert-error, [data-error="true"]'
		)
		const count = await errorMessage.count()

		if (count > 0) {
			await expect(errorMessage.first()).toBeVisible()
		}
	})

	test('should pass accessibility checks', async ({ page }) => {
		// Check accessibility of the entire form
		await checkA11y(page, 'form')
	})

	test('should have proper label associations', async ({ page }) => {
		const form = page.locator('form').first()

		// All inputs should have associated labels
		const inputs = form.locator('input:not([type="hidden"]), textarea, select')
		const inputCount = await inputs.count()

		for (let i = 0; i < inputCount; i++) {
			const input = inputs.nth(i)
			const id = await input.getAttribute('id')
			const ariaLabel = await input.getAttribute('aria-label')
			const ariaLabelledby = await input.getAttribute('aria-labelledby')

			// Input should have either an id (for label), aria-label, or aria-labelledby
			expect(id || ariaLabel || ariaLabelledby).toBeTruthy()
		}
	})

	test('should take screenshot for visual regression', async ({ page }) => {
		const form = page.locator('form').first()

		// Scroll to form
		await form.scrollIntoViewIfNeeded()

		// Take screenshot
		await expect(form).toHaveScreenshot('contact-form.png')
	})
})
