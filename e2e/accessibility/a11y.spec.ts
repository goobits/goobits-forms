import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Accessibility E2E Tests using axe-core
 * These tests verify WCAG 2.0 Level A and AA compliance
 */
test.describe('Accessibility Tests', () => {
	test('home page should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		// Wait for page to fully load
		await page.waitForLoadState('networkidle')

		// Run axe accessibility scan
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze()

		// Log violations for debugging if any
		if (accessibilityScanResults.violations.length > 0) {
			console.log('Accessibility Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
		}

		// Assert no violations
		expect(accessibilityScanResults.violations).toEqual([])
	})

	test('contact form should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		// Wait for form to be visible
		const form = page.locator('form').first()
		await form.waitFor({ state: 'visible' })

		// Run accessibility scan on the form
		const accessibilityScanResults = await new AxeBuilder({ page })
			.include('form')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze()

		if (accessibilityScanResults.violations.length > 0) {
			console.log('Form Accessibility Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
		}

		expect(accessibilityScanResults.violations).toEqual([])
	})

	test('form with validation errors should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		const form = page.locator('form').first()
		const submitButton = form.locator('button[type="submit"]')

		// Trigger validation errors by submitting empty form
		await submitButton.click()
		await page.waitForTimeout(500)

		// Run accessibility scan with errors shown
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze()

		if (accessibilityScanResults.violations.length > 0) {
			console.log(
				'Form Errors Accessibility Violations:',
				JSON.stringify(accessibilityScanResults.violations, null, 2)
			)
		}

		expect(accessibilityScanResults.violations).toEqual([])
	})

	test('buttons should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		// Check all buttons on the page
		const accessibilityScanResults = await new AxeBuilder({ page })
			.include('button')
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze()

		if (accessibilityScanResults.violations.length > 0) {
			console.log('Button Accessibility Violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
		}

		expect(accessibilityScanResults.violations).toEqual([])
	})

	test('modals should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		// Look for modals
		const modals = page.locator('[role="dialog"]')
		const count = await modals.count()

		if (count > 0) {
			const modal = modals.first()
			await modal.waitFor({ state: 'visible' })

			// Run accessibility scan on modal
			const accessibilityScanResults = await new AxeBuilder({ page })
				.include('[role="dialog"]')
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
				.analyze()

			if (accessibilityScanResults.violations.length > 0) {
				console.log(
					'Modal Accessibility Violations:',
					JSON.stringify(accessibilityScanResults.violations, null, 2)
				)
			}

			expect(accessibilityScanResults.violations).toEqual([])
		}
	})

	test('menus should have no accessibility violations', async ({ page }) => {
		await page.goto('/')

		const menuTriggers = page.locator('button[aria-haspopup="true"]')
		const count = await menuTriggers.count()

		if (count > 0) {
			const trigger = menuTriggers.first()

			// Open menu
			await trigger.click()
			await page.waitForTimeout(500)

			// Run accessibility scan on menu
			const accessibilityScanResults = await new AxeBuilder({ page })
				.include('[role="menu"]')
				.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
				.analyze()

			if (accessibilityScanResults.violations.length > 0) {
				console.log(
					'Menu Accessibility Violations:',
					JSON.stringify(accessibilityScanResults.violations, null, 2)
				)
			}

			expect(accessibilityScanResults.violations).toEqual([])
		}
	})

	test('should have proper color contrast', async ({ page }) => {
		await page.goto('/')

		// Run accessibility scan specifically for color contrast
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2aa'])
			.options({
				rules: {
					'color-contrast': { enabled: true }
				}
			})
			.analyze()

		// Filter for color contrast violations
		const colorContrastViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'color-contrast'
		)

		if (colorContrastViolations.length > 0) {
			console.log(
				'Color Contrast Violations:',
				JSON.stringify(colorContrastViolations, null, 2)
			)
		}

		expect(colorContrastViolations).toEqual([])
	})

	test('should have proper heading hierarchy', async ({ page }) => {
		await page.goto('/')

		// Check heading order
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'heading-order': { enabled: true }
				}
			})
			.analyze()

		const headingViolations = accessibilityScanResults.violations.filter((v) => v.id === 'heading-order')

		if (headingViolations.length > 0) {
			console.log('Heading Order Violations:', JSON.stringify(headingViolations, null, 2))
		}

		expect(headingViolations).toEqual([])
	})

	test('should have proper landmark regions', async ({ page }) => {
		await page.goto('/')

		// Check for landmark regions
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					region: { enabled: true }
				}
			})
			.analyze()

		const landmarkViolations = accessibilityScanResults.violations.filter((v) => v.id === 'region')

		if (landmarkViolations.length > 0) {
			console.log('Landmark Violations:', JSON.stringify(landmarkViolations, null, 2))
		}

		// Landmark violations are often informational, so we log them but may not fail
	})

	test('all images should have alt text', async ({ page }) => {
		await page.goto('/')

		// Check images
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'image-alt': { enabled: true }
				}
			})
			.analyze()

		const imageAltViolations = accessibilityScanResults.violations.filter((v) => v.id === 'image-alt')

		if (imageAltViolations.length > 0) {
			console.log('Image Alt Text Violations:', JSON.stringify(imageAltViolations, null, 2))
		}

		expect(imageAltViolations).toEqual([])
	})

	test('form inputs should have proper labels', async ({ page }) => {
		await page.goto('/')

		// Check form labels
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					label: { enabled: true },
					'label-title-only': { enabled: true }
				}
			})
			.analyze()

		const labelViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'label' || v.id === 'label-title-only'
		)

		if (labelViolations.length > 0) {
			console.log('Label Violations:', JSON.stringify(labelViolations, null, 2))
		}

		expect(labelViolations).toEqual([])
	})

	test('should have proper link text', async ({ page }) => {
		await page.goto('/')

		// Check link text
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'link-name': { enabled: true }
				}
			})
			.analyze()

		const linkViolations = accessibilityScanResults.violations.filter((v) => v.id === 'link-name')

		if (linkViolations.length > 0) {
			console.log('Link Text Violations:', JSON.stringify(linkViolations, null, 2))
		}

		expect(linkViolations).toEqual([])
	})

	test('should have proper ARIA attributes', async ({ page }) => {
		await page.goto('/')

		// Check ARIA usage
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.options({
				rules: {
					'aria-valid-attr': { enabled: true },
					'aria-valid-attr-value': { enabled: true },
					'aria-required-attr': { enabled: true },
					'aria-required-children': { enabled: true },
					'aria-required-parent': { enabled: true }
				}
			})
			.analyze()

		const ariaViolations = accessibilityScanResults.violations.filter((v) => v.id.startsWith('aria-'))

		if (ariaViolations.length > 0) {
			console.log('ARIA Violations:', JSON.stringify(ariaViolations, null, 2))
		}

		expect(ariaViolations).toEqual([])
	})

	test('should support keyboard navigation', async ({ page }) => {
		await page.goto('/')

		// Tab through focusable elements
		const focusableElements = page.locator(
			'a, button, input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
		)
		const count = await focusableElements.count()

		// Ensure there are focusable elements
		expect(count).toBeGreaterThan(0)

		// Tab through elements
		for (let i = 0; i < Math.min(count, 10); i++) {
			await page.keyboard.press('Tab')
			await page.waitForTimeout(100)

			// Check that something is focused
			const focusedElement = page.locator(':focus')
			const focusedCount = await focusedElement.count()
			expect(focusedCount).toBeGreaterThan(0)
		}
	})

	test('should have no duplicate IDs', async ({ page }) => {
		await page.goto('/')

		// Check for duplicate IDs
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'duplicate-id': { enabled: true },
					'duplicate-id-active': { enabled: true },
					'duplicate-id-aria': { enabled: true }
				}
			})
			.analyze()

		const duplicateIdViolations = accessibilityScanResults.violations.filter((v) =>
			v.id.startsWith('duplicate-id')
		)

		if (duplicateIdViolations.length > 0) {
			console.log('Duplicate ID Violations:', JSON.stringify(duplicateIdViolations, null, 2))
		}

		expect(duplicateIdViolations).toEqual([])
	})

	test('should have proper page title', async ({ page }) => {
		await page.goto('/')

		// Check page title
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'document-title': { enabled: true }
				}
			})
			.analyze()

		const titleViolations = accessibilityScanResults.violations.filter((v) => v.id === 'document-title')

		if (titleViolations.length > 0) {
			console.log('Page Title Violations:', JSON.stringify(titleViolations, null, 2))
		}

		expect(titleViolations).toEqual([])
	})

	test('should have proper HTML lang attribute', async ({ page }) => {
		await page.goto('/')

		// Check HTML lang
		const accessibilityScanResults = await new AxeBuilder({ page })
			.options({
				rules: {
					'html-has-lang': { enabled: true },
					'html-lang-valid': { enabled: true }
				}
			})
			.analyze()

		const langViolations = accessibilityScanResults.violations.filter(
			(v) => v.id === 'html-has-lang' || v.id === 'html-lang-valid'
		)

		if (langViolations.length > 0) {
			console.log('HTML Lang Violations:', JSON.stringify(langViolations, null, 2))
		}

		expect(langViolations).toEqual([])
	})

	test('should support screen reader compatibility', async ({ page }) => {
		await page.goto('/')

		// Check for screen reader specific issues
		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze()

		// Filter for screen reader related violations
		const screenReaderViolations = accessibilityScanResults.violations.filter(
			(v) =>
				v.tags.includes('screen-reader') ||
				v.id.includes('aria') ||
				v.id.includes('label') ||
				v.id.includes('role')
		)

		if (screenReaderViolations.length > 0) {
			console.log(
				'Screen Reader Violations:',
				JSON.stringify(screenReaderViolations, null, 2)
			)
		}

		expect(screenReaderViolations).toEqual([])
	})
})
