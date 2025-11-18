import { test as base, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Extended test fixture with custom utilities
 */
export const test = base.extend({
	// Add custom fixtures here if needed
})

export { expect }

/**
 * Check accessibility violations using axe-core
 * @param page - Playwright page object
 * @param context - Optional context selector to scope the accessibility check
 */
export async function checkA11y(page: Page, context?: string) {
	const builder = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])

	if (context) {
		builder.include(context)
	}

	const results = await builder.analyze()

	expect(results.violations).toEqual([])
}

/**
 * Wait for element to be visible
 * @param page - Playwright page object
 * @param selector - CSS selector
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForVisible(page: Page, selector: string, timeout = 5000) {
	await page.waitForSelector(selector, { state: 'visible', timeout })
}

/**
 * Wait for element to be hidden
 * @param page - Playwright page object
 * @param selector - CSS selector
 * @param timeout - Optional timeout in milliseconds
 */
export async function waitForHidden(page: Page, selector: string, timeout = 5000) {
	await page.waitForSelector(selector, { state: 'hidden', timeout })
}

/**
 * Take a screenshot with a custom name
 * @param page - Playwright page object
 * @param name - Screenshot name
 */
export async function takeScreenshot(page: Page, name: string) {
	await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true })
}

/**
 * Mock API response
 * @param page - Playwright page object
 * @param url - URL pattern to intercept
 * @param response - Mock response data
 */
export async function mockApiResponse(page: Page, url: string, response: any) {
	await page.route(url, (route) => {
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(response)
		})
	})
}

/**
 * Fill form field with label
 * @param page - Playwright page object
 * @param label - Label text
 * @param value - Value to fill
 */
export async function fillFieldByLabel(page: Page, label: string, value: string) {
	const field = page.getByLabel(label)
	await field.fill(value)
}

/**
 * Check if element has focus
 * @param page - Playwright page object
 * @param selector - CSS selector
 */
export async function hasFocus(page: Page, selector: string): Promise<boolean> {
	return await page.evaluate((sel) => {
		const element = document.querySelector(sel)
		return document.activeElement === element
	}, selector)
}

/**
 * Press key on element
 * @param page - Playwright page object
 * @param selector - CSS selector
 * @param key - Key to press
 */
export async function pressKey(page: Page, selector: string, key: string) {
	await page.locator(selector).press(key)
}

/**
 * Wait for network to be idle
 * @param page - Playwright page object
 */
export async function waitForNetworkIdle(page: Page) {
	await page.waitForLoadState('networkidle')
}

/**
 * Check if element is visible
 * @param page - Playwright page object
 * @param selector - CSS selector
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
	return await page.locator(selector).isVisible()
}

/**
 * Get element count
 * @param page - Playwright page object
 * @param selector - CSS selector
 */
export async function getCount(page: Page, selector: string): Promise<number> {
	return await page.locator(selector).count()
}
