import { test, expect } from '@playwright/test'

import { getProtectedRoutes, getPublicRoutes } from './route-discovery.js'
import { attachIssueCollectors } from './site-health.js'

async function assertHealthyNavigation(page, route) {
	const issues = attachIssueCollectors(page)
	const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

	expect(response, `No response for ${route}`).not.toBeNull()
	expect(response.ok(), `Main document failed for ${route} with status ${response.status()}`).toBeTruthy()

	await page.waitForTimeout(250) // test-shape: timing-probe - documented test timing behavior.
	await page.waitForLoadState('load')
	await page.waitForLoadState('networkidle', { timeout: 2_000 }).catch(() => { })

	expect(
		await page.locator('enhanced\\:img').count(),
		`Uncompiled enhanced:img elements on ${route}`
	).toBe(0)
	expect(issues.consoleErrors, `Console errors on ${route}`).toEqual([])
	expect(issues.pageErrors, `Uncaught page errors on ${route}`).toEqual([])
	expect(issues.failedRequests, `Failed requests on ${route}`).toEqual([])
	expect(issues.badResponses, `HTTP loading failures on ${route}`).toEqual([])
}

test.describe('Site route smoke audit', () => {
	for (const route of getPublicRoutes()) {
		test(`public route ${route}`, async ({ page }) => {
			await assertHealthyNavigation(page, route)
		})
	}

	for (const route of getProtectedRoutes()) {
		test(`protected route ${route} redirects cleanly`, async ({ page }) => {
			const issues = attachIssueCollectors(page)
			const response = await page.goto(route, { waitUntil: 'domcontentloaded' })

			expect(response, `No response for ${route}`).not.toBeNull()
			expect(response.ok(), `Protected route ${route} should land on login, got ${response.status()}`).toBeTruthy()
			await page.waitForLoadState('load')

			expect(page.url(), `Protected route ${route} should redirect to login`).toContain('/login')
			expect(issues.consoleErrors, `Console errors on protected route ${route}`).toEqual([])
			expect(issues.pageErrors, `Uncaught page errors on protected route ${route}`).toEqual([])
			expect(issues.failedRequests, `Failed requests on protected route ${route}`).toEqual([])
			expect(issues.badResponses, `HTTP loading failures on protected route ${route}`).toEqual([])
		})
	}
})
